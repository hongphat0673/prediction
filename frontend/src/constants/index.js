/**
 * Application constants
 */

// Session status enum
export const SESSION_STATUS = {
  ACTIVE: 0,
  CLOSED: 1,
  DELETED: 2,
}

// Tab types
export const TABS = {
  ALL: 'all',
  MY_PREDICTIONS: 'my-predictions',
  CREATOR: 'creator',
  DASHBOARD: 'dashboard',
}

// Timing constants
export const TIMING = {
  AUTO_REFRESH_DELAY: 3000, // 3 seconds
  PREDICTION_REFRESH_DELAY: 1000, // 1 second
  NOTIFICATION_DURATION: 5000, // 5 seconds
}

// USDC decimals
export const USDC_DECIMALS = 6

// Network information
export const NETWORKS = {
  BASE_MAINNET: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
}
