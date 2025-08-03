"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

interface PendingClaim {
  swapId: string;
  secret: string;
  secretBytes: number[];
  aptosAmount: number;
  receiverAddress: string;
  timestamp: string;
}

const ClaimTokens: React.FC = () => {
  const [pendingClaim, setPendingClaim] = useState<PendingClaim | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pendingClaim");
    if (stored) {
      try {
        setPendingClaim(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing pending claim:", error);
      }
    }
  }, []);

  const clearPendingClaim = () => {
    localStorage.removeItem("pendingClaim");
    setPendingClaim(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!pendingClaim) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Claim Your APT Tokens
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-300 mb-1">Swap ID:</label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-700 px-2 py-1 rounded text-green-400 flex-1">
                {pendingClaim.swapId}
              </code>
              <button
                onClick={() => copyToClipboard(pendingClaim.swapId)}
                className="text-blue-400 hover:text-blue-300"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Secret:</label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-700 px-2 py-1 rounded text-green-400 flex-1">
                {pendingClaim.secret}
              </code>
              <button
                onClick={() => copyToClipboard(pendingClaim.secret)}
                className="text-blue-400 hover:text-blue-300"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Secret Bytes:</label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-700 px-2 py-1 rounded text-green-400 flex-1">
                [{pendingClaim.secretBytes.join(", ")}]
              </code>
              <button
                onClick={() =>
                  copyToClipboard(`[${pendingClaim.secretBytes.join(", ")}]`)
                }
                className="text-blue-400 hover:text-blue-300"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">APT Amount:</label>
            <span className="text-white font-medium">
              {pendingClaim.aptosAmount.toFixed(6)} APT
            </span>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">
              Receiver Address:
            </label>
            <code className="bg-gray-700 px-2 py-1 rounded text-green-400 block">
              {pendingClaim.receiverAddress}
            </code>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-semibold text-blue-400 mb-2">How to Claim:</h4>
          <ol className="text-sm text-gray-300 space-y-1">
            <li>1. Connect to Aptos Devnet</li>
            <li>
              2. Call{" "}
              <code className="bg-gray-700 px-1 rounded">claim_swap</code>{" "}
              function
            </li>
            <li>3. Use the Swap ID and Secret Bytes above</li>
            <li>4. Tokens will be transferred to your wallet</li>
          </ol>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={clearPendingClaim}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              const claimData = {
                swapId: pendingClaim.swapId,
                secret: pendingClaim.secret,
                secretBytes: pendingClaim.secretBytes,
                aptosAmount: pendingClaim.aptosAmount,
                receiverAddress: pendingClaim.receiverAddress,
              };
              copyToClipboard(JSON.stringify(claimData, null, 2));
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors"
          >
            Copy All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimTokens;
