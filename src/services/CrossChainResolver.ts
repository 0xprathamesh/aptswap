import { ethers, JsonRpcProvider, Interface } from "ethers";


const SEPOLIA_CONTRACTS = {
  resolver: "0x57127879803e313659c1e0dF410ec73ddf5A11F7",
  factory: "0x219F228e8e46Eb384FD299F0784e5CA8c67B4480",
};


const RESOLVER_ABI = [
  "function createDstEscrow((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256), uint256) external payable",
  "function withdraw(address, bytes32, (bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256)) external",
  "function cancel(address, (bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256)) external",
];

const ESCROW_ABI = [
  "function withdraw(bytes32, (bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256)) external",
  "function cancel((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256)) external",
];


export interface EscrowImmutables {
  orderHash: string;
  secretHash: string;
  maker: bigint;
  taker: bigint;
  token: bigint;
  amount: bigint;
  safetyDeposit: bigint;
  timeLocks: bigint;
}

export interface DeploySrcResult {
  to: string;
  data: string;
  value: bigint;
}

export interface DeployDstResult {
  to: string;
  data: string;
  value: bigint;
}

export interface WithdrawResult {
  to: string;
  data: string;
}

export interface CancelResult {
  to: string;
  data: string;
}

export class CrossChainResolver {
  private resolverIface: Interface;
  private escrowIface: Interface;

  constructor(
    private readonly srcAddress: string = SEPOLIA_CONTRACTS.resolver,
    private readonly dstAddress: string = SEPOLIA_CONTRACTS.factory
  ) {
    this.resolverIface = new Interface(RESOLVER_ABI);
    this.escrowIface = new Interface(ESCROW_ABI);
  }

  /**
   * Deploy source escrow (Sepolia)
   */
  public deploySrc(
    chainId: number,
    orderHash: string,
    secretHash: string,
    makerAddress: string,
    takerAddress: string,
    tokenAddress: string,
    amount: bigint,
    safetyDeposit: bigint,
    timeLocks: bigint
  ): DeploySrcResult {
    const immutables: EscrowImmutables = {
      orderHash,
      secretHash,
      maker: BigInt(makerAddress),
      taker: BigInt(takerAddress),
      token: BigInt(tokenAddress),
      amount,
      safetyDeposit,
      timeLocks,
    };

    return {
      to: this.srcAddress,
      data: this.encodeDeploySrc(immutables),
      value: safetyDeposit,
    };
  }

  /**
   * Deploy destination escrow (Aptos equivalent)
   */
  public deployDst(
    immutables: EscrowImmutables,
    cancellationTimestamp: number
  ): DeployDstResult {
    return {
      to: this.dstAddress,
      data: this.encodeDeployDst(immutables, cancellationTimestamp),
      value: immutables.safetyDeposit,
    };
  }

  /**
   * Withdraw from escrow
   */
  public withdraw(
    side: "src" | "dst",
    escrowAddress: string,
    secret: string,
    immutables: EscrowImmutables
  ): WithdrawResult {
    const encoding = this.encodeWithdraw(escrowAddress, secret, immutables);
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: encoding,
    };
  }

  /**
   * Cancel escrow
   */
  public cancel(
    side: "src" | "dst",
    escrowAddress: string,
    immutables: EscrowImmutables
  ): CancelResult {
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: this.encodeCancel(escrowAddress, immutables),
    };
  }

  /**
   * Encode deploySrc function
   */
  private encodeDeploySrc(immutables: EscrowImmutables): string {
    const immutablesArray = [
      immutables.orderHash,
      immutables.secretHash,
      immutables.maker,
      immutables.taker,
      immutables.token,
      immutables.amount,
      immutables.safetyDeposit,
      immutables.timeLocks,
    ];

    return this.resolverIface.encodeFunctionData("createDstEscrow", [
      immutablesArray,
      Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    ]);
  }

  /**
   * Encode deployDst function
   */
  private encodeDeployDst(
    immutables: EscrowImmutables,
    cancellationTimestamp: number
  ): string {
    const immutablesArray = [
      immutables.orderHash,
      immutables.secretHash,
      immutables.maker,
      immutables.taker,
      immutables.token,
      immutables.amount,
      immutables.safetyDeposit,
      immutables.timeLocks,
    ];

    return this.resolverIface.encodeFunctionData("createDstEscrow", [
      immutablesArray,
      cancellationTimestamp,
    ]);
  }

  /**
   * Encode withdraw function
   */
  private encodeWithdraw(
    escrowAddress: string,
    secret: string,
    immutables: EscrowImmutables
  ): string {
    const immutablesArray = [
      immutables.orderHash,
      immutables.secretHash,
      immutables.maker,
      immutables.taker,
      immutables.token,
      immutables.amount,
      immutables.safetyDeposit,
      immutables.timeLocks,
    ];

    return this.resolverIface.encodeFunctionData("withdraw", [
      escrowAddress,
      secret,
      immutablesArray,
    ]);
  }

  /**
   * Encode cancel function
   */
  private encodeCancel(
    escrowAddress: string,
    immutables: EscrowImmutables
  ): string {
    const immutablesArray = [
      immutables.orderHash,
      immutables.secretHash,
      immutables.maker,
      immutables.taker,
      immutables.token,
      immutables.amount,
      immutables.safetyDeposit,
      immutables.timeLocks,
    ];

    return this.resolverIface.encodeFunctionData("cancel", [
      escrowAddress,
      immutablesArray,
    ]);
  }

  /**
   * Get source resolver address
   */
  public getSrcAddress(): string {
    return this.srcAddress;
  }

  /**
   * Get destination factory address
   */
  public getDstAddress(): string {
    return this.dstAddress;
  }

  /**
   * Get resolver interface
   */
  public getResolverInterface(): Interface {
    return this.resolverIface;
  }

  /**
   * Get escrow interface
   */
  public getEscrowInterface(): Interface {
    return this.escrowIface;
  }
}
