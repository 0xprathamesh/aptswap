// Resolver Script for Aptos Side
// This completes the Aptos side of the swap after ETH is locked

import { ethers } from "ethers";
import { AptosClient, AptosAccount, HexString } from "@aptos-labs/ts-sdk";

// Configuration
const CONFIG = {
  // Ethereum Sepolia
  SEPOLIA_RPC: "https://sepolia.infura.io/v3/cb77ec7104e04b26a8bba8520e720054",
  SEPOLIA_CONTRACT_ADDRESS: "0xBD64245289114b11B35C4fF35605a525a7dF1f53",
  SEPOLIA_RESOLVER_PRIVATE_KEY: "0x4045b15806e29d95d1652f3c718f115dedae82216debd6920e42375f019432a2",
  SEPOLIA_RESOLVER: "0xEAde2298C7d1b5C748103da66D6Dd9Cf204E2AD2",
  
  // Aptos Devnet
  APTOS_NODE_URL: "https://fullnode.devnet.aptoslabs.com/v1",
  APTOS_CONTRACT_ADDRESS: "0xfc1515fc8a2c00692b2117e8594771923e823985f23ea1bbb0278ae95f742dba",
  APTOS_RESOLVER_PRIVATE_KEY: "e47bc1ab7808c62c9e2d01437891e9b9d69b8c1d845d317be14dea9b36bfe090",
  APTOS_RESOLVER: "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e"
};

class Resolver {
  private ethProvider: ethers.JsonRpcProvider;
  private aptosClient: AptosClient;
  private ethResolverWallet: ethers.Wallet;
  private aptosResolverAccount: AptosAccount;
  private ethContract: ethers.Contract;

  constructor() {
    this.ethProvider = new ethers.JsonRpcProvider(CONFIG.SEPOLIA_RPC);
    this.aptosClient = new AptosClient({ URL: CONFIG.APTOS_NODE_URL });
    
    this.ethResolverWallet = new ethers.Wallet(CONFIG.SEPOLIA_RESOLVER_PRIVATE_KEY, this.ethProvider);
    this.aptosResolverAccount = new AptosAccount({ privateKey: CONFIG.APTOS_RESOLVER_PRIVATE_KEY });
    
    this.ethContract = new ethers.Contract(CONFIG.SEPOLIA_CONTRACT_ADDRESS, [
      "function getSwap(string _swapId) external view returns (tuple(address sender, address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded, string swapId, uint8 swapType, string sourceChain, string destChain, string sourceTxHash, address resolverAddress, uint256 minAmount, uint256 createdAt, address token, string aptosReceiver))"
    ], this.ethResolverWallet);
  }

