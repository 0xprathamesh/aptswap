import { ethers, JsonRpcProvider, Interface } from "ethers";

// Contract addresses from our working test
const SEPOLIA_CONTRACTS = {
  factory: "0x219F228e8e46Eb384FD299F0784e5CA8c67B4480",
  resolver: "0x57127879803e313659c1e0dF410ec73ddf5A11F7",
};

// ABI for EscrowFactory contract
const ESCROW_FACTORY_ABI = [
  "function ESCROW_SRC_IMPLEMENTATION() external view returns (address)",
  "function ESCROW_DST_IMPLEMENTATION() external view returns (address)",
  "function createDstEscrow((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256), uint256) external payable",
  "event SrcEscrowCreated((bytes32,bytes32,uint256,uint256,uint256,uint256,uint256,uint256), (uint256,uint256,uint256,uint256))",
];

// Types for our escrow data
export interface EscrowImmutables {
  orderHash: string;
  hashLock: string;
  maker: string;
  taker: string;
  token: string;
  amount: bigint;
  safetyDeposit: bigint;
  timeLocks: bigint;
}

export interface EscrowComplement {
  maker: bigint;
  amount: bigint;
  token: bigint;
  safetyDeposit: bigint;
}

export interface EscrowDeployResult {
  immutables: EscrowImmutables;
  complement: EscrowComplement;
}

export class EscrowFactory {
  private iface: Interface;

  constructor(
    private readonly provider: JsonRpcProvider,
    private readonly address: string = SEPOLIA_CONTRACTS.factory
  ) {
    this.iface = new Interface(ESCROW_FACTORY_ABI);
  }

  /**
   * Get the source escrow implementation address
   */
  public async getSourceImpl(): Promise<string> {
    const data = await this.provider.call({
      to: this.address,
      data: this.iface.encodeFunctionData("ESCROW_SRC_IMPLEMENTATION"),
    });

    const result = this.iface.decodeFunctionResult(
      "ESCROW_SRC_IMPLEMENTATION",
      data
    );
    return result[0];
  }

  /**
   * Get the destination escrow implementation address
   */
  public async getDestinationImpl(): Promise<string> {
    const data = await this.provider.call({
      to: this.address,
      data: this.iface.encodeFunctionData("ESCROW_DST_IMPLEMENTATION"),
    });

    const result = this.iface.decodeFunctionResult(
      "ESCROW_DST_IMPLEMENTATION",
      data
    );
    return result[0];
  }

  /**
   * Get source escrow deployment event from a specific block
   */
  public async getSrcDeployEvent(
    blockHash: string
  ): Promise<EscrowDeployResult> {
    const event = this.iface.getEvent("SrcEscrowCreated");
    if (!event) {
      throw new Error("SrcEscrowCreated event not found in ABI");
    }

    const logs = await this.provider.getLogs({
      blockHash,
      address: this.address,
      topics: [event.topicHash],
    });

    if (logs.length === 0) {
      throw new Error("No SrcEscrowCreated events found in block");
    }

    const [data] = logs.map((l) =>
      this.iface.decodeEventLog(event, l.data, l.topics)
    );

    if (!data || !data[0] || !data[1]) {
      throw new Error("Invalid event data structure");
    }

    const immutables = data[0];
    const complement = data[1];

    return {
      immutables: {
        orderHash: immutables[0],
        hashLock: immutables[1],
        maker: immutables[2].toString(),
        taker: immutables[3].toString(),
        token: immutables[4].toString(),
        amount: immutables[5],
        safetyDeposit: immutables[6],
        timeLocks: immutables[7],
      },
      complement: {
        maker: complement[0],
        amount: complement[1],
        token: complement[2],
        safetyDeposit: complement[3],
      },
    };
  }

  /**
   * Create destination escrow transaction
   */
  public async createDstEscrow(
    secretHash: string,
    makerAddress: string,
    takerAddress: string,
    tokenAddress: string,
    amount: bigint,
    safetyDeposit: bigint,
    timeLocks: bigint
  ): Promise<{
    to: string;
    data: string;
    value: bigint;
  }> {
    const immutables = [
      secretHash,
      secretHash, // orderHash same as secretHash for simplicity
      BigInt(makerAddress),
      BigInt(takerAddress),
      BigInt(tokenAddress),
      amount,
      safetyDeposit,
      timeLocks,
    ];

    const cancellationTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    return {
      to: this.address,
      data: this.iface.encodeFunctionData("createDstEscrow", [
        immutables,
        cancellationTimestamp,
      ]),
      value: safetyDeposit + amount,
    };
  }

  /**
   * Get contract address
   */
  public getAddress(): string {
    return this.address;
  }

  /**
   * Get contract interface
   */
  public getInterface(): Interface {
    return this.iface;
  }
}
