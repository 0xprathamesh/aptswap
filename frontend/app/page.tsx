"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import SwapInterface from "@/components/SwapInterface";
import ClaimTokens from "@/components/ClaimTokens";
import { toast } from "sonner";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">CrossChain Swap</h1>
              <p className="text-blue-300">Sepolia ↔ Aptos Bridge</p>
            </div>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Seamlessly swap tokens between Sepolia and Aptos networks using atomic swaps
          </p>
        </div>

        {/* Swap Interface */}
        <SwapInterface />

        {/* Connection Notice */}
        {!isConnected && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-md mx-auto">
            <p className="text-yellow-400 text-sm text-center">
              Please connect your wallet to start swapping
            </p>
          </div>
        )}

        {/* Claim Tokens Modal */}
        <ClaimTokens />
      </div>
    </main>
  );
}
