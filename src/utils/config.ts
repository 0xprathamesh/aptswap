import { ChainConfig, TokenInfo, CrossChainConfig } from "@/types";

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://sepolia.drpc.org",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {
      resolver: "0x57127879803e313659c1e0dF410ec73ddf5A11F7",
      escrowFactory: "0x219F228e8e46Eb384FD299F0784e5CA8c67B4480",
    },
  },
  {
    chainId: 1,
    name: "Ethereum",
    rpcUrl:
      process.env.MAINNET_RPC_URL ||
      "https://eth-mainnet.g.alchemy.com/v2/your_key",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    rpcUrl:
      process.env.ARBITRUM_RPC_URL ||
      "https://arb-mainnet.g.alchemy.com/v2/your_key",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 137,
    name: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 56,
    name: "BSC",
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 10,
    name: "Optimism",
    rpcUrl: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {},
  },
  {
    chainId: 999999,
    name: "Aptos Testnet",
    rpcUrl:
      process.env.APTOS_RPC_URL || "https://fullnode.testnet.aptoslabs.com",
    explorerUrl: "https://explorer.aptoslabs.com",
    nativeCurrency: {
      name: "Aptos Coin",
      symbol: "APT",
      decimals: 8,
    },
    contracts: {},
  },
];

export const SUPPORTED_TOKENS: TokenInfo[] = [
  // Sepolia Testnet
  {
    address: "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f",
    symbol: "mUSDC",
    name: "Mock USDC",
    decimals: 18,
    chainId: 11155111,
  },
  // Aptos Testnet (using string chainId for now)
  {
    address:
      "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::my_token::SimpleToken",
    symbol: "CST",
    name: "Cross Swap Token",
    decimals: 8,
    chainId: 999999, // Placeholder for Aptos
  },
  // Ethereum
  {
    address: "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 1,
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: 1,
  },
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    chainId: 1,
  },
  // Arbitrum
  {
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 42161,
  },
  {
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: 42161,
  },
  // Base
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 8453,
  },
  // Polygon
  {
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 137,
  },
  {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: 137,
  },
  // BSC
  {
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    chainId: 56,
  },
  {
    address: "0x55d398326f99059fF775485246999027B3197955",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    chainId: 56,
  },
  // Optimism
  {
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 10,
  },
  {
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chainId: 10,
  },
];

export const CROSS_CHAIN_CONFIG: CrossChainConfig = {
  supportedChains: SUPPORTED_CHAINS,
  supportedTokens: SUPPORTED_TOKENS,
  defaultGasLimit: 500000,
  defaultGasPrice: "20000000000", // 20 gwei
  maxSlippage: 0.5, // 0.5%
  minAmount: "1000000", // 1 USDC (6 decimals)
  maxAmount: "1000000000000", // 1M USDC
};

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((chain) => chain.chainId === chainId);
}

export function getTokenInfo(
  address: string,
  chainId: number
): TokenInfo | undefined {
  return SUPPORTED_TOKENS.find(
    (token) =>
      token.address.toLowerCase() === address.toLowerCase() &&
      token.chainId === chainId
  );
}

export function getNativeToken(chainId: number): TokenInfo {
  const chain = getChainConfig(chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  return {
    address: "0x0000000000000000000000000000000000000000",
    symbol: chain.nativeCurrency.symbol,
    name: chain.nativeCurrency.name,
    decimals: chain.nativeCurrency.decimals,
    chainId,
  };
}

export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some((chain) => chain.chainId === chainId);
}

export function isTokenSupported(address: string, chainId: number): boolean {
  return SUPPORTED_TOKENS.some(
    (token) =>
      token.address.toLowerCase() === address.toLowerCase() &&
      token.chainId === chainId
  );
}
