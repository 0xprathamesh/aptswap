import { ethers } from "ethers";
import { EscrowFactory } from "../src/services/EscrowFactory";
import { CrossChainResolver } from "../src/services/CrossChainResolver";

async function testEscrowServices() {
  console.log("🚀 Testing EscrowFactory and CrossChainResolver Services\n");

  // Initialize provider
  const provider = new ethers.JsonRpcProvider("https://sepolia.drpc.org");

  // Test EscrowFactory
  console.log("📋 Testing EscrowFactory...");
  const escrowFactory = new EscrowFactory(provider);

  try {
    // Get implementation addresses
    const srcImpl = await escrowFactory.getSourceImpl();
    const dstImpl = await escrowFactory.getDestinationImpl();

    console.log("✅ Source Implementation:", srcImpl);
    console.log("✅ Destination Implementation:", dstImpl);

    // Test creating destination escrow transaction
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
    const makerAddress = "0x1234567890123456789012345678901234567890";
    const takerAddress = "0x0987654321098765432109876543210987654321";
    const tokenAddress = "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f"; // mUSDC
    const amount = ethers.parseEther("1.0");
    const safetyDeposit = ethers.parseEther("0.001");
    const timeLocks = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    const deployTx = await escrowFactory.createDstEscrow(
      secretHash,
      makerAddress,
      takerAddress,
      tokenAddress,
      amount,
      safetyDeposit,
      timeLocks
    );

    console.log("✅ Deploy Transaction:", {
      to: deployTx.to,
      data: deployTx.data.slice(0, 66) + "...", // Truncate for display
      value: ethers.formatEther(deployTx.value) + " ETH",
    });
  } catch (error) {
    console.error("❌ EscrowFactory Error:", error);
  }

  console.log("\n🔧 Testing CrossChainResolver...");
  const resolver = new CrossChainResolver();

  try {
    // Test deploying source escrow
    const orderHash = ethers.keccak256(ethers.toUtf8Bytes("test_order"));
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes("test_secret"));
    const makerAddress = "0x1234567890123456789012345678901234567890";
    const takerAddress = "0x0987654321098765432109876543210987654321";
    const tokenAddress = "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f"; // mUSDC
    const amount = ethers.parseEther("1.0");
    const safetyDeposit = ethers.parseEther("0.001");
    const timeLocks = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    const deploySrcTx = resolver.deploySrc(
      11155111, // Sepolia
      orderHash,
      secretHash,
      makerAddress,
      takerAddress,
      tokenAddress,
      amount,
      safetyDeposit,
      timeLocks
    );

    console.log("✅ Deploy Source Transaction:", {
      to: deploySrcTx.to,
      data: deploySrcTx.data.slice(0, 66) + "...", // Truncate for display
      value: ethers.formatEther(deploySrcTx.value) + " ETH",
    });

    // Test deploying destination escrow
    const immutables = {
      orderHash,
      secretHash,
      maker: BigInt(makerAddress),
      taker: BigInt(takerAddress),
      token: BigInt(tokenAddress),
      amount,
      safetyDeposit,
      timeLocks,
    };

    const deployDstTx = resolver.deployDst(
      immutables,
      Math.floor(Date.now() / 1000) + 86400 // 24 hours
    );

    console.log("✅ Deploy Destination Transaction:", {
      to: deployDstTx.to,
      data: deployDstTx.data.slice(0, 66) + "...", // Truncate for display
      value: ethers.formatEther(deployDstTx.value) + " ETH",
    });

    // Test withdraw transaction
    const escrowAddress = "0x1234567890123456789012345678901234567890";
    const secret = "test_secret";

    const withdrawTx = resolver.withdraw(
      "src",
      escrowAddress,
      secret,
      immutables
    );

    console.log("✅ Withdraw Transaction:", {
      to: withdrawTx.to,
      data: withdrawTx.data.slice(0, 66) + "...", // Truncate for display
    });

    // Test cancel transaction
    const cancelTx = resolver.cancel("src", escrowAddress, immutables);

    console.log("✅ Cancel Transaction:", {
      to: cancelTx.to,
      data: cancelTx.data.slice(0, 66) + "...", // Truncate for display
    });

    // Get addresses
    console.log("✅ Source Resolver Address:", resolver.getSrcAddress());
    console.log("✅ Destination Factory Address:", resolver.getDstAddress());
  } catch (error) {
    console.error("❌ CrossChainResolver Error:", error);
  }

  console.log("\n🎉 All tests completed!");
}

// Run the test
testEscrowServices().catch(console.error);
