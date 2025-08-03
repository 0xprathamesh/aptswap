import express from "express";
const router = express.Router();

router.get("/getQuote", (req, res) => {
  const { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount } =
    req.query;

  if (
    !srcChainId ||
    !dstChainId ||
    !srcTokenAddress ||
    !dstTokenAddress ||
    !amount
  ) {
    return res.status(400).json({
      error: "Missing required parameters",
      required: [
        "srcChainId",
        "dstChainId",
        "srcTokenAddress",
        "dstTokenAddress",
        "amount",
      ],
    });
  }

  const inputAmount = BigInt(amount as string);
  const EXCHANGE_RATE = 100; // Dynamic exchange rate for our tokens
  const outputAmount =
    (inputAmount * BigInt(Math.floor(EXCHANGE_RATE * 1000))) / BigInt(1000);

  const mockQuote = {
    srcChainId: srcChainId,
    dstChainId: dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    srcAmount: amount,
    dstAmount: outputAmount.toString(),
    exchangeRate: EXCHANGE_RATE,
    estimatedGas: "200000",
    gasPrice: "20000000000",
    fees: {
      protocolFee: "0",
      gasFee: "4000000000000000",
    },
    route: [
      {
        from: srcTokenAddress,
        to: dstTokenAddress,
        exchange: "CrossChainSwap",
      },
    ],
    timestamp: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30000).toISOString(),
  };

  return res.json(mockQuote);
});

export default router;
