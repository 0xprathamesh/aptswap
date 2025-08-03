import React from "react";
import TokenInput from "./TokenInput";
import { ArrowDownUp } from "lucide-react";
import { useAccount } from "wagmi";

interface Token {
  symbol: string;
  name: string;
  logoURI: string;
  address: string;
  chain: string;
}

interface TokenInputWrapperProps {
  amount: string;
  amountOut: string;
  setAmount: (value: string) => void;
  setAmountOut: (value: string) => void;
  handleInterchange: () => void;
  isLoading: boolean;
  tokenIn?: Token;
  tokenOut?: Token;
  onTokenInSelect: (token: Token) => void;
  onTokenOutSelect: (token: Token) => void;
  usdValue?: number;
  balance?: string;
}

const TokenInputWrapper: React.FC<TokenInputWrapperProps> = ({
  amount,
  amountOut,
  setAmount,
  setAmountOut,
  handleInterchange,
  isLoading,
  tokenIn,
  tokenOut,
  onTokenInSelect,
  onTokenOutSelect,
  usdValue,
  balance,
}) => {
  const { isConnected } = useAccount();

  return (
    <div className="relative">
      <TokenInput
        type="in"
        amount={amount}
        setAmount={setAmount}
        text="Pay"
        disabled={!isConnected}
        selectedToken={tokenIn}
        onTokenSelect={onTokenInSelect}
        usdValue={usdValue}
        balance={balance}
      />

      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/4 top-1/2">
        <button
          className="text-white p-4 hover:bg-violet-600 border border-white/20 bg-[#111315] transition duration-300 rounded-full"
          onClick={handleInterchange}
        >
          <ArrowDownUp />
        </button>
      </div>

      <TokenInput
        type="out"
        amount={amountOut}
        isLoading={isLoading}
        setAmount={setAmountOut}
        text="Receive"
        disabled
        selectedToken={tokenOut}
        onTokenSelect={onTokenOutSelect}
      />
    </div>
  );
};

export default TokenInputWrapper;
