import { z } from "zod";

export enum ExtendedNetworkEnum {
  ETHEREUM = 1,
  SEPOLIA = 11155111,
  ARBITRUM = 42161,
  BASE = 8453,
  BSC = 56,
  APTOS = "APTOS",
  APTOS_TESTNET = "APTOS_TESTNET",
}

export interface ChainConfig {
  chainId: ExtendedNetworkEnum | number;
  url: string;
  createFork: boolean;
  limitOrderProtocol: string;
  wrappedNative: string;
  ownerPrivateKey: string;
  blockNumber: number;
  tokens: Record<
    string,
    {
      address: string;
      donor: string;
      decimals: number;
      symbol: string;
      name: string;
    }
  >;
}

export interface AptosConfig {
  chainId: string;
  url: string;
  createFork: boolean;
  ownerPrivateKey: string;
  moduleAddress: string;
  tokens: Record<
    string,
    {
      address: string;
      donor: string;
      decimals: number;
      symbol: string;
      name: string;
    }
  >;
}

const bool = z
  .string()
  .transform((v) => v.toLowerCase() === "true")
  .pipe(z.boolean());

const ConfigSchema = z.object({
  SRC_CHAIN_RPC: z.string().url(),
  DST_CHAIN_RPC: z.string().url(),
  SRC_CHAIN_CREATE_FORK: bool.default("true"),
  DST_CHAIN_CREATE_FORK: bool.default("true"),
  APTOS_NODE_URL: z.string().url().optional(),
  APTOS_PRIVATE_KEY: z.string().optional(),
  APTOS_ADDRESS: z.string().optional(),
  APTOS_MODULE_ADDRESS: z.string().optional(),
  DEV_PORTAL_KEY: z.string().optional(),
  // User private keys
  USER_SEPOLIA_PRIVATE_KEY: z.string().optional(),
  USER_APTOS_PRIVATE_KEY: z.string().optional(),
  // Liquidity provider private keys
  LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY: z.string().optional(),
  LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY: z.string().optional(),
  LIQUIDITY_PROVIDER_SEPOLIA_ADDRESS: z.string().optional(),
  LIQUIDITY_PROVIDER_APTOS_ADDRESS: z.string().optional(),
  // Legacy wallet keys
  WALLET_PRIVATE_KEY: z.string().optional(),
  WALLET_ADDRESS: z.string().optional(),
});

const fromEnv = ConfigSchema.parse(process.env);

