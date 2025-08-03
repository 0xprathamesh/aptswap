import React from "react";
import TokenSelector from "./TokenSelector";

interface Token {
  symbol: string;
  name: string;
  logoURI: string;
  address: string;
  chain: string;
}

interface TokenInputProps {
  type: "in" | "out";
  amount: string;
  setAmount: (value: string) => void;
  text: string;
  disabled?: boolean;
  isLoading?: boolean;
  usdValue?: number;
  balance?: string;
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
}

const TokenInput: React.FC<TokenInputProps> = ({
  type,
  amount,
  setAmount,
  text,
  disabled,
  isLoading,
  usdValue,
  balance,
  selectedToken,
  onTokenSelect,
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const renderPriceImpactUsd = () => (
    <p className="flex space-x-[4px]">
      <span>{usdValue ? `~ ${usdValue.toFixed(2)}` : "~ 0.00"}</span>
      <span> USD</span>
    </p>
  );

  const renderBalance = () => (
    <div className="space-x-[4px] flex">
      <span>Balance:</span>
      <span>{balance || "0.00000000"}</span>
    </div>
  );

  return (
    <div className="mb-6 p-4 border border-white/20 rounded-lg">
      <div className="flex justify-between">
        <div className="flex flex-col space-y-[8px] opacity-50">
          <p>{text}</p>
          {isLoading ? (
            <div className="animate-pulse bg-gray-300/30 h-6 w-20"></div>
          ) : (
            <input
              type="number"
              placeholder="0"
              min={0}
              value={amount}
              onChange={handleAmountChange}
              className="max-w-[155px] h-6 bg-transparent border-none outline-none text-[26px] font-bold"
              disabled={disabled}
            />
          )}
        </div>
        <TokenSelector
          type={type}
          selectedToken={selectedToken}
          onTokenSelect={onTokenSelect}
        />
      </div>
      {type === "in" && (
        <div className="flex justify-between mt-[12px] opacity-50">
          {renderPriceImpactUsd()}
          {renderBalance()}
        </div>
      )}
    </div>
  );
};

export default TokenInput;
