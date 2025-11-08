# Base Mainnet Deployment Guide

## ⚠️ IMPORTANT - Mainnet Deployment Checklist

Before deploying to mainnet, ensure you have:

1. **Sufficient ETH on Base Mainnet** for gas fees (estimated ~0.01-0.05 ETH)
2. **Private Key** of the wallet that will own the contract
3. **Etherscan API Key** for contract verification
4. **Audited Smart Contract** (recommended for production)
5. **Test thoroughly on testnet** before mainnet deployment

## Prerequisites

### 1. Environment Variables

Create or update your `.env` file with the following:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Base Mainnet RPC URL (you can use public RPC or services like Alchemy/Infura)
BASE_RPC_URL=https://mainnet.base.org

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# USDC on Base Mainnet
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 2. Get Base Mainnet ETH

You'll need ETH on Base mainnet for deployment. You can:
- Bridge from Ethereum mainnet using [Base Bridge](https://bridge.base.org/)
- Use a centralized exchange that supports Base network

### 3. Get Etherscan API Key

1. Go to [Etherscan](https://etherscan.io/)
2. Sign up/login
3. Go to API Keys section
4. Create a new API key
5. Add it to your `.env` file

## Deployment Steps

### Step 1: Verify Configuration

```bash
# Test the configuration (dry run)
npx hardhat run scripts/deploy.js --network base --dry-run
```

### Step 2: Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
```

The script will:
- Deploy the PredictionPool contract
- Wait for 5 block confirmations
- Verify the contract on BaseScan
- Save deployment info to `deployments/base-latest.json`

### Step 3: Verify Deployment

After deployment, you'll see output like:

```
PredictionPool deployed to: 0x...
View on BaseScan: https://basescan.org/address/0x...
```

Visit the BaseScan link to verify:
- Contract is verified (green checkmark)
- USDC token address is correct
- Owner is your wallet address

### Step 4: Update Frontend Configuration

Update `frontend/src/contractConfig.js`:

```javascript
export const CONTRACT_ADDRESS = "0xYOUR_MAINNET_CONTRACT_ADDRESS";
```

Update `frontend/src/wagmi.js` to include Base mainnet:

```javascript
import { base } from 'wagmi/chains';

export const config = createConfig({
  chains: [base], // Add base mainnet
  // ... rest of config
});
```

### Step 5: Test the dApp

1. Connect your wallet to Base mainnet
2. Test creating a session (with real USDC)
3. Test placing predictions
4. Verify all functions work correctly

## Important USDC Information

**Base Mainnet USDC Address:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

This is the official USDC token on Base mainnet (6 decimals).

## Security Considerations

### ⚠️ Before Mainnet Deployment

1. **Audit the smart contract** - Consider getting a professional audit
2. **Test extensively on testnet** - Ensure all features work correctly
3. **Review all functions** - Check owner privileges, emergency functions
4. **Set appropriate limits** - Review min/max prediction amounts
5. **Prepare incident response plan** - Know what to do if issues arise

### Post-Deployment Security

1. **Monitor the contract** - Watch for unusual activity
2. **Test emergency functions** - Ensure you can pause/withdraw if needed
3. **Keep private key secure** - Use hardware wallet for owner account
4. **Document everything** - Keep records of all transactions

## Gas Costs Estimation

Typical gas costs on Base mainnet:

- **Deploy Contract:** ~2-5M gas (~$5-15 depending on gas prices)
- **Create Session:** ~150-300K gas (~$1-3)
- **Place Prediction:** ~100-200K gas (~$0.50-2)
- **Select Winner:** ~200-400K gas (~$1-4)
- **Claim Rewards:** ~80-150K gas (~$0.40-1.50)

*Note: Actual costs vary based on network congestion*

## Deployment Info

After deployment, check the following files:
- `deployments/base-latest.json` - Latest mainnet deployment
- `deployments/base-[timestamp].json` - Timestamped deployment record

## Useful Commands

```bash
# Check balance of deployer
npx hardhat run scripts/check-balance.js --network base

# Interact with deployed contract
npx hardhat console --network base

# Verify contract manually (if auto-verification fails)
npx hardhat verify --network base CONTRACT_ADDRESS "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

## Troubleshooting

### Deployment Fails

- **Insufficient funds:** Add more ETH to your wallet
- **Nonce too high:** Clear pending transactions or wait
- **Gas price too low:** Increase gas price in hardhat.config.js

### Verification Fails

- Wait 1-2 minutes and try manual verification
- Check that Etherscan API key is correct
- Ensure constructor arguments match exactly

### Contract Not Working

- Verify USDC address is correct (Base mainnet USDC)
- Check wallet has USDC approval for the contract
- Ensure contract is verified on BaseScan

## Support & Resources

- [Base Documentation](https://docs.base.org/)
- [Base Bridge](https://bridge.base.org/)
- [BaseScan](https://basescan.org/)
- [USDC on Base](https://www.circle.com/en/usdc-multichain/base)

---

**⚠️ WARNING:** Deploying to mainnet involves real money. Double-check everything before proceeding. The contract owner has significant privileges - keep your private key secure!
