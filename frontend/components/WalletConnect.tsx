"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";

interface WalletConnectProps {
  swapDirection: "ETH-APT" | "APT-ETH";
}

const WalletConnect: React.FC<WalletConnectProps> = ({ swapDirection }) => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [petraAddress, setPetraAddress] = useState<string | null>(null);
  const [isPetraConnected, setIsPetraConnected] = useState(false);

  // Check if Petra wallet is available
  const isPetraAvailable = typeof window !== "undefined" && "petra" in window;

  // Connect to Petra wallet
  const connectPetra = async () => {
    if (!isPetraAvailable) {
      alert("Petra wallet not found. Please install Petra extension.");
      return;
    }

    try {
      const petra = (window as any).petra;
      const account = await petra.connect();
      setPetraAddress(account.address);
      setIsPetraConnected(true);
    } catch (error) {
      console.error("Failed to connect to Petra:", error);
      alert("Failed to connect to Petra wallet");
    }
  };

  // Disconnect from Petra wallet
  const disconnectPetra = () => {
    setPetraAddress(null);
    setIsPetraConnected(false);
  };

  // Auto-connect to appropriate wallet based on swap direction
  useEffect(() => {
    if (swapDirection === "APT-ETH" && isPetraAvailable && !isPetraConnected) {
      // For APT to ETH swaps, suggest Petra
      console.log("APT to ETH swap detected - Petra wallet recommended");
    }
  }, [swapDirection, isPetraAvailable, isPetraConnected]);

  // Render appropriate wallet connection based on swap direction
  if (swapDirection === "APT-ETH") {
    return (
      <div className="flex flex-col space-y-2">
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
    );
  }

  // For ETH to APT swaps, use ConnectKit (MetaMask)
  return (
    <div className="flex flex-col space-y-2">
      {isConnected ? (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 text-sm">
              MetaMask: {address?.slice(0, 8)}...{address?.slice(-6)}
            </span>
          </div>
          <button
            onClick={() => disconnect()}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <ConnectKitButton />
      )}
    </div>
  );
};

export default WalletConnect;
