import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { AptosClient, AptosAccount, HexString } from "aptos";

// Configuration
const CONFIG = {
  // Ethereum Sepolia
  SEPOLIA_RPC: "https://sepolia.infura.io/v3/cb77ec7104e04b26a8bba8520e720054",
  SEPOLIA_CONTRACT_ADDRESS: "0xBD64245289114b11B35C4fF35605a525a7dF1f53",
  SEPOLIA_RESOLVER_PRIVATE_KEY: process.env.SEPOLIA_RESOLVER_PRIVATE_KEY || "",
  SEPOLIA_RESOLVER: "0xEAde2298C7d1b5C748103da66D6Dd9Cf204E2AD2",

  // Aptos Devnet
  APTOS_NODE_URL: "https://fullnode.devnet.aptoslabs.com/v1",
  APTOS_CONTRACT_ADDRESS:
    "0xfc1515fc8a2c00692b2117e8594771923e823985f23ea1bbb0278ae95f742dba",
  APTOS_RESOLVER_PRIVATE_KEY:
    "e47bc1ab7808c62c9e2d01437891e9b9d69b8c1d845d317be14dea9b36bfe090",
  APTOS_RESOLVER:
    "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
};

class Resolver {
  private ethProvider: ethers.JsonRpcProvider;
  private aptosClient: AptosClient;
  private ethResolverWallet: ethers.Wallet;
  private aptosResolverAccount: AptosAccount;
  private ethContract: ethers.Contract;

  constructor() {
    this.ethProvider = new ethers.JsonRpcProvider(CONFIG.SEPOLIA_RPC);
    this.aptosClient = new AptosClient(CONFIG.APTOS_NODE_URL);

    this.ethResolverWallet = new ethers.Wallet(
      CONFIG.SEPOLIA_RESOLVER_PRIVATE_KEY,
      this.ethProvider
    );
    this.aptosResolverAccount = new AptosAccount(
      HexString.ensure(CONFIG.APTOS_RESOLVER_PRIVATE_KEY).toUint8Array()
    );

    this.ethContract = new ethers.Contract(
      CONFIG.SEPOLIA_CONTRACT_ADDRESS,
      [
        "function getSwap(string _swapId) external view returns (tuple(address sender, address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded, string swapId, uint8 swapType, string sourceChain, string destChain, string sourceTxHash, address resolverAddress, uint256 minAmount, uint256 createdAt, address token, string aptosReceiver))",
      ],
      this.ethResolverWallet
    );
  }

