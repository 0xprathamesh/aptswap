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
  // Default tokens for Sepolia to Aptos swap (using ETH as per test)
  const defaultTokenIn: Token = {
    symbol: "ETH",
    name: "Ethereum",
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    address: "0x0000000000000000000000000000000000000000",
    chain: "Sepolia",
  };

  const defaultTokenOut: Token = {
    symbol: "APT",
    name: "Aptos",
    logoURI:
      "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
    address: "0x1::aptos_coin::AptosCoin",
    chain: "Aptos",
  };

  const [tokenIn, setTokenIn] = useState<Token>(defaultTokenIn);
  const [tokenOut, setTokenOut] = useState<Token>(defaultTokenOut);
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

  // Calculate quote for ETH to APT swap
  const calculateQuote = useCallback(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuoteData(null);
      return;
    }

    const ethAmount = parseFloat(amountIn);
    const aptAmount = ethAmount * 1000; // 0.001 ETH = 1 APT
    const exchangeRate = 1000; // 1 ETH = 1000 APT

    setQuoteData({
      ethAmount: ethAmount,
      aptosAmount: aptAmount,
      exchangeRate: exchangeRate,
      ethPrice: prices.eth,
      aptPrice: prices.apt,
    });

    setAmountOut(aptAmount.toString());
  }, [amountIn, prices.eth, prices.apt]);

  // Calculate quote when amountIn changes
  useEffect(() => {
    calculateQuote();
  }, [calculateQuote]);

  // Fetch prices from CoinGecko
  const fetchPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,aptos&vs_currencies=usd"
      );
      const data = await response.json();
      setPrices({
        eth: data.ethereum?.usd || 0,
        apt: data.aptos?.usd || 0,
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
      setTokenOut(defaultTokenOut);
    }
  };

  const handleTokenOutSelect = (token: Token) => {
    setTokenOut(token);
    if (tokenIn && token.symbol === tokenIn.symbol) {
      setTokenIn(defaultTokenIn);
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

  // Execute swap using API
  const executeSwap = async () => {
    if (!amountIn || !tokenIn || !tokenOut || !isPetraConnected || !address) {
      toast.error("Missing required data for swap");
      return;
    }

    setIsSwapping(true);
    setLoadingMessage("Starting cross-chain swap...");

    try {
      const swapAmount = parseFloat(amountIn);

      // Call the test swap API for now (bypasses environment issues)
      setLoadingMessage("Executing cross-chain swap...");
      const response = await fetch("/api/test-swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: swapAmount,
          userAddress: address,
          aptosAddress: petraAddress,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error === "Missing environment variables") {
          console.error("Environment setup required:", result.instructions);
          throw new Error(
            `Setup required: ${result.details}. Check console for instructions.`
          );
        }
        throw new Error(result.error || "Swap failed");
      }

      setLoadingMessage("Swap completed successfully!");
      toast.success("Cross-chain swap executed successfully!");

      console.log("Swap Result:", result);
      console.log("Secret:", result.secret);
      console.log(
        "Order IDs:",
        result.transactions.announceOrderId,
        result.transactions.fundOrderId
      );

      // Store swap details for claiming
      localStorage.setItem(
        "lastSwap",
        JSON.stringify({
          swapId: result.swapId,
          secret: result.secret,
          fundOrderId: result.transactions.fundOrderId,
          ethAmount: result.amounts.ethAmount,
          aptAmount: result.amounts.aptAmount,
        })
      );

      setIsReviewComplete(false);
      setAmountIn("");
      setAmountOut("");
    } catch (error) {
      console.error("Swap execution failed:", error);
      toast.error(
        `Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSwapping(false);
      setLoadingMessage(null);
    }
  };

  // Check environment variables
  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/check-env");
      const result = await response.json();

      if (result.success) {
        console.log("Environment check:", result.environment);
        if (
          result.environment.sepoliaPrivateKey &&
          result.environment.aptosPrivateKey
        ) {
          toast.success("Environment variables are set correctly!");
        } else {
          toast.error("Missing environment variables! Check .env file.");
        }
      }
    } catch (error) {
      toast.error("Failed to check environment");
    }
  };

  // Manual swap simulation (for testing without environment variables)
  const manualSwap = async () => {
    if (!amountIn || !address || !petraAddress) {
      toast.error("Please connect wallets and enter amount");
      return;
    }

    try {
      setIsSwapping(true);
      setLoadingMessage("Simulating cross-chain swap...");

      // Simulate the swap process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const ethAmount = parseFloat(amountIn);
      const aptAmount = ethAmount * 1000; // 0.001 ETH = 1 APT

      const swapResult = {
        swapId: `manual_swap_${Date.now()}`,
        secret: "0x6d616e75616c5f7365637265745f70617373776f7264",
        secretHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        transactions: {
          sepoliaEscrow: "SIMULATED_SEPOLIA_TX",
          aptosInit: "SIMULATED_APTOS_INIT",
          aptosAnnounce: "SIMULATED_APTOS_ANNOUNCE",
          aptosFund: "SIMULATED_APTOS_FUND",
          announceOrderId: 1,
          fundOrderId: 2,
        },
        amounts: {
          ethAmount: ethAmount,
          aptAmount: aptAmount,
        },
      };

      setLoadingMessage("Swap completed successfully!");
      toast.success("Manual swap completed! Check console for details.");

      console.log("Manual Swap Result:", swapResult);
      console.log("Secret:", swapResult.secret);
      console.log(
        "Order IDs:",
        swapResult.transactions.announceOrderId,
        swapResult.transactions.fundOrderId
      );

      // Store swap details
      localStorage.setItem(
        "lastSwap",
        JSON.stringify({
          swapId: swapResult.swapId,
          secret: swapResult.secret,
          fundOrderId: swapResult.transactions.fundOrderId,
          ethAmount: swapResult.amounts.ethAmount,
          aptAmount: swapResult.amounts.aptAmount,
        })
      );

      setIsReviewComplete(false);
      setAmountIn("");
      setAmountOut("");
    } catch (error) {
      console.error("Manual swap failed:", error);
      toast.error(
        `Manual swap failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSwapping(false);
      setLoadingMessage(null);
    }
  };

  // Handle approve - for ETH swaps, we need to check balance and proceed
  const handleApprove = async () => {
    if (!address || !amountIn) {
      toast.error("Please connect wallet and enter amount");
      return;
    }

    try {
      setIsReviewing(true);
      setLoadingMessage("Checking ETH balance...");

      // Check ETH balance on Sepolia
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      const requiredAmount = ethers.parseEther(amountIn);
      const safetyDeposit = ethers.parseEther("0.001");
      const totalRequired = requiredAmount + safetyDeposit;

      if (balance < totalRequired) {
        throw new Error(
          `Insufficient ETH balance. You need ${ethers.formatEther(totalRequired)} ETH (including 0.001 ETH safety deposit)`
        );
      }

      toast.success("Balance check passed! Ready to swap.");
      setIsReviewComplete(true);
      setLoadingMessage(null);
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(
        `Approval failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsReviewing(false);
      setLoadingMessage(null);
    }
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Sepolia → Aptos Cross-Chain Swap
            </h2>
            <p className="text-gray-400 text-sm">
              Swap ETH on Sepolia for APT on Aptos (0.001 ETH = 1 APT)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={checkEnvironment}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
            >
              Check Env
            </button>
            <button
              onClick={manualSwap}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
            >
              Manual Swap
            </button>
          </div>
        </div>

        {/* Token Input Wrapper */}
        <TokenInputWrapper
          amount={amountIn}
          amountOut={amountOut}
          setAmount={setAmountIn}
          setAmountOut={setAmountOut}
          handleInterchange={handleInterchange}
          isLoading={isLoading}
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          onTokenInSelect={handleTokenInSelect}
          onTokenOutSelect={handleTokenOutSelect}
          usdValue={quoteData?.ethAmount}
          balance="0.00"
        />

        {/* Quote Data */}
        {quoteData && (
          <div className="mb-4 p-4 bg-gray-700/30 rounded-lg">
            <DisplayData
              value={`${quoteData.ethAmount} mUSDC`}
              text="Amount to Send"
            />
            <DisplayData
              value={`${quoteData.aptosAmount} APT`}
              text="Amount to Receive"
            />
            <DisplayData
              value={`1 mUSDC = ${quoteData.exchangeRate.toFixed(4)} APT`}
              text="Exchange Rate"
            />
          </div>
        )}

        {/* Action Buttons */}
        <SwapActionButton
          isConnected={isConnected && isPetraConnected}
          isReviewComplete={isReviewComplete}
          isPending={isSwapping}
          isReviewing={isReviewing}
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
