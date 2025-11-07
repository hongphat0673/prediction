# Quick Start Guide - Prediction dApp

Get your Prediction Pool dApp running in 5 minutes!

## Prerequisites
- Node.js v18+
- MetaMask wallet
- Some ETH on Base Sepolia (get from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

## Step 1: Setup (2 minutes)

```bash
# Clone and install
git clone <your-repo>
cd prediction
npm install

# Setup environment
cp .env.example .env
```

Edit `.env` with your private key:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
BASESCAN_API_KEY=your_api_key_optional
```

## Step 2: Deploy Contract (1 minute)

```bash
# Compile
npm run compile

# Deploy to Base Sepolia testnet
npm run deploy:base-sepolia
```

**Save the contract address from output!**

## Step 3: Setup Frontend (2 minutes)

```bash
# Install frontend dependencies
cd frontend
npm install

# Configure
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=get_from_https://cloud.walletconnect.com
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

Edit `frontend/src/contractConfig.js`:
```javascript
export const CONTRACT_ADDRESS = "0xYourContractAddress"
```

Edit `frontend/src/wagmi.js`:
```javascript
projectId: 'your_walletconnect_project_id'
```

## Step 4: Run! (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000

## Quick Test

1. Connect wallet (switch to Base Sepolia network)
2. Go to "My Sessions" → Create New Session
3. Fill in details and create
4. Go to "All Sessions" → Place prediction
5. You're running! 🎉

## Common Issues

**No ETH?** Get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

**Wrong network?** Switch to Base Sepolia in MetaMask:
- Network Name: Base Sepolia
- RPC: https://sepolia.base.org
- Chain ID: 84532

**Need USDC?** Use this address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Read [README.md](./README.md) for full documentation
- Run tests: `npm test`

**Happy Building! 🚀**