  async completeAptosSide(swapId: string, secret: string, aptosAmount: number) {
    try {
      console.log(`🔧 Completing Aptos side for swap: ${swapId}`);

      // Get swap details from Ethereum
      const swap = await this.ethContract.getSwap(swapId);
      console.log(`ETH Swap found: ${swap.swapId}`);
      console.log(`Hashlock: ${swap.hashlock}`);
      console.log(`Aptos Receiver: ${swap.aptosReceiver}`);

      // Convert secret to bytes
      const secretBytes = Array.from(ethers.getBytes(secret));
      console.log(`Secret bytes: [${secretBytes.join(", ")}]`);

      // Create Aptos swap record
      console.log("📝 Creating Aptos swap record...");
      const createPayload = {
        type: "entry_function_payload",
        function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::create_eth_to_aptos_swap`,
        arguments: [
          swap.aptosReceiver, // receiver
          aptosAmount.toString(), // expected_aptos_amount
          Array.from(ethers.getBytes(swap.hashlock)), // hashlock as bytes
          Number(swap.timelock), // timelock
          swapId, // swap_id
          swap.sourceTxHash || "eth_tx_hash", // source_tx_hash
          CONFIG.APTOS_RESOLVER, // resolver_address
          aptosAmount.toString(), // min_amount
        ],
        type_arguments: [],
      };

      const createTxnRequest = await this.aptosClient.generateTransaction(
        this.aptosResolverAccount.address(),
        createPayload
      );

      const signedCreateTxn = await this.aptosClient.signTransaction(
        this.aptosResolverAccount,
        createTxnRequest
      );

      const createTxnResult =
        await this.aptosClient.submitTransaction(signedCreateTxn);
      await this.aptosClient.waitForTransaction(createTxnResult.hash);

      const createTxn = await this.aptosClient.getTransactionByHash(
        createTxnResult.hash
      );
      if (
        createTxn &&
        "vm_status" in createTxn &&
        !createTxn.vm_status.includes("Executed")
      ) {
        throw new Error(`Aptos swap creation failed: ${createTxn.vm_status}`);
      }

      console.log(`✅ Aptos swap record created: ${createTxnResult.hash}`);

      // Provide Aptos liquidity
      console.log("💰 Providing Aptos liquidity...");
      const liquidityPayload = {
        type: "entry_function_payload",
        function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::provide_aptos_liquidity`,
        arguments: [swapId, aptosAmount.toString()],
        type_arguments: [],
      };

      const liquidityTxnRequest = await this.aptosClient.generateTransaction(
        this.aptosResolverAccount.address(),
        liquidityPayload
      );

      const signedLiquidityTxn = await this.aptosClient.signTransaction(
        this.aptosResolverAccount,
        liquidityTxnRequest
      );

      const liquidityTxnResult =
        await this.aptosClient.submitTransaction(signedLiquidityTxn);
      await this.aptosClient.waitForTransaction(liquidityTxnResult.hash);

      const liquidityTxn = await this.aptosClient.getTransactionByHash(
        liquidityTxnResult.hash
      );
      if (
        liquidityTxn &&
        "vm_status" in liquidityTxn &&
        !liquidityTxn.vm_status.includes("Executed")
      ) {
        throw new Error(
          `Aptos liquidity provision failed: ${liquidityTxn.vm_status}`
        );
      }

      console.log(`✅ Aptos liquidity provided: ${liquidityTxnResult.hash}`);

      // Now claim ETH tokens on Ethereum side
      console.log("🔐 Claiming ETH tokens on Ethereum...");
      const ethClaimResult = await this.completeEthSide(swapId, secret);

      return {
        success: true,
        swapId: swapId,
        aptosSwapCreated: createTxnResult.hash,
        aptosLiquidityProvided: liquidityTxnResult.hash,
        ethClaimed: ethClaimResult.success ? ethClaimResult.txHash : null,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`❌ Error completing Aptos side: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async completeEthSide(swapId: string, secret: string) {
    try {
      console.log(`🔐 Completing ETH side for swap: ${swapId}`);

      // Get swap details
      const swap = await this.ethContract.getSwap(swapId);
      console.log(`ETH Swap amount: ${ethers.formatEther(swap.amount)} ETH`);

      // Create a separate contract instance for the resolver wallet
      const resolverContract = new ethers.Contract(
        CONFIG.SEPOLIA_CONTRACT_ADDRESS,
        [
          "function claimSwap(string _swapId, bytes32 _secret) external",
          "function getSwap(string _swapId) external view returns (tuple(address sender, address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded, string swapId, uint8 swapType, string sourceChain, string destChain, string sourceTxHash, address resolverAddress, uint256 minAmount, uint256 createdAt, address token, string aptosReceiver))",
        ],
        this.ethResolverWallet
      );

      // Claim ETH tokens using the secret
      console.log("📝 Claiming ETH tokens...");

      const claimTx = await resolverContract.claimSwap(swapId, secret, {
        gasLimit: 300000,
      });

      console.log("⏳ Waiting for ETH claim confirmation...");
      const claimReceipt = await claimTx.wait();

      console.log(`✅ ETH tokens claimed: ${claimReceipt.transactionHash}`);

      return {
        success: true,
        txHash: claimReceipt.transactionHash,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`❌ Error claiming ETH: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { swapId, secret, aptosAmount } = await request.json();

    if (!swapId || !secret || !aptosAmount) {
      return NextResponse.json(
        { error: "Missing required parameters: swapId, secret, aptosAmount" },
        { status: 400 }
      );
    }

    console.log("🚀 Starting Resolver API for Aptos Side");
    console.log(`Swap ID: ${swapId}`);
    console.log(`Secret: ${secret}`);
    console.log(`APTOS Amount: ${aptosAmount} octas`);

    const resolver = new Resolver();

    // Skip authorization check for now - assume resolver is already authorized
    console.log(
      "Skipping authorization check - assuming resolver is authorized"
    );

    // Complete Aptos side
    const result = await resolver.completeAptosSide(
      swapId,
      secret,
      parseInt(aptosAmount)
    );

    if (result.success) {
      console.log("🎉 Aptos side completed successfully!");
      return NextResponse.json({
        success: true,
        message: "Aptos side completed successfully!",
        data: result,
      });
    } else {
      console.error("❌ Failed to complete Aptos side:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    console.error("API Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
