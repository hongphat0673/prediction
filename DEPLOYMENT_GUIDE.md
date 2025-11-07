# Deployment Guide for Prediction dApp

## Quick Deployment to Base Sepolia

### Prerequisites

1. **Base Sepolia ETH** for gas fees
   - Get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - Or bridge from Sepolia at [Base Bridge](https://bridge.base.org/)

2. **Private Key** with funds
   - Export from MetaMask: Account Details → Show Private Key
   - ⚠️ **NEVER share or commit your private key!**

3. **BaseScan API Key** (optional, for verification)
   - Get from [BaseScan](https://basescan.org/myapikey)

### Step 1: Configure Environment

```bash
# Copy example and edit
cp .env.example .env
nano .env
```

Update with your values:
```env
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_api_key_here  # Optional
```

### Step 2: Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 3: Compile Contracts

```bash
npm run compile
```

Expected output:
```
✅ Compiled 5 Solidity files successfully
```

### Step 4: Deploy to Base Sepolia

```bash
npm run deploy:base-sepolia
```

Expected output:
```
Deploying PredictionPool contract to baseSepolia
Using USDC address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Deploying contract...
PredictionPool deployed to: 0x...
Waiting for block confirmations...
Verifying contract on BaseScan...
Contract verified successfully

=== Deployment Summary ===
{
  "network": "baseSepolia",
  "contractAddress": "0x...",
  "usdcAddress": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "deploymentTime": "2025-...",
  "deployer": "0x..."
}
==========================

✅ Deployment info saved to: deployments/baseSepolia-latest.json
🎉 Deployment completed successfully!
📋 Contract Address: 0x...
🔗 View on BaseScan: https://sepolia.basescan.org/address/0x...
```

### Step 5: Update Frontend Configuration

**Edit `frontend/src/contractConfig.js`:**

```javascript
export const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"
```

**Edit `frontend/src/wagmi.js`:**

```javascript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
```

### Step 6: Test the Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` and test:
1. ✅ Connect wallet (switch to Base Sepolia)
2. ✅ Create a test session
3. ✅ Place a prediction
4. ✅ View dashboard
5. ✅ Test search/filter

### Step 7: Deploy to Production

**For Base Mainnet:**

```bash
npm run deploy:base
```

**Update frontend config** with mainnet contract address

**Build for production:**

```bash
cd frontend
npm run build
```

Deploy `frontend/dist/` to:
- Vercel
- Netlify
- IPFS
- Your hosting provider

## Troubleshooting

### Issue: Insufficient funds for gas

**Solution:** Get more Base Sepolia ETH from faucet

### Issue: Network not configured

**Solution:** Add Base Sepolia to MetaMask:
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency: ETH
- Block Explorer: https://sepolia.basescan.org

### Issue: Transaction underpriced

**Solution:** Increase gas in hardhat.config.js:
```javascript
baseSepolia: {
  url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 84532,
  gasPrice: 1000000000, // 1 gwei
}
```

### Issue: Contract verification failed

**Manual verification:**

```bash
npx hardhat verify --network baseSepolia \
  YOUR_CONTRACT_ADDRESS \
  0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Issue: Cannot find module errors

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Smart Contract Features Deployed

✅ **Core Functions:**
- createSession - Create prediction sessions
- placePrediction - Place bets
- closeSession - Close sessions
- selectWinner - Select winners
- claimRewards - Claim winnings
- deleteSession - Delete empty sessions
- updateSession - Update session details

✅ **NEW Functions:**
- emergencyWithdraw - Refund all participants
- calculatePotentialWinnings - Preview potential rewards
- getUserPredictions - Get all user predictions
- getUserTotalPrediction - Get total bet amount

✅ **Security:**
- ReentrancyGuard protection
- SafeERC20 for token transfers
- Ownable for admin functions
- Input validation
- Access control

## Frontend Features Deployed

✅ **User Interface:**
- Session browsing with search/filter
- User dashboard with analytics
- Wallet connection (MetaMask, etc.)
- Mobile-responsive design
- Transaction status tracking

✅ **Analytics Dashboard:**
- Total bet amount
- Total winnings
- Win rate statistics
- Net profit/loss
- Prediction history

✅ **Search & Filter:**
- Search by name/option
- Filter by status (Active/Closed)
- Real-time updates

## Post-Deployment Checklist

- [ ] Contract deployed to Base Sepolia
- [ ] Contract verified on BaseScan
- [ ] Frontend config updated with contract address
- [ ] WalletConnect Project ID configured
- [ ] Frontend tested locally
- [ ] Test session created
- [ ] Test prediction placed
- [ ] Dashboard displays correctly
- [ ] Search/filter works
- [ ] Emergency withdraw tested (if needed)
- [ ] Ready for mainnet deployment

## Support

For issues:
1. Check deployment logs in `deployments/` folder
2. Verify contract on BaseScan
3. Check browser console for frontend errors
4. Ensure wallet is on correct network

## Security Notes

⚠️ **NEVER:**
- Commit `.env` file to git
- Share your private key
- Use mainnet private key on testnet

✅ **ALWAYS:**
- Test thoroughly on testnet first
- Verify contract source code
- Use separate wallets for testing
- Keep private keys secure

## Next Steps

After successful testnet deployment:

1. **Test thoroughly** - Create multiple sessions, place predictions, test all features
2. **Audit** - Consider professional audit for mainnet
3. **Deploy to mainnet** - Use `npm run deploy:base`
4. **Launch** - Deploy frontend and announce!

---

**Contract successfully enhanced with:**
- Emergency withdraw functionality
- User analytics and statistics
- Search and filtering
- Potential winnings calculator
- Comprehensive testing

Ready for production deployment! 🚀
