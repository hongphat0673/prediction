#!/bin/bash

# Post-deployment configuration script
# This script updates the frontend configuration after mainnet deployment

echo "🔧 Post-Deployment Configuration Script"
echo "========================================="
echo ""

# Check if deployment file exists
DEPLOYMENT_FILE="deployments/base-latest.json"

if [ ! -f "$DEPLOYMENT_FILE" ]; then
  echo "❌ Error: Deployment file not found at $DEPLOYMENT_FILE"
  echo "Please run deployment first: npx hardhat run scripts/deploy.js --network base"
  exit 1
fi

# Extract contract address from deployment file
CONTRACT_ADDRESS=$(grep -o '"contractAddress": "[^"]*' "$DEPLOYMENT_FILE" | cut -d'"' -f4)

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Error: Could not extract contract address from deployment file"
  exit 1
fi

echo "📋 Deployment Information:"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Network: Base Mainnet"
echo "   Chain ID: 8453"
echo ""

# Backup current config
echo "📦 Creating backup of current config..."
cp frontend/src/contractConfig.js frontend/src/contractConfig.js.backup
cp frontend/src/wagmi.js frontend/src/wagmi.js.backup
echo "   ✅ Backup created"
echo ""

# Update contractConfig.js
echo "🔄 Updating frontend/src/contractConfig.js..."
cat > frontend/src/contractConfig.js << EOF
// Contract configuration
// Deployed contract address on Base Mainnet

export const CONTRACT_ADDRESS = "$CONTRACT_ADDRESS"

export const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdcToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "sessionCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "uint256", "name": "_endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "_minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxPrediction", "type": "uint256"},
      {"internalType": "string[]", "name": "_optionNames", "type": "string[]"}
    ],
    "name": "createSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "predict",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "closeSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "uint256", "name": "winningOptionId", "type": "uint256"}
    ],
    "name": "selectWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "deleteSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "getSessionDetails",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPrediction", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
      {"internalType": "uint256", "name": "optionCount", "type": "uint256"},
      {"internalType": "bool", "name": "winnerSelected", "type": "bool"},
      {"internalType": "uint256", "name": "winningOptionId", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "uint256", "name": "optionId", "type": "uint256"}
    ],
    "name": "getOptionDetails",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint256", "name": "totalAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "predictorCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "optionId", "type": "uint256"}
    ],
    "name": "getUserPrediction",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserPredictions",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserTotalPrediction",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "optionId", "type": "uint256"}
    ],
    "name": "calculatePotentialWinnings",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"}
    ],
    "name": "SessionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "PredictionPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "winningOptionId", "type": "uint256"}
    ],
    "name": "WinnerSelected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}
    ],
    "name": "RewardClaimed",
    "type": "event"
  }
]

// USDC Token Address on Base Mainnet
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
EOF

echo "   ✅ contractConfig.js updated"
echo ""

# Update wagmi.js
echo "🔄 Updating frontend/src/wagmi.js for Base Mainnet..."
echo "   ⚠️  Please manually verify wagmi.js uses 'base' chain instead of 'baseSepolia'"
echo ""

echo "✅ Configuration Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Review the updated files:"
echo "      - frontend/src/contractConfig.js"
echo "      - frontend/src/wagmi.js (manual check needed)"
echo ""
echo "   2. Update wagmi.js to use Base mainnet:"
echo "      import { base } from 'wagmi/chains'"
echo "      chains: [base]"
echo ""
echo "   3. Rebuild and test the frontend:"
echo "      cd frontend"
echo "      npm run dev"
echo ""
echo "   4. Test on Base Mainnet:"
echo "      - Switch wallet to Base Mainnet (Chain ID: 8453)"
echo "      - Get real USDC on Base"
echo "      - Create a test session"
echo ""
echo "🔗 View Contract on BaseScan:"
echo "   https://basescan.org/address/$CONTRACT_ADDRESS"
echo ""
echo "📦 Backup files saved:"
echo "   - frontend/src/contractConfig.js.backup"
echo "   - frontend/src/wagmi.js.backup"
echo ""
