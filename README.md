# Cross-Swaps Protocol

A cross-chain swap protocol that extends 1inch functionality to unsupported chains, enabling seamless token swaps between EVM chains and Aptos blockchain.

## 🚀 Features

- **Cross-Chain Swaps**: Swap tokens between multiple EVM chains and Aptos
- **1inch Integration**: Leverages 1inch Cross-Chain SDK for optimal routing
- **Atomic Swaps**: Secure HTLC-based atomic swap mechanism
- **Multi-Chain Support**: Ethereum, Arbitrum, Base, Polygon, BSC, Optimism
- **RESTful API**: Complete API for quote generation and order management
- **Real-time Monitoring**: Order tracking and status updates
- **Security First**: Comprehensive error handling and validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EVM Chains    │    │   Cross-Swaps   │    │   Aptos Chain   │
│                 │    │     Protocol    │    │                 │
│ • Ethereum      │◄──►│ • API Server    │◄──►│ • Move Contracts│
│ • Arbitrum      │    │ • Smart         │    │ • Atomic Swaps  │
│ • Base          │    │   Contracts     │    │ • Token Bridge  │
│ • Polygon       │    │ • Order Manager │    │                 │
│ • BSC           │    │ • Quote Engine  │    │                 │
│ • Optimism      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Foundry (for smart contract development)
- Git

## 🛠️ Installation
 **Install dependencies**

   ```bash
   npm install
   ```

 **Install Foundry**

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

 **Install contract dependencies**

   ```bash
   forge install
   ```

 **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# 1inch API Configuration
INCH_API_KEY=your_1inch_api_key_here
INCH_API_URL=https://api.1inch.dev/fusion-plus

# RPC Endpoints
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io

# Aptos Configuration
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
APTOS_PRIVATE_KEY=your_aptos_private_key
APTOS_ADDRESS=your_aptos_address

# Wallet Configuration
WALLET_PRIVATE_KEY=your_ethereum_private_key
WALLET_ADDRESS=your_ethereum_address
```

## 🚀 Quick Start

### Development Mode

1. **Start the API server**

   ```bash
   npm start
   ```

2. **Access the API**
   - API Base URL: `http://localhost:3000`
   - Documentation: `http://localhost:3000/api-docs`
   - Health Check: `http://localhost:3000/api/v1/health`

### Production Mode

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📚 API Documentation

### Core Endpoints

#### Health Check

```bash
GET /api/v1/health
```

#### Configuration

```bash
GET /api/v1/config
GET /api/v1/config/chains
GET /api/v1/config/tokens?chainId=1
```

#### Quote Generation

```bash
GET /api/v1/quote?srcChainId=1&dstChainId=42161&srcTokenAddress=0x...&dstTokenAddress=0x...&amount=1000000
```

#### Order Management

```bash
POST /api/v1/order
GET /api/v1/order/{orderId}
POST /api/v1/order/{orderId}/execute
POST /api/v1/order/{orderId}/cancel
```

### Example Usage

#### Get a Quote

```bash
curl "http://localhost:3000/api/v1/quote?srcChainId=1&dstChainId=42161&srcTokenAddress=0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8&dstTokenAddress=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&amount=1000000"
```

#### Create an Order

```bash
curl -X POST "http://localhost:3000/api/v1/order" \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "quote_123",
    "maker": "0x1234567890123456789012345678901234567890",
    "srcChainId": 1,
    "dstChainId": 42161,
    "srcTokenAddress": "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8",
    "dstTokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "srcAmount": "1000000",
    "dstAmount": "950000"
  }'
```

## 🧪 Testing

### Quick Test Setup

The project includes comprehensive cross-chain swap tests. Follow these steps to run the tests:

#### Prerequisites for Testing

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set up Environment Variables**

   ```bash
   cp env.example .env
   ```

3. **Configure Test Environment**
   Edit `.env` file with your test accounts:

   ```env
   # Test Account Configuration
   USER_SEPOLIA_PRIVATE_KEY=your_user_sepolia_private_key_here
   USER_APTOS_PRIVATE_KEY=your_user_aptos_private_key_here
   LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY=your_provider_sepolia_private_key_here
   LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY=your_provider_aptos_private_key_here

   # RPC Endpoints
   APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
   ```

#### Running Cross-Chain Swap Tests

##### Test 1: Aptos to Sepolia Swap (`test-aptos-to-sepolia-swap.js`)

This test demonstrates a complete cross-chain swap from Aptos to Sepolia:

