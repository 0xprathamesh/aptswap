export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    escrowFactory?: string;
    resolver?: string;
    limitOrderProtocol?: string;
  };
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

export interface SwapQuote {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcAmount: string;
  dstAmount: string;
  exchangeRate: number;
  estimatedGas: string;
  gasPrice: string;
  fees: {
    protocolFee: string;
    gasFee: string;
    crossChainFee: string;
  };
  route: SwapRoute[];
  timestamp: string;
  validUntil: string;
  quoteId: string;
}

export interface SwapRoute {
  from: string;
  to: string;
  exchange: string;
  chainId: number;
  estimatedGas?: string;
}

export interface SwapOrder {
  orderId: string;
  quoteId: string;
  maker: string;
  taker?: string;
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcAmount: string;
  dstAmount: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  secretHash: string;
  secret?: string;
  escrowAddress?: string;
  transactionHash?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  FUNDED = 'funded',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface EscrowInfo {
  address: string;
  chainId: number;
  maker: string;
  taker: string;
  token: string;
  amount: string;
  secretHash: string;
  timelock: number;
  status: EscrowStatus;
  createdAt: string;
}

export enum EscrowStatus {
  CREATED = 'created',
  FUNDED = 'funded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface CrossChainConfig {
  supportedChains: ChainConfig[];
  supportedTokens: TokenInfo[];
  defaultGasLimit: number;
  defaultGasPrice: string;
  maxSlippage: number;
  minAmount: string;
  maxAmount: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    rpc: boolean;
    contracts: boolean;
  };
  version: string;
} 