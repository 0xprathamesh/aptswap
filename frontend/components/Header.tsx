"use client";
import Link from "next/link";
import { ConnectKitButton } from "connectkit";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 border-b border-gray-700/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-white">CrossChain Swap</div>
              <div className="text-xs text-blue-300">Sepolia ↔ Aptos</div>
            </div>
          </Link>
        </div>
        <div>
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