  // Complete Aptos side of swap
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
        function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::create_eth_to_aptos_swap`,
        functionArguments: [
          swap.aptosReceiver, // receiver
          aptosAmount.toString(), // expected_aptos_amount
          Array.from(ethers.getBytes(swap.hashlock)), // hashlock as bytes
          Number(swap.timelock), // timelock
          swapId, // swap_id
          swap.sourceTxHash || "eth_tx_hash", // source_tx_hash
          CONFIG.APTOS_RESOLVER, // resolver_address
          aptosAmount.toString(), // min_amount
        ],
        typeArguments: [],
      };

      const createTxnRequest = await this.aptosClient.generateTransaction({
        sender: this.aptosResolverAccount.accountAddress,
        data: createPayload
      });

      const signedCreateTxn = await this.aptosClient.signTransaction({
        signer: this.aptosResolverAccount,
        transaction: createTxnRequest
      });

      const createTxnResult = await this.aptosClient.submitTransaction({
        transaction: signedCreateTxn
      });
      
      await this.aptosClient.waitForTransaction({ transactionHash: createTxnResult.hash });
      
      const createTxn = await this.aptosClient.getTransactionByHash({ transactionHash: createTxnResult.hash });
      if (createTxn.success === false) {
        throw new Error(`Aptos swap creation failed: ${createTxn.vm_status}`);
      }
      
      console.log(`✅ Aptos swap record created: ${createTxnResult.hash}`);

      // Provide Aptos liquidity
      console.log("💰 Providing Aptos liquidity...");
      const liquidityPayload = {
        function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::provide_aptos_liquidity`,
        functionArguments: [swapId, aptosAmount.toString()],
        typeArguments: [],
      };

      const liquidityTxnRequest = await this.aptosClient.generateTransaction({
        sender: this.aptosResolverAccount.accountAddress,
        data: liquidityPayload
      });

      const signedLiquidityTxn = await this.aptosClient.signTransaction({
        signer: this.aptosResolverAccount,
        transaction: liquidityTxnRequest
      });

      const liquidityTxnResult = await this.aptosClient.submitTransaction({
        transaction: signedLiquidityTxn
      });
      
      await this.aptosClient.waitForTransaction({ transactionHash: liquidityTxnResult.hash });
      
      const liquidityTxn = await this.aptosClient.getTransactionByHash({ transactionHash: liquidityTxnResult.hash });
      if (liquidityTxn.success === false) {
        throw new Error(`Aptos liquidity provision failed: ${liquidityTxn.vm_status}`);
      }
      
      console.log(`✅ Aptos liquidity provided: ${liquidityTxnResult.hash}`);
      
      return {
        success: true,
        swapId: swapId,
        aptosSwapCreated: createTxnResult.hash,
        aptosLiquidityProvided: liquidityTxnResult.hash
      };
      
    } catch (error: any) {
      console.error(`❌ Error completing Aptos side: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if resolver is authorized
  async isResolverAuthorized(): Promise<boolean> {
    try {
      const result = await this.aptosClient.view({
        payload: {
          function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::is_resolver_authorized`,
          functionArguments: [CONFIG.APTOS_RESOLVER],
          typeArguments: [],
        }
      });
      return result[0];
    } catch (error) {
      console.log("Could not check resolver authorization:", error);
      return false;
    }
  }

  // Authorize resolver if needed
  async authorizeResolver(): Promise<boolean> {
    try {
      console.log("🔐 Authorizing resolver...");
      
      const payload = {
        function: `${CONFIG.APTOS_CONTRACT_ADDRESS}::eth_aptos_swap::authorize_resolver`,
        functionArguments: [CONFIG.APTOS_RESOLVER],
        typeArguments: [],
      };

      const txnRequest = await this.aptosClient.generateTransaction({
        sender: CONFIG.APTOS_CONTRACT_ADDRESS, // Contract owner address
        data: payload
      });

      const signedTxn = await this.aptosClient.signTransaction({
        signer: this.aptosResolverAccount,
        transaction: txnRequest
      });

      const txnResult = await this.aptosClient.submitTransaction({
        transaction: signedTxn
      });
      
      await this.aptosClient.waitForTransaction({ transactionHash: txnResult.hash });
      
      const txn = await this.aptosClient.getTransactionByHash({ transactionHash: txnResult.hash });
      if (txn.success === false) {
        throw new Error(`Authorization failed: ${txn.vm_status}`);
      }
      
      console.log(`✅ Resolver authorized: ${txnResult.hash}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Authorization failed: ${error.message}`);
      return false;
    }
  }
}

// Main execution function
export async function runResolver(swapId: string, secret: string, aptosAmount: number) {
  console.log("🚀 Starting Resolver for Aptos Side");
  console.log(`Swap ID: ${swapId}`);
  console.log(`Secret: ${secret}`);
  console.log(`APTOS Amount: ${aptosAmount} octas`);
  
  const resolver = new Resolver();
  
  // Check if resolver is authorized
  const isAuthorized = await resolver.isResolverAuthorized();
  console.log(`Resolver authorized: ${isAuthorized}`);
  
  if (!isAuthorized) {
    console.log("Authorizing resolver...");
    const authResult = await resolver.authorizeResolver();
    if (!authResult) {
      console.error("Failed to authorize resolver");
      return;
    }
  }
  
  // Complete Aptos side
  const result = await resolver.completeAptosSide(swapId, secret, aptosAmount);
  
  if (result.success) {
    console.log("🎉 Aptos side completed successfully!");
    console.log(`Swap ID: ${result.swapId}`);
    console.log(`Aptos Swap Created: ${result.aptosSwapCreated}`);
    console.log(`Aptos Liquidity Provided: ${result.aptosLiquidityProvided}`);
    console.log("\nUser can now claim APTOS tokens on Aptos chain!");
  } else {
    console.error("❌ Failed to complete Aptos side:", result.error);
  }
}

export default Resolver;
 