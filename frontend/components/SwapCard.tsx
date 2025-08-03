"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { toast } from "sonner";
import TokenInput from "./TokenInput";
import {
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface SwapCardProps {
  direction: "ETH-APT" | "APT-ETH";
}

interface TokenData {
  symbol: string;
  name: string;
  image: string;
  chain: string;
  price: number;
}

interface QuoteData {
  ethAmount: number;
  aptosAmount: number;
  exchangeRate: number;
  ethPrice: number;
  aptPrice: number;
}

interface SwapStatus {
  stage:
    | "idle"
    | "creating"
    | "eth-confirming"
    | "aptos-processing"
    | "completed"
    | "failed";
  message: string;
  details?: string;
}

export default function SwapCard({ direction }: SwapCardProps) {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [ethAmount, setEthAmount] = useState<string>("");
  const [aptosAmount, setAptosAmount] = useState<string>("");
  const [aptosReceiver, setAptosReceiver] = useState<string>("");
  const [showReceiverInput, setShowReceiverInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [swapStatus, setSwapStatus] = useState<SwapStatus>({
    stage: "idle",
    message: "",
  });
  const [prices, setPrices] = useState<{ eth: number; apt: number }>({
    eth: 0,
    apt: 0,
  });

  // Contract configuration
  const CONTRACT_ADDRESS = "0xBD64245289114b11B35C4fF35605a525a7dF1f53";
  const CONTRACT_ABI = [
    "function createEthToAptosSwap(tuple(address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, string swapId, uint8 swapType, string sourceChain, string destChain, string sourceTxHash, address resolverAddress, uint256 minAmount, address token, string aptosReceiver) params) payable",
    "function getSwap(string _swapId) external view returns (tuple(address sender, address receiver, uint256 amount, bytes32 hashlock, uint256 timelock, bool claimed, bool refunded, string swapId, uint8 swapType, string sourceChain, string destChain, string sourceTxHash, address resolverAddress, uint256 minAmount, uint256 createdAt, address token, string aptosReceiver))",
  ];

  const ETH_TOKEN: TokenData = {
    symbol: "ETH",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    chain: "Ethereum",
    price: prices.eth,
  };

  const APT_TOKEN: TokenData = {
    symbol: "APT",
    name: "Aptos",
    image:
      "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
    chain: "Aptos",
    price: prices.apt,
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

  // Calculate APTOS amount when ETH amount changes
  useEffect(() => {
    if (ethAmount && prices.eth && prices.apt) {
      const ethValue = parseFloat(ethAmount);
      const exchangeRate = prices.eth / prices.apt;
      const aptValue = ethValue * exchangeRate;
      setAptosAmount(aptValue.toFixed(6));

      setQuoteData({
        ethAmount: ethValue,
        aptosAmount: aptValue,
        exchangeRate,
        ethPrice: prices.eth,
        aptPrice: prices.apt,
      });
    } else {
      setAptosAmount("");
      setQuoteData(null);
    }
  }, [ethAmount, prices]);

  // Fetch prices on mount and every 30 seconds
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate secret and hashlocks
  const generateSecret = () => {
    const secret = ethers.randomBytes(32);
    const ethHashlock = ethers.keccak256(secret);
    const aptosHashlock = ethers.sha256(secret);

    return {
      secret: ethers.hexlify(secret),
      ethHashlock,
      aptosHashlock,
      secretBytes: Array.from(secret),
    };
  };

  // Generate unique swap ID
  const generateSwapId = () => {
    return "swap_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  };

  // Get quote
  const getQuote = async () => {
    if (!ethAmount || !isConnected) return;

    setIsLoading(true);
    try {
      await fetchPrices();
      toast.success("Quote updated successfully");
    } catch (error) {
      toast.error("Failed to get quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!walletClient || !ethAmount || !aptosReceiver || !quoteData) {
      console.log("Missing required data:", {
        walletClient: !!walletClient,
        ethAmount,
        aptosReceiver,
        quoteData: !!quoteData,
      });
      return;
    }

    setIsSwapping(true);
    setSwapStatus({ stage: "creating", message: "Creating ETH swap..." });

    try {
      // Validate Aptos address
      if (!/^0x[a-fA-F0-9]{64}$/.test(aptosReceiver)) {
        toast.error("Invalid Aptos address format");
        setSwapStatus({ stage: "failed", message: "Invalid Aptos address" });
        return;
      }

      // Generate swap data
      const secret = generateSecret();
      const swapId = generateSwapId();
      const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      console.log("Creating swap with data:", {
        swapId,
        secret: secret.secret,
        ethAmount,
        aptosReceiver,
        timelock,
      });

      const swapToast = toast.loading("Creating ETH swap...");

      // Create contract instance using ethers.js
      const provider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        walletSigner
      );

      // Create swap parameters
      const swapParams = {
        receiver: "0xEAde2298C7d1b5C748103da66D6Dd9Cf204E2AD2", // Resolver address
        amount: ethers.parseEther(ethAmount),
        hashlock: secret.ethHashlock,
        timelock: timelock,
        swapId: swapId,
        swapType: 0, // ETH_TO_APTOS
        sourceChain: "ethereum",
        destChain: "aptos",
        sourceTxHash: "",
        resolverAddress: "0xEAde2298C7d1b5C748103da66D6Dd9Cf204E2AD2",
        minAmount: ethers.parseEther(ethAmount),
        token: ethers.ZeroAddress,
        aptosReceiver: aptosReceiver,
      };

      console.log("Swap params:", swapParams);

      // Send transaction
      const tx = await contract.createEthToAptosSwap(swapParams, {
        value: ethers.parseEther(ethAmount),
        gasLimit: 500000,
      });

      setSwapStatus({
        stage: "eth-confirming",
        message: "Waiting for ETH transaction confirmation...",
      });
      toast.loading("Waiting for ETH transaction confirmation...", {
        id: swapToast,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      toast.dismiss(swapToast);

      // Handle transaction hash safely
      const txHash = receipt?.transactionHash || receipt?.hash || tx.hash;
      const shortHash = txHash ? `${txHash.slice(0, 10)}...` : "Unknown";

      toast.success(`ETH swap created successfully! Hash: ${shortHash}`);

      // Store swap data for resolver
      localStorage.setItem(
        "lastSwap",
        JSON.stringify({
          swapId,
          secret,
          txHash: txHash || "Unknown",
          ethAmount: parseFloat(ethAmount),
          aptosAmount: quoteData.aptosAmount,
          receiverAddress: aptosReceiver,
          timestamp: new Date().toISOString(),
        })
      );

      // Reset form
      setEthAmount("");
      setAptosAmount("");
      setAptosReceiver("");
      setShowReceiverInput(false);
      setQuoteData(null);

      // Call resolver API to complete Aptos side
      try {
        setSwapStatus({
          stage: "aptos-processing",
          message: "Completing Aptos side...",
          details:
            "This may take a few moments while the resolver processes your swap.",
        });
        const aptosToast = toast.loading(
          "Completing Aptos side... This may take a few moments."
        );

        const resolverResponse = await fetch("/api/resolver", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            swapId,
            secret: secret.secret,
            aptosAmount: Math.floor(quoteData.aptosAmount * 1000000), // Convert to octas
          }),
        });

        const resolverResult = await resolverResponse.json();

        toast.dismiss(aptosToast);

        if (resolverResult.success) {
          setSwapStatus({
            stage: "completed",
            message: "Swap completed successfully!",
            details: `You can now claim ${quoteData.aptosAmount.toFixed(
              6
            )} APT on Aptos chain.`,
          });
          toast.success(
            "🎉 Complete swap successful! APTOS tokens available on Aptos chain.",
            {
              description: `You can now claim ${quoteData.aptosAmount.toFixed(
                6
              )} APT on Aptos chain using your secret.`,
            }
          );
          console.log("Resolver completed:", resolverResult.data);
        } else {
          setSwapStatus({
            stage: "failed",
            message: "Resolver failed",
            details: resolverResult.error,
          });
          toast.error(`Resolver failed: ${resolverResult.error}`, {
            description:
              "You can run the resolver manually to complete the swap.",
          });
          console.error("Resolver error:", resolverResult.error);
        }
      } catch (resolverError) {
        setSwapStatus({
          stage: "failed",
          message: "Resolver API failed",
          details: "Check console for manual resolver instructions.",
        });
        toast.error(
          "Resolver API call failed. You can run the resolver manually.",
          {
            description: "Check the console for manual resolver instructions.",
          }
        );
        console.error("Resolver API error:", resolverError);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setSwapStatus({
        stage: "failed",
        message: "Swap failed",
        details: errorMessage,
      });
      toast.error(`Swap failed: ${errorMessage}`);
      console.error("Swap error:", error);
    } finally {
      setIsSwapping(false);
    }
  };

  // Handle swap button click
  const handleSwapClick = () => {
    console.log("Swap button clicked");
    console.log("Current state:", {
      isConnected,
      ethAmount,
      showReceiverInput,
      aptosReceiver,
      isSwapping,
    });

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      toast.error("Please enter a valid ETH amount");
      return;
    }

    if (!showReceiverInput) {
      setShowReceiverInput(true);
      return;
    }

    if (!aptosReceiver) {
      toast.error("Please enter Aptos receiver address");
      return;
    }

    executeSwap();
  };

  const getSwapButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!ethAmount || parseFloat(ethAmount) <= 0) return "Enter Amount";
    if (!showReceiverInput) return "Get Quote";
    if (!aptosReceiver) return "Enter Receiver Address";
    if (isSwapping) return "Creating Swap...";
    return "Swap";
  };

  const isSwapButtonDisabled = () => {
    return (
      !isConnected || !ethAmount || parseFloat(ethAmount) <= 0 || isSwapping
    );
  };

  // Status indicator component
  const StatusIndicator = () => {
    if (swapStatus.stage === "idle") return null;

    const getStatusIcon = () => {
      switch (swapStatus.stage) {
        case "creating":
        case "eth-confirming":
        case "aptos-processing":
          return <ClockIcon className="w-5 h-5 text-blue-400 animate-spin" />;
        case "completed":
          return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
        case "failed":
          return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
        default:
          return null;
      }
    };

    const getStatusColor = () => {
      switch (swapStatus.stage) {
        case "creating":
        case "eth-confirming":
        case "aptos-processing":
          return "bg-blue-500/10 border-blue-500/20 text-blue-400";
        case "completed":
          return "bg-green-500/10 border-green-500/20 text-green-400";
        case "failed":
          return "bg-red-500/10 border-red-500/20 text-red-400";
        default:
          return "bg-gray-500/10 border-gray-500/20 text-gray-400";
      }
    };

    return (
      <div className={`mt-4 p-4 border rounded-lg ${getStatusColor()}`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-medium">{swapStatus.message}</div>
            {swapStatus.details && (
              <div className="text-sm opacity-80 mt-1">
                {swapStatus.details}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Title */}
      <div className="text-center mb-6">
        <span className="text-xl font-semibold text-white">Swap</span>
      </div>

      {/* You Pay */}
      <div className="mb-4">
        <TokenInput
          label="You Pay"
          token={ETH_TOKEN}
          value={ethAmount}
          onChange={setEthAmount}
          onMaxClick={() => setEthAmount("0.001")} // Demo max amount
          usdValue={ethAmount ? parseFloat(ethAmount) * prices.eth : 0}
        />
      </div>

      {/* Arrow */}
      <div className="flex justify-center my-4">
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
          <ArrowDownIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* You Receive */}
      <div className="mb-6">
        <TokenInput
          label="You Receive"
          token={APT_TOKEN}
          value={aptosAmount}
          onChange={setAptosAmount}
          readOnly
          usdValue={aptosAmount ? parseFloat(aptosAmount) * prices.apt : 0}
        />
      </div>

      {/* Receiver Address Input */}
      {showReceiverInput && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Aptos Receiver Address
          </label>
          <input
            type="text"
            value={aptosReceiver}
            onChange={(e) => setAptosReceiver(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter the Aptos address where you want to receive APT tokens
          </p>
        </div>
      )}

      {/* Status Indicator */}
      <StatusIndicator />

      {/* Swap Button */}
      <button
        onClick={handleSwapClick}
        disabled={isSwapButtonDisabled()}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isSwapButtonDisabled()
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {getSwapButtonText()}
      </button>

      {/* Quote Info */}
      {quoteData && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 space-y-1">
            <div>Rate: 1 ETH = {quoteData.exchangeRate.toFixed(2)} APT</div>
            <div>ETH Price: ${quoteData.ethPrice.toFixed(2)}</div>
            <div>APT Price: ${quoteData.aptPrice.toFixed(4)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
