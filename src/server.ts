import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { RateLimiterMemory } from "rate-limiter-flexible";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

// Import routes
import quoteRoutes from "./routes/quote";
import orderRoutes from "./routes/order";
import healthRoutes from "./routes/health";
import configRoutes from "./routes/config";
import relayerRoutes from "./routes/relayer.js";
import resolverRoutes from "./routes/resolver.js";

// Import middleware
import { errorHandler } from "./utils/errorHandler";
import { requestLogger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000") / 1000,
});

const rateLimiterMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const key = req.ip || "unknown";
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));
app.use(requestLogger);
app.use(rateLimiterMiddleware);

// API Documentation
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Cross-Swaps API",
    version: "1.0.0",
    description:
      "Cross-chain swap protocol extending 1inch to unsupported chains including Aptos",
    contact: {
      name: "Cross-Swaps Team",
      email: "support@cross-swaps.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: "Development server",
    },
  ],
  components: {
    schemas: {
      SwapQuote: {
        type: "object",
        properties: {
          srcChainId: { type: "number", example: 11155111 },
          dstChainId: { type: "number", example: 999999 },
          srcTokenAddress: {
            type: "string",
            example: "0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f",
          },
          dstTokenAddress: {
            type: "string",
            example:
              "0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::my_token::SimpleToken",
          },
          srcAmount: { type: "string", example: "1000000000000000000" },
          dstAmount: { type: "string", example: "945249000000000000" },
          exchangeRate: { type: "number", example: 0.945249 },
          estimatedGas: { type: "string", example: "710000" },
          gasPrice: { type: "string", example: "20000000000" },
          fees: {
            type: "object",
            properties: {
              protocolFee: { type: "string", example: "0" },
              gasFee: { type: "string", example: "14200000000000000" },
              crossChainFee: { type: "string", example: "1000000000000000000" },
            },
          },
          route: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                exchange: { type: "string", example: "Cross-Swaps" },
                chainId: { type: "number" },
                estimatedGas: { type: "string" },
              },
            },
          },
          timestamp: { type: "string", format: "date-time" },
          validUntil: { type: "string", format: "date-time" },
          quoteId: { type: "string", example: "quote_1754148151310_2f9ox7tn8" },
        },
      },
      HealthCheck: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "healthy" },
              timestamp: { type: "string", format: "date-time" },
              services: {
                type: "object",
                properties: {
                  database: { type: "boolean", example: true },
                  rpc: { type: "boolean", example: true },
                  contracts: { type: "boolean", example: true },
                },
              },
              version: { type: "string", example: "1.0.0" },
            },
          },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
          error: { type: "string" },
          message: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health check",
        description: "Check the health status of the API and its services",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthCheck",
                },
              },
            },
          },
          "500": {
            description: "Service is unhealthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/quote": {
      get: {
        summary: "Get swap quote",
        description:
          "Get a quote for a cross-chain swap between supported chains",
        tags: ["Quote"],
        parameters: [
          {
            name: "srcChainId",
            in: "query",
            required: true,
            schema: { type: "number" },
            description: "Source chain ID (e.g., 11155111 for Sepolia)",
          },
          {
            name: "dstChainId",
            in: "query",
            required: true,
            schema: { type: "number" },
            description: "Destination chain ID (e.g., 999999 for Aptos)",
          },
          {
            name: "srcTokenAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Source token address",
          },
          {
            name: "dstTokenAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Destination token address",
          },
          {
            name: "amount",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Amount to swap (in wei)",
          },
          {
            name: "walletAddress",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "User wallet address",
          },
        ],
        responses: {
          "200": {
            description: "Quote generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SwapQuote" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "404": {
            description: "Chain or token not supported",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/relayer/getQuote": {
      get: {
        summary: "Get relayer quote",
        description:
          "Get a quote from the relayer service for cross-chain swaps",
        tags: ["Relayer"],
        parameters: [
          {
            name: "srcChainId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Source chain ID",
          },
          {
            name: "dstChainId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Destination chain ID",
          },
          {
            name: "srcTokenAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Source token address",
          },
          {
            name: "dstTokenAddress",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Destination token address",
          },
          {
            name: "amount",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Amount to swap",
          },
        ],
        responses: {
          "200": {
            description: "Relayer quote generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    srcChainId: { type: "string" },
                    dstChainId: { type: "string" },
                    srcTokenAddress: { type: "string" },
                    dstTokenAddress: { type: "string" },
                    srcAmount: { type: "string" },
                    dstAmount: { type: "string" },
                    exchangeRate: { type: "number" },
                    estimatedGas: { type: "string" },
                    gasPrice: { type: "string" },
                    fees: {
                      type: "object",
                      properties: {
                        protocolFee: { type: "string" },
                        gasFee: { type: "string" },
                      },
                    },
                    route: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          from: { type: "string" },
                          to: { type: "string" },
                          exchange: { type: "string" },
                        },
                      },
                    },
                    timestamp: { type: "string", format: "date-time" },
                    validUntil: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing required parameters",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    required: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/resolver/orders": {
      get: {
        summary: "Get resolver orders",
        description: "Get all orders for a specific resolver address",
        tags: ["Resolver"],
        parameters: [
          {
            name: "address",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Resolver's wallet address",
          },
        ],
        responses: {
          "200": {
            description: "Resolver orders retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get resolver orders" },
                    balance: { type: "string", example: "0.361" },
                    currentBlock: { type: "string", example: "8897445" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid address",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/resolver/execute": {
      post: {
        summary: "Execute order through resolver",
        description: "Execute an order through the resolver contract",
        tags: ["Resolver"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderId", "signature"],
                properties: {
                  orderId: {
                    type: "string",
                    description: "Order ID to execute",
                  },
                  signature: {
                    type: "string",
                    description: "Transaction signature",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Order executed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Execute order through resolver",
                    },
                    gasEstimate: { type: "string", example: "210000" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "404": {
            description: "Order not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/order": {
      post: {
        summary: "Create new order",
        description: "Create a new cross-chain swap order",
        tags: ["Order"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quoteId", "maker"],
                properties: {
                  quoteId: {
                    type: "string",
                    description: "Quote ID from the quote endpoint",
                  },
                  maker: {
                    type: "string",
                    description: "Maker's wallet address",
                  },
                  taker: {
                    type: "string",
                    description: "Taker's wallet address (optional)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        orderId: { type: "string" },
                        status: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/config": {
      get: {
        summary: "Get configuration",
        description:
          "Get the current API configuration including supported chains and tokens",
        tags: ["Config"],
        responses: {
          "200": {
            description: "Configuration retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        supportedChains: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              chainId: { type: "number" },
                              name: { type: "string" },
                              rpcUrl: { type: "string" },
                              explorerUrl: { type: "string" },
                            },
                          },
                        },
                        supportedTokens: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              address: { type: "string" },
                              symbol: { type: "string" },
                              name: { type: "string" },
                              decimals: { type: "number" },
                              chainId: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Routes
app.use("/api/v1/quote", quoteRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/config", configRoutes);
app.use("/api/v1/relayer", relayerRoutes);
app.use("/api/v1/resolver", resolverRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Cross-Swaps API - Extended Cross-Chain Swap Protocol",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      quote: "/api/v1/quote",
      order: "/api/v1/order",
      config: "/api/v1/config",
      relayer: "/api/v1/relayer",
      resolver: "/api/v1/resolver",
      docs: "/api-docs",
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Cross-Swaps API server running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/api/v1/health`);
  console.log(`💱 Quote API: http://localhost:${port}/api/v1/quote`);
  console.log(`📋 Order API: http://localhost:${port}/api/v1/order`);
  console.log(`🔧 Relayer API: http://localhost:${port}/api/v1/relayer`);
  console.log(`⚙️  Resolver API: http://localhost:${port}/api/v1/resolver`);
});

export default app;
