"use client";

import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface Token {
  symbol: string;
  name: string;
  logoURI: string;
  address: string;
  chain: string;
}

interface TokenSelectorProps {
  type: "in" | "out";
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  type,
  selectedToken,
  onTokenSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const tokens: Token[] = [
    {
      symbol: "mUSDC",
      name: "Mock USDC",
      logoURI:
        "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
      address: "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f",
      chain: "Sepolia",
    },
    {
      symbol: "APT",
      name: "Aptos",
      logoURI:
        "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
      address: "0x1::aptos_coin::AptosCoin",
      chain: "Aptos",
    },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
  };

  const toggleSelector = () => setIsOpen((prev) => !prev);

  const filteredTokens = tokens.filter((token) =>
    [token.name, token.symbol].some((field) =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <>
      <button
        onClick={toggleSelector}
        className="bg-white/5 border-white/20 border text-white px-[10px] rounded md:min-w-[120px] flex items-center"
      >
        {selectedToken ? (
          <>
            <img
              src={selectedToken.logoURI}
              alt={`${selectedToken.symbol} logo`}
              className="w-6 h-6 mr-2"
            />
            {selectedToken.symbol}
          </>
        ) : (
          <div className="flex justify-between w-full">
            <span>Select Token</span>
            <ChevronDown />
          </div>
        )}
      </button>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-40">
          <div className="flex flex-col bg-[#1A1D1F]/80 mx-[12px] backdrop-blur-lg border border-white/10 rounded-lg shadow-lg max-w-md w-full max-h-[500px] p-6">
            <button
              onClick={toggleSelector}
              className="text-red-500 mb-4 absolute top-0 right-0 p-3"
            >
              <X color="#6d28d9" />
            </button>
            <div>
              <label htmlFor="token-search" className="block mb-2">
                Search Token:
              </label>
              <input
                id="token-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name or symbol"
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="mt-4 overflow-y-auto flex-1">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <img
                      src={token.logoURI}
                      alt={`${token.symbol} logo`}
                      className="w-8 h-8 mr-3"
                    />
                    <div className="text-left">
                      <div className="text-white font-medium">{token.symbol}</div>
                      <div className="text-gray-400 text-sm">{token.name}</div>
                      <div className="text-gray-500 text-xs">{token.chain}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-gray-400 text-center py-4">
                  No tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TokenSelector;
