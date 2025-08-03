"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { toast } from "sonner";
import { AptosClient } from "aptos";
import TokenInputWrapper from "./TokenInputWrapper";
import DisplayData from "./DisplayData";
import SwapActionButton from "./SwapActionButton";

interface Token {
  symbol: string;
  name: string;
  logoURI: string;
  address: string;
  chain: string;
}

interface QuoteData {
  ethAmount: number;
  aptosAmount: number;
  exchangeRate: number;
  ethPrice: number;
  aptPrice: number;
}

const SwapInterface: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [amountIn, setAmountIn] = useState<string>("");
  const [amountOut, setAmountOut] = useState<string>("");
  const [tokenIn, setTokenIn] = useState<Token | undefined>();
  const [tokenOut, setTokenOut] = useState<Token | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isReviewComplete, setIsReviewComplete] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [prices, setPrices] = useState<{ eth: number; apt: number }>({
    eth: 0,
    apt: 0,
  });
  const [petraAddress, setPetraAddress] = useState<string | null>(null);
  const [isPetraConnected, setIsPetraConnected] = useState(false);

  // Contract configuration
  const SEPOLIA_CONTRACTS = {
    resolver: "0x57127879803e313659c1e0dF410ec73ddf5A11F7",
    factory: "0x219F228e8e46Eb384FD299F0784e5CA8c67B4480",
  };

  const APTOS_CONTRACTS = {
    account:
      "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
    swapLedgerAddress:
      "0xb7be566097698963883013d9454bcfb6275670040f437ed178a76c42154e9b15",
    swapV3Module:
      "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::swap_v3",
  };

  const SEPOLIA_MUSDC = "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f";
  const APTOS_APT_TOKEN = "0x1::aptos_coin::AptosCoin";

  const APTOS_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
  const aptosClient = new AptosClient(APTOS_NODE_URL);

  // Check if Aptos wallet is available
  const isAptosAvailable = typeof window !== "undefined" && "aptos" in window;

  // Connect to Aptos wallet
  const connectPetra = async () => {
    if (!isAptosAvailable) {
      toast.error("Aptos wallet not found. Please install Petra extension.");
      return;
    }

    try {
      const aptos = (window as any).aptos;
      const account = await aptos.connect();
      setPetraAddress(account.address);
      setIsPetraConnected(true);
      toast.success("Aptos wallet connected successfully!");
    } catch (error) {
      console.error("Failed to connect to Aptos:", error);
      toast.error("Failed to connect to Aptos wallet");
    }
  };

  // Disconnect from Petra wallet
  const disconnectPetra = () => {
    setPetraAddress(null);
    setIsPetraConnected(false);
    toast.success("Petra wallet disconnected");
  };

  // Fetch prices from CoinGecko
  const fetchPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,aptos&vs_currencies=usd"
      );
      const data = await response.json();
      setPrices({
        eth: data.ethereum.usd,
        apt: data.aptos.usd,
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  // Calculate output amount when input changes
  useEffect(() => {
    if (amountIn && prices.eth && prices.apt && tokenIn && tokenOut) {
      const inputValue = parseFloat(amountIn);
      const exchangeRate = prices.eth / prices.apt;
      const outputValue = inputValue * exchangeRate;
      setAmountOut(outputValue.toFixed(6));

      setQuoteData({
        ethAmount: inputValue,
        aptosAmount: outputValue,
        exchangeRate,
        ethPrice: prices.eth,
        aptPrice: prices.apt,
      });
    } else {
      setAmountOut("");
      setQuoteData(null);
    }
  }, [amountIn, prices, tokenIn, tokenOut]);

  // Fetch prices on mount and every 30 seconds
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate secret and hash for HTLC
  const generateSecretAndHash = () => {
    const secretBytes = ethers.toUtf8Bytes(
      "user_secret_password_for_swap_test"
    );
    const secret = ethers.hexlify(secretBytes);
    const secretHash = ethers.keccak256(secretBytes);
    return { secret: secretBytes, secretHash: secretHash };
  };

  // Handle token interchange
  const handleInterchange = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
    setAmountOut("");
  };

  // Handle token selection
  const handleTokenInSelect = (token: Token) => {
    setTokenIn(token);
    if (tokenOut && token.symbol === tokenOut.symbol) {
      setTokenOut(undefined);
    }
  };

  const handleTokenOutSelect = (token: Token) => {
    setTokenOut(token);
    if (tokenIn && token.symbol === tokenIn.symbol) {
      setTokenIn(undefined);
    }
  };

  // Review swap
  const reviewSwap = useCallback(async () => {
    if (!isConnected || !amountIn || !tokenIn || !tokenOut || !quoteData) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isPetraConnected) {
      toast.error("Please connect your Aptos wallet (Petra)");
      return;
    }

    setIsReviewing(true);

    try {
      const inputValue = parseFloat(amountIn);
      if (inputValue <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      setIsReviewComplete(true);
      toast.success("Swap review completed");
    } catch (error) {
      console.error("Error reviewing swap:", error);
      toast.error("Error reviewing swap");
    } finally {
      setIsReviewing(false);
    }
  }, [isConnected, isPetraConnected, amountIn, tokenIn, tokenOut, quoteData]);

  // Execute swap
  const executeSwap = async () => {
    if (
      !walletClient ||
      !amountIn ||
      !tokenIn ||
      !tokenOut ||
      !quoteData ||
      !isPetraConnected
    ) {
      toast.error("Missing required data for swap");
      return;
    }

    setIsSwapping(true);
    setLoadingMessage("Starting cross-chain swap...");

    try {
      const swapAmount = parseFloat(amountIn);
      const { secret, secretHash } = generateSecretAndHash();

      // Step 1: Create Sepolia order
      setLoadingMessage("Creating Sepolia escrow...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await provider.getSigner();

      const musdcContract = new ethers.Contract(
        SEPOLIA_MUSDC,
        [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function approve(address,uint256)",
        ],
        walletSigner
      );

      const balance = await musdcContract.balanceOf(address);
      const decimals = await musdcContract.decimals();
      const balanceInUnits = ethers.formatUnits(balance, decimals);

      if (parseFloat(balanceInUnits) < swapAmount) {
        throw new Error(
          `Insufficient mUSDC balance. You have ${balanceInUnits} mUSDC`
        );
      }

      // Approve factory to spend mUSDC
      const approveTx = await musdcContract.approve(
        SEPOLIA_CONTRACTS.factory,
        ethers.parseUnits(swapAmount.toString(), decimals)
      );
      await approveTx.wait();

      // Create escrow
      const safetyDepositAmount = ethers.parseEther("0.001");
      const currentTime = Math.floor(Date.now() / 1000);

      const escrowFactoryABI = [
        "function createDstEscrow((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256), uint256) external payable",
      ];

      const escrowFactory = new ethers.Contract(
        SEPOLIA_CONTRACTS.factory,
        escrowFactoryABI,
        walletSigner
      );

      const totalValue = safetyDepositAmount;

      const immutables = [
        secretHash,
        secretHash,
        BigInt(address!),
        BigInt(address!),
        BigInt(SEPOLIA_MUSDC),
        ethers.parseUnits(swapAmount.toString(), decimals),
        safetyDepositAmount,
        ethers.parseUnits("86400", 0),
      ];

      const escrowTx = await escrowFactory.createDstEscrow(
        immutables,
        currentTime + 86400,
        {
          value: totalValue,
          gasLimit: 300000,
        }
      );

      const sepoliaReceipt = await escrowTx.wait();

      // Step 2: Initialize Aptos swap ledger
      setLoadingMessage("Initializing Aptos swap ledger...");
      const aptos = (window as any).aptos;
      const payload = {
        type: "entry_function_payload",
        function: `${APTOS_CONTRACTS.swapV3Module}::initialize_swap_ledger`,
        type_arguments: [APTOS_APT_TOKEN],
        arguments: [],
      };

      const txn = await aptosClient.generateTransaction(petraAddress!, payload);
      const signedTxn = await aptos.signAndSubmitTransaction(txn);
      const ledgerResult = await aptosClient.waitForTransaction(signedTxn.hash);

      // Step 3: Announce order on Aptos
      setLoadingMessage("Announcing order on Aptos...");
      const aptAmount = ethers.parseUnits(swapAmount.toString(), 8);
      const announcePayload = {
        type: "entry_function_payload",
        function: `${APTOS_CONTRACTS.swapV3Module}::announce_order`,
        type_arguments: [APTOS_APT_TOKEN],
        arguments: [
          aptAmount.toString(),
          aptAmount.toString(),
          86400,
          Array.from(ethers.getBytes(secretHash)),
        ],
      };

      const announceTxn = await aptosClient.generateTransaction(
        petraAddress!,
        announcePayload
      );
      const announceSignedTxn =
        await aptos.signAndSubmitTransaction(announceTxn);
      const announceResult = await aptosClient.waitForTransaction(
        announceSignedTxn.hash
      );

      // Step 4: Fund Aptos escrow
      setLoadingMessage("Funding Aptos escrow...");
      const fundPayload = {
        type: "entry_function_payload",
        function: `${APTOS_CONTRACTS.swapV3Module}::fund_dst_escrow`,
        type_arguments: [APTOS_APT_TOKEN],
        arguments: [
          aptAmount.toString(),
          86400,
          Array.from(ethers.getBytes(secretHash)),
        ],
      };

      const fundTxn = await aptosClient.generateTransaction(
        petraAddress!,
        fundPayload
      );
      const fundSignedTxn = await aptos.signAndSubmitTransaction(fundTxn);
      const fundResult = await aptosClient.waitForTransaction(
        fundSignedTxn.hash
      );

      // Step 5: Wait before claiming
      setLoadingMessage("Waiting before claiming funds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 6: Claim APT on Aptos
      setLoadingMessage("Claiming APT on Aptos...");
      const claimPayload = {
        type: "entry_function_payload",
        function: `${APTOS_CONTRACTS.swapV3Module}::claim_funds`,
        type_arguments: [APTOS_APT_TOKEN],
        arguments: ["100", secret], // Using order ID 100 as fallback
      };

      const claimTxn = await aptosClient.generateTransaction(
        petraAddress!,
        claimPayload
      );
      const claimSignedTxn = await aptos.signAndSubmitTransaction(claimTxn);
      const claimResult = await aptosClient.waitForTransaction(
        claimSignedTxn.hash
      );

      setLoadingMessage(null);

      toast.success("Cross-chain swap completed successfully!");

      // Reset form
      setAmountIn("");
      setAmountOut("");
      setQuoteData(null);
      setIsReviewComplete(false);
    } catch (error) {
      console.error("Error executing swap:", error);
      toast.error(
        `Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSwapping(false);
      setLoadingMessage(null);
    }
  };

  // Handle approve (placeholder for now)
  const handleApprove = async () => {
    toast.info("Approval not required for this swap type");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Wallet Connections */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">
          Wallet Connections
        </h2>

        {/* Sepolia Wallet */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sepolia Network (MetaMask)
          </label>
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400 text-sm">
                {isConnected
                  ? `Connected: ${address?.slice(0, 8)}...${address?.slice(-6)}`
                  : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Aptos Wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Aptos Network (Petra)
          </label>
          {isPetraConnected ? (
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">
                  Petra: {petraAddress?.slice(0, 8)}...{petraAddress?.slice(-6)}
                </span>
              </div>
              <button
                onClick={disconnectPetra}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectPetra}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Connect Petra Wallet
            </button>
          )}
        </div>
      </div>

      {/* Swap Interface */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">
          Swap Interface
        </h2>

        {/* Token Input */}
        <TokenInputWrapper
          amount={amountIn}
          setAmount={setAmountIn}
          token={tokenIn}
          onTokenSelect={handleTokenInSelect}
          label="From"
          placeholder="0.0"
          disabled={isSwapping}
        />

        {/* Interchange Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={handleInterchange}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            disabled={isSwapping}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Token Output */}
        <TokenInputWrapper
          amount={amountOut}
          setAmount={setAmountOut}
          token={tokenOut}
          onTokenSelect={handleTokenOutSelect}
          label="To"
          placeholder="0.0"
          disabled={true}
        />

        {/* Quote Data */}
        {quoteData && (
          <DisplayData
            ethAmount={quoteData.ethAmount}
            aptosAmount={quoteData.aptosAmount}
            exchangeRate={quoteData.exchangeRate}
            ethPrice={quoteData.ethPrice}
            aptPrice={quoteData.aptPrice}
          />
        )}

        {/* Action Buttons */}
        <SwapActionButton
          isConnected={isConnected && isPetraConnected}
          isReviewComplete={isReviewComplete}
          isReviewing={isReviewing}
          isSwapping={isSwapping}
          onReview={reviewSwap}
          onSwap={executeSwap}
          onApprove={handleApprove}
          loadingMessage={loadingMessage}
        />
      </div>

      {/* Connection Notice */}
      {(!isConnected || !isPetraConnected) && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm text-center">
            Please connect both Sepolia and Aptos wallets to start swapping
          </p>
        </div>
      )}
    </div>
  );
};

export default SwapInterface;