export const extendedConfig = {
  chain: {
    ethereum: {
      chainId: ExtendedNetworkEnum.ETHEREUM,
      url: fromEnv.SRC_CHAIN_RPC,
      createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
      limitOrderProtocol: "0x111111125421ca6dc452d289314280a0f8842a65",
      wrappedNative: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY ||
        process.env.WALLET_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      blockNumber: 19991288,
      tokens: {
        USDC: {
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          donor: "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa",
          decimals: 6,
          symbol: "USDC",
          name: "USD Coin",
        },
        USDT: {
          address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
          donor: "0x5754284f345afc66a98fbb0a0a71bc8c60031b54",
          decimals: 6,
          symbol: "USDT",
          name: "Tether USD",
        },
        WETH: {
          address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          donor: "0x2fa937483d6b6b6b6b6b6b6b6b6b6b6b6b6b6b",
          decimals: 18,
          symbol: "WETH",
          name: "Wrapped Ether",
        },
      },
    },

    sepolia: {
      chainId: ExtendedNetworkEnum.SEPOLIA,
      url: "https://sepolia.drpc.org",
      createFork: false,
      limitOrderProtocol: "0x111111125421ca6dc452d289314280a0f8842a65",
      wrappedNative: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY ||
        process.env.SEPOLIA_PRIVATE_KEY ||
        process.env.WALLET_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      blockNumber: 8894594,
      tokens: {
        USDC: {
          address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          donor: "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa",
          decimals: 6,
          symbol: "USDC",
          name: "USD Coin (Sepolia)",
        },
        USDT: {
          address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
          donor: "0x4188663a85C92EEa35b5AD3AA5cA7CeB237C6fe9",
          decimals: 6,
          symbol: "USDT",
          name: "Tether USD (Sepolia)",
        },
        WETH: {
          address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
          donor: "0x2fa937483d6b6b6b6b6b6b6b6b6b6b6b6b6b6b",
          decimals: 18,
          symbol: "WETH",
          name: "Wrapped Ether (Sepolia)",
        },
      },
    },

    arbitrum: {
      chainId: ExtendedNetworkEnum.ARBITRUM,
      url: "https://arb1.arbitrum.io/rpc",
      createFork: false,
      limitOrderProtocol: "0x111111125421ca6dc452d289314280a0f8842a65",
      wrappedNative: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY ||
        process.env.WALLET_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      blockNumber: 19991288,
      tokens: {
        USDC: {
          address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
          donor: "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa",
          decimals: 6,
          symbol: "USDC",
          name: "USD Coin (Arbitrum)",
        },
        USDT: {
          address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          donor: "0x4188663a85C92EEa35b5AD3AA5cA7CeB237C6fe9",
          decimals: 6,
          symbol: "USDT",
          name: "Tether USD (Arbitrum)",
        },
        WETH: {
          address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          donor: "0x2fa937483d6b6b6b6b6b6b6b6b6b6b6b6b6b6b",
          decimals: 18,
          symbol: "WETH",
          name: "Wrapped Ether (Arbitrum)",
        },
      },
    },

    base: {
      chainId: ExtendedNetworkEnum.BASE,
      url: "https://mainnet.base.org",
      createFork: false,
      limitOrderProtocol: "0x111111125421ca6dc452d289314280a0f8842a65",
      wrappedNative: "0x4200000000000000000000000000000000000006",
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY ||
        process.env.WALLET_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      blockNumber: 19991288,
      tokens: {
        USDC: {
          address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
          donor: "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa",
          decimals: 6,
          symbol: "USDC",
          name: "USD Coin (Base)",
        },
        WETH: {
          address: "0x4200000000000000000000000000000000000006",
          donor: "0x2fa937483d6b6b6b6b6b6b6b6b6b6b6b6b6b6b",
          decimals: 18,
          symbol: "WETH",
          name: "Wrapped Ether (Base)",
        },
      },
    },

    bsc: {
      chainId: ExtendedNetworkEnum.BSC,
      url: "https://bsc-dataseed.binance.org",
      createFork: false,
      limitOrderProtocol: "0x111111125421ca6dc452d289314280a0f8842a65",
      wrappedNative: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY ||
        process.env.WALLET_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      blockNumber: 29621722,
      tokens: {
        USDC: {
          address: "0x8965349fb649a33a30cbfda057d8ec2c48abe2a2",
          donor: "0x4188663a85C92EEa35b5AD3AA5cA7CeB237C6fe9",
          decimals: 6,
          symbol: "USDC",
          name: "USD Coin (BSC)",
        },
        USDT: {
          address: "0x55d398326f99059ff775485246999027b3197955",
          donor: "0x4188663a85C92EEa35b5AD3AA5cA7CeB237C6fe9",
          decimals: 6,
          symbol: "USDT",
          name: "Tether USD (BSC)",
        },
        WBNB: {
          address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          donor: "0x2fa937483d6b6b6b6b6b6b6b6b6b6b6b6b6b6b",
          decimals: 18,
          symbol: "WBNB",
          name: "Wrapped BNB",
        },
      },
    },
  },

  aptos: {
    mainnet: {
      chainId: ExtendedNetworkEnum.APTOS,
      url: "https://fullnode.mainnet.aptoslabs.com/v1",
      createFork: false,
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY ||
        process.env.APTOS_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      moduleAddress:
        process.env.APTOS_MODULE_ADDRESS ||
        "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
      tokens: {
        MY_TOKEN: {
          address:
            "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::my_token::SimpleToken",
          donor:
            "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
          decimals: 8,
          symbol: "CST",
          name: "Custom Simple Token",
        },
      },
    },
    testnet: {
      chainId: ExtendedNetworkEnum.APTOS_TESTNET,
      url: "https://fullnode.testnet.aptoslabs.com/v1",
      createFork: false,
      ownerPrivateKey:
        process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY ||
        process.env.APTOS_PRIVATE_KEY ||
        "0xe47bc1ab7808c62c9e2d01437891e9b9d69b8c1d845d317be14dea9b36bfe090",
      moduleAddress:
        process.env.APTOS_MODULE_ADDRESS ||
        "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
      tokens: {
        MY_TOKEN: {
          address:
            "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::my_token::SimpleToken",
          donor:
            "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e",
          decimals: 8,
          symbol: "CST",
          name: "Custom Simple Token (Testnet)",
        },
      },
    },
  },

  api: {
    baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
    timeout: parseInt(process.env.API_TIMEOUT || "30000"),
    retries: parseInt(process.env.API_RETRIES || "3"),
  },

  server: {
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "localhost",
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
  },
} as const;

export type ExtendedChainConfig =
  (typeof extendedConfig.chain)[keyof typeof extendedConfig.chain];
export type ExtendedAptosConfig = typeof extendedConfig.aptos;

export function getChainConfig(
  chainId: ExtendedNetworkEnum | number
): ChainConfig | undefined {
  const chainKey = Object.keys(extendedConfig.chain).find(
    (key) =>
      extendedConfig.chain[key as keyof typeof extendedConfig.chain].chainId ===
      chainId
  );
  return chainKey
    ? extendedConfig.chain[chainKey as keyof typeof extendedConfig.chain]
    : undefined;
}

export function getAptosConfig(): AptosConfig {
  return extendedConfig.aptos.testnet;
}

export function isAptosChain(chainId: ExtendedNetworkEnum | number): boolean {
  return (
    chainId === ExtendedNetworkEnum.APTOS ||
    chainId === ExtendedNetworkEnum.APTOS_TESTNET
  );
}

export function isEVMChain(chainId: ExtendedNetworkEnum | number): boolean {
  return typeof chainId === "number";
}

export function getSupportedChains(): Array<{
  chainId: ExtendedNetworkEnum | number;
  name: string;
}> {
  return [
    { chainId: ExtendedNetworkEnum.ETHEREUM, name: "Ethereum" },
    { chainId: ExtendedNetworkEnum.SEPOLIA, name: "Sepolia" },
    { chainId: ExtendedNetworkEnum.ARBITRUM, name: "Arbitrum" },
    { chainId: ExtendedNetworkEnum.BASE, name: "Base" },
    { chainId: ExtendedNetworkEnum.BSC, name: "BSC" },
    { chainId: ExtendedNetworkEnum.APTOS, name: "Aptos Mainnet" },
    { chainId: ExtendedNetworkEnum.APTOS_TESTNET, name: "Aptos Testnet" },
  ];
}

export function getSupportedTokens(
  chainId: ExtendedNetworkEnum | number
): Array<{ symbol: string; address: string; decimals: number; name: string }> {
  const config = getChainConfig(chainId);
  if (!config) return [];

  return Object.entries(config.tokens).map(([symbol, token]) => ({
    symbol,
    address: token.address,
    decimals: token.decimals,
    name: token.name,
  }));
}