```bash
# Run the Aptos to Sepolia swap test
node tests/test-aptos-to-sepolia-swap.js
```

**What this test does:**

- User locks APT tokens on Aptos
- Provider locks mUSDC tokens on Sepolia
- Cross-chain atomic swap execution
- Secret revelation and fund claiming

**Expected Output:**

```
=== APTOS TO ETHEREUM CROSS-CHAIN SWAP TEST ===
Aptos → Sepolia Transfer (User gets mUSDC, Provider gets APT)
DIRECT BLOCKCHAIN INTERACTION - NO API

Account Details:
   • User Sepolia: 0x...
   • User Aptos: 0x...
   • Provider Sepolia: 0x...
   • Provider Aptos: 0x...

Step 1: User announcing order on Aptos (locks APT)...
Step 2: User funding destination escrow on Aptos (locks APT)...
Step 3: Initializing swap ledger on Aptos...
Step 4: Provider creating order on Sepolia (locks mUSDC)...
Step 5: User claiming mUSDC on Sepolia (gets the swap result)...
Step 6: Provider claiming APT on Aptos (gets User's APT)...

APTOS TO ETHEREUM CROSS-CHAIN SWAP COMPLETED SUCCESSFULLY
```

##### Test 2: Final Cross-Chain Test (`final-cross-chain-test.js`)

This test demonstrates the complete cross-chain swap protocol:

```bash
# Run the final cross-chain test
node tests/final-cross-chain-test.js
```

**What this test does:**

- Complete HTLC-based atomic swap
- Sepolia ↔ Aptos bidirectional flow
- Order management and tracking
- Dynamic order ID handling

**Expected Output:**

```
=== FINAL CROSS-CHAIN SWAP TEST ===
Starting FINAL cross-chain swap test...
Amount: 10,000 CST tokens
Min Amount: 9,500 CST tokens

Step 1: User creates order on Sepolia (source chain)...
Step 1.5: Deploying escrow on Sepolia...
Step 2: Initializing swap ledger on Aptos...
Step 3: Announcing order on Aptos...
Step 4: Funding destination escrow on Aptos...
Step 5: User claims funds on Aptos...
Step 6: Resolver withdraws funds from Sepolia...

FINAL CROSS-CHAIN SWAP COMPLETED SUCCESSFULLY
```

#### Test Configuration

**Contract Addresses (Testnet):**

- **Sepolia Contracts:**
  - Resolver: `0x57127879803e313659c1e0dF410ec73ddf5A11F7`
  - Factory: `0x219F228e8e46Eb384FD299F0784e5CA8c67B4480`
  - Mock USDC: `0x4A2C3824C1c1B7fC05381893d85FB085d38Acc0f`

- **Aptos Contracts (Testnet):**
  - Account: `0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e`
  - Swap Ledger: `0xb7be566097698963883013d9454bcfb6275670040f437ed178a76c42154e9b15`
  - Swap V3 Module: `0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e::swap_v3`

#### Troubleshooting

**Common Issues:**

1. **RPC Connection Errors:**

   ```bash
   # Check RPC endpoints in .env
   # Ensure you have sufficient testnet tokens
   ```

2. **Private Key Issues:**

   ```bash
   # Verify private keys are correctly set in .env
   # Ensure accounts have sufficient balance
   ```

3. **Contract Deployment:**
   ```bash
   # If contracts are not deployed, run deployment scripts first
   npm run deploy:contracts
   ```

#### Test Results

Test results are saved to JSON files for analysis:

- `final-cross-chain-test-results.json` - Complete test results
- Transaction hashes and order IDs for verification

### Other Tests

```bash
# Unit tests
npm test

# Smart contract tests
forge test

# Integration tests
npm run test:integration

# Test coverage
npm run test:coverage
```

## 🔧 Development

### Adding New Chains

1. **Update configuration** in `src/utils/config.ts`
2. **Add RPC endpoint** to environment variables
3. **Deploy contracts** to the new chain
4. **Update documentation**

### Adding New Tokens

1. **Add token info** to `SUPPORTED_TOKENS` array
2. **Verify token contract** on the target chain
3. **Test token integration**

## 🔒 Security

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited
- **Error Handling**: Comprehensive error handling and logging
- **HTTPS**: Production endpoints use HTTPS
- **Audit**: Smart contracts are audited before deployment

## 📈 Monitoring

- **Health Checks**: `/api/v1/health`
- **Logging**: Structured logging with different levels
- **Metrics**: Request/response metrics
- **Alerts**: Error monitoring and alerting

---

**Built with ❤️ by the Cross-Swaps Team**
