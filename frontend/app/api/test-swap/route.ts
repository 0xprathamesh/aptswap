import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { amount, userAddress, aptosAddress } = await request.json();

    if (!amount || !userAddress || !aptosAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Simulate swap process
    const ethAmount = parseFloat(amount);
    const aptAmount = ethAmount * 1000; // 0.001 ETH = 1 APT

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      swapId: `test_swap_${Date.now()}`,
      secret: "0x746573745f7365637265745f70617373776f7264",
      secretHash:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      transactions: {
        sepoliaEscrow:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        aptosInit:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        aptosAnnounce:
          "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        aptosFund:
          "0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
        announceOrderId: 1,
        fundOrderId: 2,
      },
      amounts: {
        ethAmount: amount,
        aptAmount: aptAmount,
      },
      message: "Test swap completed successfully! This is a simulation.",
    });
  } catch (error) {
    console.error("Test swap API error:", error);
    return NextResponse.json(
      { error: "Test swap failed", details: error.message },
      { status: 500 }
    );
  }
}
