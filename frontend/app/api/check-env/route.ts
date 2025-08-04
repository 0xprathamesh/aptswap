import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      sepoliaPrivateKey: !!process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY,
      aptosPrivateKey: !!process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY,
      sepoliaKeyLength: process.env.LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY?.length || 0,
      aptosKeyLength: process.env.LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY?.length || 0,
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: envCheck.sepoliaPrivateKey && envCheck.aptosPrivateKey 
        ? "Environment variables are set correctly" 
        : "Missing environment variables",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check environment", details: error.message },
      { status: 500 }
    );
  }
} 