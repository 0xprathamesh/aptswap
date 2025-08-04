# Frontend Setup Guide

## Environment Variables Setup

To run the cross-chain swap frontend, you need to set up environment variables for the liquidity provider accounts.

### 1. Create Environment File

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
touch .env.local
```

### 2. Add Required Variables

Add the following to your `.env.local` file:

```env
# Liquidity Provider Private Keys (REQUIRED)
LIQUIDITY_PROVIDER_SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here
LIQUIDITY_PROVIDER_APTOS_PRIVATE_KEY=your_aptos_private_key_here

# RPC Endpoints
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/cb77ec7104e04b26a8bba8520e720054
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```

### 3. Get Private Keys

You need two private keys:

1. **Sepolia Private Key**: A wallet with ETH on Sepolia testnet
2. **Aptos Private Key**: A wallet with APT on Aptos testnet

### 4. Restart Development Server

After setting up the environment variables:

```bash
npm run dev
```

### 5. Test Setup

1. Connect MetaMask to Sepolia
2. Connect Petra wallet to Aptos testnet
3. Click "Check Env" button to verify setup
4. Enter amount and try the swap

### Troubleshooting

- If you see "Missing environment variables" error, check your `.env.local` file
- Make sure private keys are correct and have sufficient balance
- Check console for detailed error messages 