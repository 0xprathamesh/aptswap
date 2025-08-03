import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/errorHandler";
import {
  CROSS_CHAIN_CONFIG,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
} from "../utils/config";

const router = Router();

/**
 * @swagger
 * /config:
 *   get:
 *     summary: Get cross-chain configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     supportedChains:
 *                       type: array
 *                       items:
 *                         type: object
 *                     supportedTokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                     defaultGasLimit:
 *                       type: number
 *                     defaultGasPrice:
 *                       type: string
 *                     maxSlippage:
 *                       type: number
 *                     minAmount:
 *                       type: string
 *                     maxAmount:
 *                       type: string
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: CROSS_CHAIN_CONFIG,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @swagger
 * /config/chains:
 *   get:
 *     summary: Get supported chains
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: List of supported chains
 */
router.get(
  "/chains",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: SUPPORTED_CHAINS,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @swagger
 * /config/tokens:
 *   get:
 *     summary: Get supported tokens
 *     tags: [Configuration]
 *     parameters:
 *       - in: query
 *         name: chainId
 *         schema:
 *           type: number
 *         description: Filter tokens by chain ID
 *     responses:
 *       200:
 *         description: List of supported tokens
 */
router.get(
  "/tokens",
  asyncHandler(async (req: Request, res: Response) => {
    const { chainId } = req.query;

    let tokens = SUPPORTED_TOKENS;

    if (chainId) {
      const chainIdNum = parseInt(chainId as string);
      tokens = SUPPORTED_TOKENS.filter((token) => token.chainId === chainIdNum);
    }

    res.json({
      success: true,
      data: tokens,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @swagger
 * /config/chains/{chainId}:
 *   get:
 *     summary: Get chain configuration by ID
 *     tags: [Configuration]
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: number
 *         description: Chain ID
 *     responses:
 *       200:
 *         description: Chain configuration
 *       404:
 *         description: Chain not found
 */
router.get(
  "/chains/:chainId",
  asyncHandler(async (req: Request, res: Response) => {
    const chainIdParam = req.params.chainId;
    if (!chainIdParam) {
      return res.status(400).json({
        success: false,
        error: "Chain ID is required",
        timestamp: new Date().toISOString(),
      });
    }

    const chainId = parseInt(chainIdParam);
    const chain = SUPPORTED_CHAINS.find((c) => c.chainId === chainId);

    if (!chain) {
      return res.status(404).json({
        success: false,
        error: "Chain not found",
        message: `Chain with ID ${chainId} is not supported`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: chain,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
