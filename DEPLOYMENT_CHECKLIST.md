# Base Mainnet Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] **Smart Contract Tested** - All functions tested on Base Sepolia testnet
- [ ] **Security Review** - Contract reviewed for vulnerabilities
- [ ] **Private Key Secured** - Using hardware wallet or secure key management
- [ ] **ETH on Base Mainnet** - At least 0.05 ETH for deployment gas fees
- [ ] **Environment Variables Set** - `.env` file configured correctly
- [ ] **Etherscan API Key** - API key ready for contract verification

## 📋 Deployment Steps

### 1. Verify Environment

```bash
# Check your .env file has:
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. Check Wallet Balance

```bash
npx hardhat run scripts/check-balance.js --network base
```

**Requirements:**
- Minimum ETH: 0.01 ETH
- Recommended: 0.05 ETH
- For full testing: 0.1 ETH + some USDC

### 3. Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network base
```

**Expected Output:**
```
Deploying PredictionPool contract to base
Using USDC address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Deploying contract...
PredictionPool deployed to: 0x...
Deployment transaction: 0x...
Waiting for block confirmations...
Verifying contract on BaseScan...
Contract verified successfully
```

### 4. Save Contract Address

The contract address will be saved in:
- `deployments/base-latest.json`
- `deployments/base-[timestamp].json`

Example:
```json
{
  "network": "base",
  "contractAddress": "0x1234...abcd",
  "usdcAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "deploymentTime": "2025-11-08T...",
  "deployer": "0x..."
}
```

### 5. Update Frontend Configuration

Run the automated script:

```bash
bash scripts/update-frontend-config.sh
```

Or manually update `frontend/src/contractConfig.js`:

```javascript
export const CONTRACT_ADDRESS = "0xYOUR_MAINNET_CONTRACT_ADDRESS"
```

And `frontend/src/wagmi.js`:

```javascript
import { base } from 'wagmi/chains'

export const config = createConfig({
  chains: [base],  // Change from baseSepolia to base
  // ...
})
```

### 6. Verify on BaseScan

Visit: `https://basescan.org/address/YOUR_CONTRACT_ADDRESS`

**Check:**
- [ ] Contract is verified (green checkmark)
- [ ] Read Contract functions are visible
- [ ] Write Contract functions are visible
- [ ] USDC token address is correct: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## 🧪 Post-Deployment Testing

### 1. Test Basic Functions

```bash
cd frontend
npm run dev
```

**Test in Browser:**
- [ ] Connect wallet to Base Mainnet
- [ ] Wallet shows correct network (Base, Chain ID: 8453)
- [ ] Can see contract address in config

### 2. Test Session Creation

- [ ] Create a test session with small amounts
- [ ] Verify session appears in "All Sessions"
- [ ] Check transaction on BaseScan
- [ ] Verify USDC was transferred

### 3. Test Predictions

- [ ] Approve USDC for contract
- [ ] Place a small test prediction
- [ ] Verify prediction is recorded
- [ ] Check user balance decreased

### 4. Test Full Flow

- [ ] Create session
- [ ] Place predictions from multiple accounts
- [ ] Close session
- [ ] Select winner
- [ ] Claim rewards
- [ ] Verify rewards distributed correctly

## 📊 Contract Information

**Base Mainnet:**
- Network: Base
- Chain ID: 8453
- RPC URL: https://mainnet.base.org
- Block Explorer: https://basescan.org
- USDC Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

## 🚨 Emergency Procedures

### If Something Goes Wrong

1. **Don't Panic** - Most issues are recoverable

2. **Check Transaction Status**
   - Visit BaseScan
   - Check if transaction succeeded or failed
   - Read error message if failed

3. **Emergency Withdraw**
   - Session creators can use `emergencyWithdraw(sessionId)`
   - Only works if winner hasn't been selected

4. **Contact Support**
   - Document the issue
   - Save transaction hashes
   - Note what you were trying to do

## 📝 Deployment Log Template

Fill this out during deployment:

```
Deployment Date: _______________
Network: Base Mainnet
Chain ID: 8453

Deployer Address: 0x_______________
Contract Address: 0x_______________
Deployment TX: 0x_______________

BaseScan Link: https://basescan.org/address/0x_______________

Gas Used: _______________ gas
Gas Price: _______________ gwei
Total Cost: _______________ ETH

Verification Status: [ ] Verified [ ] Failed
Frontend Updated: [ ] Yes [ ] No
Testing Complete: [ ] Yes [ ] No

Notes:
_________________________________________________
_________________________________________________
```

## 🎉 Success Criteria

Deployment is successful when:

- [x] Contract deployed to Base Mainnet
- [x] Contract verified on BaseScan
- [x] Frontend configuration updated
- [x] Can create sessions
- [x] Can place predictions
- [x] Can select winners
- [x] Can claim rewards
- [x] All transactions appear on BaseScan
- [x] USDC transfers work correctly

---

**Important Links:**
- Deployment Guide: [MAINNET_DEPLOYMENT.md](./MAINNET_DEPLOYMENT.md)
- Contract on BaseScan: https://basescan.org/address/YOUR_CONTRACT_ADDRESS
- Base Bridge: https://bridge.base.org/
- USDC on Base: https://www.circle.com/en/usdc-multichain/base
