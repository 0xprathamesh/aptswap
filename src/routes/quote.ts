import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/errorHandler";
import { createError } from "../utils/errorHandler";
import { logger } from "../utils/logger";
import { SwapQuote } from "../types";
import {
  getChainConfig,
  getTokenInfo,
  isChainSupported,
  isTokenSupported,
} from "../utils/config";

const router = Router();

/**
 * @swagger
 * /quote:
 *   get:
 *     summary: Get swap quote
 *     tags: [Quote]
 *     parameters:
 *       - in: query
 *         name: srcChainId
 *         required: true
 *         schema:
 *           type: number
 *         description: Source chain ID
 *       - in: query
 *         name: dstChainId
 *         required: true
 *         schema:
 *           type: number
 *         description: Destination chain ID
 *       - in: query
 *         name: srcTokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Source token address
 *       - in: query
 *         name: dstTokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination token address
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: string
 *         description: Amount to swap
 *       - in: query
 *         name: walletAddress
 *         schema:
 *           type: string
 *         description: User wallet address
 *     responses:
 *       200:
 *         description: Swap quote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SwapQuote'
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Chain or token not supported
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
    } = req.query;

    // Validate required parameters
    if (
      !srcChainId ||
      !dstChainId ||
      !srcTokenAddress ||
      !dstTokenAddress ||
      !amount
    ) {
      throw createError("Missing required parameters", 400);
    }

    const srcChainIdNum = parseInt(srcChainId as string);
    const dstChainIdNum = parseInt(dstChainId as string);
    const amountStr = amount as string;

    // Validate chains
    if (!isChainSupported(srcChainIdNum)) {
      throw createError(`Source chain ${srcChainIdNum} is not supported`, 404);
    }

    if (!isChainSupported(dstChainIdNum)) {
      throw createError(
        `Destination chain ${dstChainIdNum} is not supported`,
        404
      );
    }

    // Validate tokens
    if (!isTokenSupported(srcTokenAddress as string, srcChainIdNum)) {
      throw createError(
        `Source token ${srcTokenAddress} is not supported on chain ${srcChainIdNum}`,
        404
      );
    }

    if (!isTokenSupported(dstTokenAddress as string, dstChainIdNum)) {
      throw createError(
        `Destination token ${dstTokenAddress} is not supported on chain ${dstChainIdNum}`,
        404
      );
    }

    // Validate amount
    const amountBigInt = BigInt(amountStr);
    if (amountBigInt <= 0n) {
      throw createError("Amount must be greater than 0", 400);
    }

    // Get token info
    const srcToken = getTokenInfo(srcTokenAddress as string, srcChainIdNum);
    const dstToken = getTokenInfo(dstTokenAddress as string, dstChainIdNum);

    if (!srcToken || !dstToken) {
      throw createError("Token information not found", 404);
    }

    // TODO: Implement actual quote calculation logic
    // For now, return a mock quote
    const mockQuote: SwapQuote = await generateMockQuote({
      srcChainId: srcChainIdNum,
      dstChainId: dstChainIdNum,
      srcTokenAddress: srcTokenAddress as string,
      dstTokenAddress: dstTokenAddress as string,
      srcAmount: amountStr,
      srcToken,
      dstToken,
      walletAddress: walletAddress as string,
    });

    logger.info("Quote generated", {
      srcChainId: srcChainIdNum,
      dstChainId: dstChainIdNum,
      srcToken: srcToken.symbol,
      dstToken: dstToken.symbol,
      amount: amountStr,
      quoteId: mockQuote.quoteId,
    });

    res.json({
      success: true,
      data: mockQuote,
      timestamp: new Date().toISOString(),
    });
  })
);

interface QuoteParams {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcAmount: string;
  srcToken: any;
  dstToken: any;
  walletAddress?: string;
}

async function generateMockQuote(params: QuoteParams): Promise<SwapQuote> {
  const {
    srcChainId,
    dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    srcAmount,
    srcToken,
    dstToken,
  } = params;

  // Mock exchange rate (1:1 for same tokens, 0.95 for cross-chain)
  const baseRate = srcToken.symbol === dstToken.symbol ? 1.0 : 0.95;
  const slippage = 0.005; // 0.5%
  const exchangeRate = baseRate * (1 - slippage);

  // Calculate destination amount
  const srcAmountBigInt = BigInt(srcAmount);
  const dstAmountBigInt =
    (srcAmountBigInt * BigInt(Math.floor(exchangeRate * 1000000))) /
    BigInt(1000000);

  // Mock gas estimation
  const baseGas = 210000;
  const crossChainGas = srcChainId !== dstChainId ? 500000 : 0;
  const estimatedGas = (baseGas + crossChainGas).toString();

  // Mock gas price (20 gwei)
  const gasPrice = "20000000000";

  // Calculate fees
  const gasFee = (BigInt(estimatedGas) * BigInt(gasPrice)).toString();
  const protocolFee = "0"; // No protocol fee for now
  const crossChainFee = srcChainId !== dstChainId ? "1000000000000000000" : "0"; // 1 ETH for cross-chain

  // Generate quote ID
  const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate validity (30 seconds)
  const validUntil = new Date(Date.now() + 30000).toISOString();

  return {
    srcChainId,
    dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    srcAmount,
    dstAmount: dstAmountBigInt.toString(),
    exchangeRate,
    estimatedGas,
    gasPrice,
    fees: {
      protocolFee,
      gasFee,
      crossChainFee,
    },
    route: [
      {
        from: srcTokenAddress,
        to: dstTokenAddress,
        exchange: "Cross-Swaps",
        chainId: srcChainId,
        estimatedGas,
      },
    ],
    timestamp: new Date().toISOString(),
    validUntil,
    quoteId,
  };
}

export default router;
