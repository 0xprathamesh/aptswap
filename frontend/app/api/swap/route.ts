import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { AptosClient, AptosAccount } from "aptos";

// Configuration
const CONFIG = {
  // Ethereum Sepolia
  SEPOLIA_RPC: "https://sepolia.infura.io/v3/cb77ec7104e04b26a8bba8520e720054",
  SEPOLIA_CONTRACTS: {
    resolver: "0x57127879803e313659c1e0dF410ec73ddf5A11F7",
    factory: "0x219F228e8e46Eb384FD299F0784e5CA8c67B4480",
  },

  // Aptos Testnet
  APTOS_NODE_URL: "https://fullnode.testnet.aptoslabs.com/v1",
  APTOS_CONTRACTS: {
    account:
      "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
    swapLedgerAddress:
      "0xb7be566097698963883013d9454bcfb6275670040f437ed178a76c42154e9b15",
    swapV3Module:
      "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::swap_v3",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { amount, userAddress, aptosAddress } = await request.json();

    if (!amount || !userAddress || !aptosAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check environment variables
    const sepoliaPrivateKey = process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY;
    const aptosPrivateKey = process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY;

    if (!sepoliaPrivateKey || !aptosPrivateKey) {
      return NextResponse.json(
        { 
          error: "Missing environment variables", 
          details: "Please set LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY and LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY in your .env.local file",
          instructions: [
            "1. Create a .env.local file in the frontend directory",
            "2. Add your private keys:",
            "   LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY=your_sepolia_private_key",
            "   LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY=your_aptos_private_key",
            "3. Restart the development server"
          ]
        },
        { status: 500 }
      );
    }

    // Generate secret and hash
    const secretBytes = ethers.toUtf8Bytes("user_swap_secret_password");
    const secret = ethers.hexlify(secretBytes);
    const secretHash = ethers.keccak256(secretBytes);

    // Convert amount to proper format (0.001 ETH = 1 APT)
    const ethAmount = parseFloat(amount);
    const aptAmount = ethAmount * 1000; // 0.001 ETH = 1 APT

    console.log(`Starting swap: ${ethAmount} ETH -> ${aptAmount} APT`);
    console.log(`User: ${userAddress}, Aptos: ${aptosAddress}`);
    console.log(`Environment variables present: Sepolia=${!!sepoliaPrivateKey}, Aptos=${!!aptosPrivateKey}`);

    // Step 1: Create Sepolia escrow
    const sepoliaProvider = new ethers.JsonRpcProvider(CONFIG.SEPOLIA_RPC);
    const sepoliaWallet = new ethers.Wallet(
      process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY || "",
      sepoliaProvider
    );

    const safetyDepositAmount = ethers.parseEther("0.001");
    const currentTime = Math.floor(Date.now() / 1000);

    const escrowFactoryABI = [
      "function createDstEscrow((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256), uint256) external payable",
    ];

    const escrowFactory = new ethers.Contract(
      CONFIG.SEPOLIA_CONTRACTS.factory,
      escrowFactoryABI,
      sepoliaWallet
    );

    const totalValue = safetyDepositAmount + ethers.parseEther(amount);

    const immutables = [
      secretHash, // orderHash (bytes32)
      secretHash, // hashlock (bytes32)
      BigInt(sepoliaWallet.address), // maker (Address = uint256)
      BigInt(userAddress), // taker (Address = uint256)
      BigInt("0x0000000000000000000000000000000000000000"), // token (Address = uint256) - ETH
      ethers.parseEther(amount), // amount (uint256)
      safetyDepositAmount, // safetyDeposit (uint256)
      ethers.parseUnits("86400", 0), // timelocks (Timelocks = uint256)
    ];

    const sepoliaTx = await escrowFactory.createDstEscrow(
      immutables,
      currentTime + 86400, // srcCancellationTimestamp
      {
        value: totalValue,
        gasLimit: 500000,
      }
    );

    const sepoliaReceipt = await sepoliaTx.wait();

    // Step 2: Initialize Aptos swap ledger
    const aptosClient = new AptosClient(CONFIG.APTOS_NODE_URL);
    const aptosPrivateKeyBytes = new Uint8Array(
      (process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY || "")
        .slice(2)
        .match(/.{1,2}/g)
        ?.map((byte) => parseInt(byte, 16)) || []
    );
    const aptosAccount = new AptosAccount(aptosPrivateKeyBytes);

    const initPayload = {
      type: "entry_function_payload",
      function: `${CONFIG.APTOS_CONTRACTS.swapV3Module}::initialize_swap_ledger`,
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [],
    };

    const initTxn = await aptosClient.generateTransaction(
      aptosAccount.address(),
      initPayload
    );
    const signedInitTxn = await aptosClient.signTransaction(
      aptosAccount,
      initTxn
    );
    const initResult = await aptosClient.submitTransaction(signedInitTxn);
    await aptosClient.waitForTransaction(initResult.hash);

    // Step 3: Announce order on Aptos
    const announcePayload = {
      type: "entry_function_payload",
      function: `${CONFIG.APTOS_CONTRACTS.swapV3Module}::announce_order`,
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [
        aptAmount.toString(),
        aptAmount.toString(),
        "86400",
        Array.from(ethers.getBytes(secretHash)),
      ],
    };

    const announceTxn = await aptosClient.generateTransaction(
      aptosAccount.address(),
      announcePayload
    );
    const signedAnnounceTxn = await aptosClient.signTransaction(
      aptosAccount,
      announceTxn
    );
    const announceResult =
      await aptosClient.submitTransaction(signedAnnounceTxn);
    await aptosClient.waitForTransaction(announceResult.hash);

    // Get order ID
    let orderId = 0;
    for (let i = 0; i < 5; i++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const ledgerResource = await aptosClient.getAccountResource(
          CONFIG.APTOS_CONTRACTS.swapLedgerAddress,
          `${CONFIG.APTOS_CONTRACTS.swapV3Module}::SwapLedger`
        );
        orderId = parseInt(ledgerResource.data.order_id_counter) - 1;
        break;
      } catch (error) {
        if (i === 4) {
          orderId = 0;
        }
      }
    }

    // Step 4: Fund destination escrow on Aptos
    const fundPayload = {
      type: "entry_function_payload",
      function: `${CONFIG.APTOS_CONTRACTS.swapV3Module}::fund_dst_escrow`,
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [
        aptAmount.toString(),
        "86400",
        Array.from(ethers.getBytes(secretHash)),
      ],
    };

    const fundTxn = await aptosClient.generateTransaction(
      aptosAccount.address(),
      fundPayload
    );
    const signedFundTxn = await aptosClient.signTransaction(
      aptosAccount,
      fundTxn
    );
    const fundResult = await aptosClient.submitTransaction(signedFundTxn);
    await aptosClient.waitForTransaction(fundResult.hash);

    // Get fund order ID
    let fundOrderId = orderId + 1;
    for (let i = 0; i < 5; i++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const ledgerResource = await aptosClient.getAccountResource(
          CONFIG.APTOS_CONTRACTS.swapLedgerAddress,
          `${CONFIG.APTOS_CONTRACTS.swapV3Module}::SwapLedger`
        );
        fundOrderId = parseInt(ledgerResource.data.order_id_counter) - 1;
        break;
      } catch (error) {
        if (i === 4) {
          fundOrderId = orderId + 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      swapId: `swap_${Date.now()}`,
      secret: secret,
      secretHash: secretHash,
      transactions: {
        sepoliaEscrow: sepoliaReceipt.hash,
        aptosInit: initResult.hash,
        aptosAnnounce: announceResult.hash,
        aptosFund: fundResult.hash,
        announceOrderId: orderId,
        fundOrderId: fundOrderId,
      },
      amounts: {
        ethAmount: amount,
        aptAmount: aptAmount,
      },
    });
  } catch (error) {
    console.error("Swap API error:", error);
    return NextResponse.json(
      { error: "Failed to execute swap", details: error.message },
      { status: 500 }
    );
  }
}
