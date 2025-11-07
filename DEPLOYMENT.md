# Prediction dApp - Complete Deployment Guide

This guide provides step-by-step instructions to deploy and run the Prediction Pool dApp on Base Network.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Configuration](#frontend-configuration)
5. [Running Locally](#running-locally)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Comes with Node.js
- **Git**: For version control
- **MetaMask** or another Web3 wallet browser extension

### Required Accounts & Keys
1. **Wallet with ETH on Base Network**
   - Base Sepolia Testnet: Get free ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - Base Mainnet: Purchase ETH and bridge to Base

2. **USDC Tokens**
   - Base Sepolia: Use faucet or mint test USDC at `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Base Mainnet: Bridge USDC to Base at `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

3. **BaseScan API Key** (Optional, for contract verification)
   - Sign up at [BaseScan](https://basescan.org/)
   - Navigate to API-KEYs section
   - Generate new API key

4. **WalletConnect Project ID** (for frontend)
   - Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create new project
   - Copy Project ID

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd prediction
```

### 2. Install Smart Contract Dependencies
```bash
npm install
```

Expected packages:
- `hardhat`: Ethereum development environment
- `@openzeppelin/contracts`: Secure smart contract library
- `@nomicfoundation/hardhat-toolbox`: Hardhat plugins bundle
- `dotenv`: Environment variable management

### 3. Configure Environment Variables

Create `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Private key from your wallet (without 0x prefix)
# ⚠️ NEVER commit this file or share your private key!
PRIVATE_KEY=your_private_key_here

# Base Network RPC URLs (use defaults or your own)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# BaseScan API Key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# USDC Contract Address (automatically set in deploy script)
# Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
# Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

**⚠️ Security Warning**: Never commit `.env` file to git. It contains your private key!

### 4. Get Your Private Key

**From MetaMask:**
1. Click on the three dots menu → Account details
2. Click "Show private key"
3. Enter your password
4. Copy private key (remove the `0x` prefix)
5. Paste into `.env` file

---

## Smart Contract Deployment

### 1. Compile Contracts
```bash
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

### 2. Run Tests (Optional but Recommended)
```bash
npm test
```

All tests should pass:
```
  PredictionPool
    Deployment
      ✓ Should set the correct USDC token address
      ✓ Should set the correct owner
      ✓ Should initialize with correct platform fee
    Session Creation
      ✓ Should create a session with valid parameters
      ...
  70 passing (3s)
```

### 3. Deploy to Base Sepolia Testnet

```bash
npm run deploy:base-sepolia
```

**Expected Output:**
```
Deploying PredictionPool contract to baseSepolia
Using USDC address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Deploying contract...
PredictionPool deployed to: 0xYourContractAddress...
Deployment transaction: 0xTransactionHash...
Waiting for block confirmations...
Verifying contract on BaseScan...
Contract verified successfully

=== Deployment Summary ===
{
  "network": "baseSepolia",
  "contractAddress": "0xYourContractAddress...",
  "usdcAddress": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "deploymentTime": "2024-01-XX...",
  "deployer": "0xYourAddress..."
}
==========================

✅ Deployment info saved to: deployments/baseSepolia-timestamp.json
✅ Latest deployment saved to: deployments/baseSepolia-latest.json

🎉 Deployment completed successfully!
📋 Contract Address: 0xYourContractAddress...
🔗 View on BaseScan: https://sepolia.basescan.org/address/0xYourContractAddress...
```

**Important:** Save the contract address! You'll need it for frontend configuration.

### 4. Deploy to Base Mainnet (Production)

```bash
npm run deploy:base
```

**⚠️ Important Notes:**
- Ensure you have enough ETH for gas fees (~0.01 ETH recommended)
- Double-check your private key is for the correct wallet
- Deployment is irreversible - test thoroughly on testnet first!

---

## Frontend Configuration

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Frontend Dependencies
```bash
npm install
```

Expected packages:
- `react` & `react-dom`: UI framework
- `@rainbow-me/rainbowkit`: Wallet connection UI
- `wagmi`: React hooks for Ethereum
- `ethers`: Ethereum library
- `vite`: Build tool

### 3. Configure Environment Variables

Create `frontend/.env`:
```bash
cp .env.example .env
```

Edit `frontend/.env`:
```env
# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract Address from deployment
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 4. Update Contract Configuration

Edit `frontend/src/contractConfig.js`:

Replace:
```javascript
export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"
```

With your deployed contract address:
```javascript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress"
```

### 5. Update WalletConnect Configuration

Edit `frontend/src/wagmi.js`:

Replace:
```javascript
projectId: 'YOUR_PROJECT_ID'
```

With your WalletConnect Project ID:
```javascript
projectId: 'abc123def456...' // Your actual project ID
```

---

## Running Locally

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 2. Open in Browser
Visit `http://localhost:3000`

### 3. Connect Wallet
1. Click "Connect Wallet" button
2. Select your wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
3. Approve connection
4. Ensure you're on the correct network (Base or Base Sepolia)

### 4. Switch Network (if needed)
If you're on the wrong network:
1. Click network indicator in wallet
2. Select "Base" (mainnet) or "Base Sepolia" (testnet)
3. Or add Base network manually:
   - **Base Mainnet:**
     - Network Name: `Base`
     - RPC URL: `https://mainnet.base.org`
     - Chain ID: `8453`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://basescan.org`

   - **Base Sepolia:**
     - Network Name: `Base Sepolia`
     - RPC URL: `https://sepolia.base.org`
     - Chain ID: `84532`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.basescan.org`

---

## Testing

### Testing Smart Contracts
```bash
npm test
```

### Manual Frontend Testing Checklist

**1. Wallet Connection**
- [ ] Connect wallet successfully
- [ ] Switch between Base and Base Sepolia
- [ ] Disconnect and reconnect

**2. Session Creation**
- [ ] Navigate to "My Sessions" tab
- [ ] Click "Create New Session"
- [ ] Fill in all fields:
  - Session name
  - End time (future date)
  - Min prediction (e.g., 10 USDC)
  - Max prediction (e.g., 1000 USDC)
  - At least 2 options
- [ ] Submit transaction
- [ ] Verify session appears in list

**3. Place Prediction**
- [ ] Navigate to "All Sessions"
- [ ] Click "Place Prediction" on active session
- [ ] Select option
- [ ] Enter amount within min/max range
- [ ] Approve USDC spending (first time only)
- [ ] Confirm prediction transaction
- [ ] Verify prediction appears in "My Predictions"

**4. Session Management (Creator)**
- [ ] Close session (after end time)
- [ ] Select winner
- [ ] Verify winner is displayed

**5. Claim Rewards**
- [ ] Navigate to "My Predictions"
- [ ] Find winning prediction
- [ ] Click "Claim Rewards"
- [ ] Verify USDC received in wallet

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Build Frontend**
```bash
cd frontend
npm run build
```

3. **Deploy**
```bash
vercel
```

4. **Follow Prompts**
- Link to your Vercel account
- Set up project
- Configure environment variables:
  - `VITE_WALLETCONNECT_PROJECT_ID`
  - `VITE_CONTRACT_ADDRESS`

5. **Production Deployment**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

3. **Deploy**
```bash
netlify deploy
```

4. **Configure Environment Variables** in Netlify dashboard

5. **Production Deployment**
```bash
netlify deploy --prod
```

### Option 3: Traditional Hosting

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Upload `dist` folder** to your hosting provider

3. **Configure Web Server**
- Ensure all routes point to `index.html` for client-side routing
- For Nginx:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds for gas"
**Solution:**
- Ensure you have enough ETH in your wallet
- Base Sepolia: Get free ETH from faucet
- Base Mainnet: Purchase and bridge ETH

#### 2. "Contract address not found"
**Solution:**
- Verify `frontend/src/contractConfig.js` has correct address
- Ensure you're on the correct network (Base vs Base Sepolia)
- Check contract deployed successfully

#### 3. "Transaction fails when placing prediction"
**Solutions:**
- Ensure you have USDC in your wallet
- Approve USDC spending: Transaction → Approve
- Check amount is within min/max range
- Verify session is still active (not past end time)

#### 4. "Cannot connect wallet"
**Solutions:**
- Install MetaMask or compatible wallet
- Unlock your wallet
- Enable browser extension
- Clear browser cache and reload

#### 5. "Network mismatch"
**Solution:**
- Switch to Base or Base Sepolia in your wallet
- Add network manually using RPC details above

#### 6. "Compilation error"
**Solutions:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Hardhat cache: `npx hardhat clean`
- Ensure Node.js v18+ is installed

#### 7. "USDC approval not working"
**Solution:**
- Ensure you're approving the correct contract address
- Try resetting approval to 0 first, then approve desired amount
- Check USDC balance in wallet

#### 8. "Can't claim rewards"
**Possible Causes:**
- You didn't predict the winning option
- You already claimed rewards
- Winner not selected yet
- Check in contract on BaseScan

---

## Network Information

### Base Mainnet
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **USDC Address:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Base Sepolia Testnet
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **USDC Address:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

## Post-Deployment Checklist

- [ ] Smart contract deployed to Base network
- [ ] Contract verified on BaseScan
- [ ] Contract address saved and documented
- [ ] Frontend configured with correct contract address
- [ ] WalletConnect Project ID configured
- [ ] Environment variables set correctly
- [ ] Frontend deployed to hosting provider
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate enabled (HTTPS)
- [ ] Wallet connection tested
- [ ] Session creation tested
- [ ] Prediction placement tested
- [ ] Winner selection tested
- [ ] Reward claiming tested
- [ ] Documentation updated with live URLs

---

## Support & Resources

### Documentation
- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)
- [Wagmi Docs](https://wagmi.sh/)
- [Base Network Docs](https://docs.base.org/)

### Getting Help
- Check existing issues in the repository
- Review smart contract comments
- Verify transaction details on BaseScan
- Test on Base Sepolia before mainnet

---

## Security Best Practices

1. **Never commit `.env` files** - They contain private keys
2. **Test thoroughly on testnet** before mainnet deployment
3. **Audit smart contracts** for production use
4. **Use hardware wallet** for mainnet deployments
5. **Monitor contract** for unusual activity
6. **Keep dependencies updated** to patch vulnerabilities
7. **Implement rate limiting** on frontend to prevent spam
8. **Enable 2FA** on all service accounts (Vercel, Netlify, etc.)

---

## License

MIT

---

## Additional Notes

- Platform takes 1% fee from each pool
- Minimum 2 options required per session
- Sessions can only be deleted if no predictions placed
- Sessions can only be edited before predictions are placed
- Rewards distributed proportionally based on winning predictions
- ReentrancyGuard prevents reentrancy attacks
- All amounts are in USDC with 6 decimals

---

**Happy Predicting! 🎯**
