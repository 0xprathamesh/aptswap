# ETH ↔ APTOS Atomic Swap Frontend

A Next.js TypeScript frontend for cross-chain atomic swaps between Ethereum (Sepolia) and Aptos (Devnet).

## Features

- **Wallet Connection**: MetaMask integration with ConnectKit
- **Live Price Quotes**: Real-time ETH/APT prices from CoinGecko
- **Minimal UI**: Clean, functional interface with Tailwind CSS
- **Toast Notifications**: Real-time transaction status updates
- **Resolver Integration**: Complete swap flow with resolver automation

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask wallet with Sepolia testnet configured
- Some Sepolia ETH for testing

### Installation

```bash
cd frontend
npm install
```

### Running the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### 1. Connect Wallet

- Click "Connect Wallet" in the header
- Approve MetaMask connection
- Ensure you're on Sepolia testnet

### 2. Enter Swap Details

- Enter the amount of ETH you want to swap
- The APTOS amount will be calculated automatically based on live prices
- Click "Get Quote" to proceed

### 3. Enter Receiver Address

- Enter the Aptos address where you want to receive APT tokens
- Format: `0x` followed by 64 hex characters

### 4. Execute Swap

- Click "Swap" to create the ETH side of the swap
- Approve the transaction in MetaMask
- Wait for confirmation

### 5. Complete Aptos Side (Resolver)

After the ETH swap is created, run the resolver script to complete the Aptos side:

```bash
# From the frontend directory
cd scripts
node run-resolver.js <swapId> <secret> <aptosAmount>
```

Example:

```bash
node run-resolver.js swap_1753635243715_ubdvoy42s 0x29261ad86f7db747b0e711a4af706ba86aa07a1b2ae0734fe880680843b1b59a 1579988
```

The swap data is stored in localStorage and can be retrieved from the browser console.

## Architecture

### Frontend Components

- `SwapCard`: Main swap interface
- `TokenInput`: Token selection and amount input
- `Header`: Wallet connection and navigation

### Resolver Script

- `resolver.ts`: Handles Aptos side completion
- `run-resolver.js`: CLI script to execute resolver

### Key Features

- **Real-time Quotes**: Prices update every 30 seconds
- **Hash Generation**: Proper Keccak256/SHA3-256 hashing for both chains
- **Error Handling**: Comprehensive error messages and validation
- **Transaction Tracking**: Toast notifications for all transaction states

## Contract Addresses

### Ethereum (Sepolia)

- Contract: `0xBD64245289114b11B35C4fF35605a525a7dF1f53`
- Resolver: `0xEAde2298C7d1b5C748103da66D6Dd9Cf204E2AD2`

### Aptos (Devnet)

- Contract: `0xfc1515fc8a2c00692b2117e8594771923e823985f23ea1bbb0278ae95f742dba`
- Resolver: `0xdf1a31fd439c81d59f727c737f84824138582e1af58c43ee147defdf223b736e`

## Swap Flow

1. **User creates ETH swap** → ETH locked on Ethereum
2. **Resolver creates Aptos swap** → APTOS locked on Aptos
3. **User claims APTOS** → APTOS released to user
4. **Resolver claims ETH** → ETH released to resolver

## Troubleshooting

### Common Issues

- **Network Error**: Ensure MetaMask is on Sepolia testnet
- **Invalid Address**: Aptos addresses must be 64 hex characters after `0x`
- **Insufficient Balance**: Ensure you have enough Sepolia ETH
- **Resolver Authorization**: Run resolver script to complete Aptos side

### Debug Information

- Check browser console for detailed logs
- Transaction hashes are displayed in toast notifications
- Swap data is stored in localStorage for resolver use

## Development

### Adding New Features

- Components are in `/components`
- Resolver logic in `/scripts`
- Styling with Tailwind CSS
- State management with React hooks

### Testing

- Test on Sepolia testnet
- Use small amounts for initial testing
- Verify resolver completion before claiming

## Security Notes

- Private keys are hardcoded for testing only
- Production should use secure key management
- Always verify transaction details before signing
- Test thoroughly before mainnet deployment
