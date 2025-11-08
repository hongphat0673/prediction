// Contract configuration
// Deployed contract address on Base Mainnet

export const CONTRACT_ADDRESS = "0xf91100f0C37548EfA3155FC4BACb010a0297fED0"

export const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdcToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "optionName", "type": "string"}
    ],
    "name": "OptionAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "predictor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "PredictionPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "winner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "RewardsDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "SessionClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "maxPrediction", "type": "uint256"}
    ],
    "name": "SessionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "SessionDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "winningOptionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "optionName", "type": "string"}
    ],
    "name": "WinnerSelected",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "closeSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPrediction", "type": "uint256"},
      {"internalType": "string[]", "name": "optionNames", "type": "string[]"}
    ],
    "name": "createSession",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "deleteSession",
    "outputs": [],
    "stateMutability": "nonpayable",
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
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "getSessionDetails",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPrediction", "type": "uint256"},
      {"internalType": "enum PredictionPool.SessionStatus", "name": "status", "type": "uint8"},
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
    "name": "hasClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "uint256", "name": "optionId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "placePrediction",
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
    "inputs": [],
    "name": "sessionCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdcToken",
    "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPrediction", "type": "uint256"}
    ],
    "name": "updateSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "sessionId", "type": "uint256"}
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  }
]

// USDC Token ABI (minimal - for approval)
export const USDC_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// USDC addresses on different networks
export const USDC_ADDRESSES = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
}
