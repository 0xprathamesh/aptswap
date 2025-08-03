const { AptosClient, Account } = require("@aptos-labs/ts-sdk");

// Configuration
const APTOS_NODE_URL =
  process.env.APTOS_NODE_URL || "https://fullnode.mainnet.aptoslabs.com/v1";
const PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY || "";

// Initialize Aptos client
const client = new AptosClient(APTOS_NODE_URL);

// Create account from private key
const privateKeyBytes = new Uint8Array(
  PRIVATE_KEY.slice(2)
    .match(/.{1,2}/g)
    .map((byte) => parseInt(byte, 16))
);
const account = new Account(privateKeyBytes);

console.log("=== Aptos Cross-Swaps Deployment ===");
console.log("Account address:", account.address().toString());
console.log("Node URL:", APTOS_NODE_URL);

async function deployContracts() {
  try {
    // Read Move modules
    const fs = require("fs");
    const path = require("path");

    const swapModule = fs.readFileSync(
      path.join(__dirname, "sources/swap_v3.move"),
      "utf8"
    );
    const tokenModule = fs.readFileSync(
      path.join(__dirname, "sources/my_token.move"),
      "utf8"
    );

    console.log("\n1. Deploying MyToken module...");

    // Deploy MyToken module
    const tokenPayload = {
      type: "module_bundle_payload",
      modules: [
        {
          bytecode: `0x${Buffer.from(tokenModule).toString("hex")}`,
        },
      ],
    };

    const tokenTxn = await client.generateTransaction(
      account.address(),
      tokenPayload
    );
    const tokenSignedTxn = await client.signTransaction(account, tokenTxn);
    const tokenResult = await client.submitTransaction(tokenSignedTxn);
    await client.waitForTransaction(tokenResult.hash);

    console.log("✅ MyToken deployed at:", account.address().toString());

    console.log("\n2. Deploying SwapV3 module...");

    // Deploy SwapV3 module
    const swapPayload = {
      type: "module_bundle_payload",
      modules: [
        {
          bytecode: `0x${Buffer.from(swapModule).toString("hex")}`,
        },
      ],
    };

    const swapTxn = await client.generateTransaction(
      account.address(),
      swapPayload
    );
    const swapSignedTxn = await client.signTransaction(account, swapTxn);
    const swapResult = await client.submitTransaction(swapSignedTxn);
    await client.waitForTransaction(swapResult.hash);

    console.log("✅ SwapV3 deployed at:", account.address().toString());

    console.log("\n3. Initializing swap ledger...");

    // Initialize swap ledger
    const initPayload = {
      type: "entry_function_payload",
      function: `${account.address()}::swap_v3::initialize_swap_ledger`,
      type_arguments: [`${account.address()}::my_token::SimpleToken`],
      arguments: [],
    };

    const initTxn = await client.generateTransaction(
      account.address(),
      initPayload
    );
    const initSignedTxn = await client.signTransaction(account, initTxn);
    const initResult = await client.submitTransaction(initSignedTxn);
    await client.waitForTransaction(initResult.hash);

    console.log("✅ Swap ledger initialized");

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Network: Aptos Mainnet");
    console.log("Account:", account.address().toString());
    console.log("MyToken Module:", `${account.address()}::my_token`);
    console.log("SwapV3 Module:", `${account.address()}::swap_v3`);
    console.log("Swap Ledger:", "Initialized");
    console.log("\nDeployment completed successfully!");

    // Save deployment info
    const deploymentInfo = {
      network: "Aptos Mainnet",
      account: account.address().toString(),
      myTokenModule: `${account.address()}::my_token`,
      swapV3Module: `${account.address()}::swap_v3`,
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      "deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\nDeployment info saved to: deployment-info.json");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run deployment
deployContracts();
