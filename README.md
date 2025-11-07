# Prediction Pool dApp

A decentralized prediction pool application built on Base network that allows users to create prediction markets and participate in them using USDC.

## Features

### For Prediction Creators
- Create prediction sessions with custom parameters
- Set minimum and maximum prediction amounts in USDC
- Define prediction periods with start and end times
- Add multiple prediction options (minimum 2)
- Manage sessions: close, delete (if no predictions), and edit
- Select the winner after closing a prediction session
- View all predictions and participants

### For End Users
- Connect EVM wallet (MetaMask, Rainbow, Coinbase Wallet, etc.)
- Browse all active prediction sessions
- **NEW!** Search and filter sessions by name, status, and options
- Place predictions on any option by depositing USDC
- View personal prediction history
- **NEW!** Comprehensive analytics dashboard with:
  - Total bet amount and winnings
  - Win rate statistics
  - Net profit/loss tracking
  - Prediction history with results
- Claim rewards after winning predictions
- See real-time pool statistics and potential winnings

### Smart Contract Features
- Deployed on Base Network (Mainnet and Sepolia Testnet)
- Secure USDC deposits and withdrawals
- Automatic reward distribution to winners
- Platform fee mechanism (1% default)
- ReentrancyGuard protection
- Owner-controlled administrative functions

## Tech Stack

### Smart Contract
- Solidity ^0.8.20
- OpenZeppelin Contracts (ERC20, Ownable, ReentrancyGuard)
- Hardhat for development and testing
- Ethers.js v6

### Frontend
- React 18
- Vite
- RainbowKit for wallet connection
- Wagmi for Web3 interactions
- Ethers.js v6

## Project Structure

```
prediction-dapp/
├── contracts/
│   ├── PredictionPool.sol      # Main prediction pool contract
│   └── MockERC20.sol           # Mock USDC for testing
├── scripts/
│   └── deploy.js               # Deployment script
├── test/
│   └── PredictionPool.test.js  # Contract tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateSessionModal.jsx
│   │   │   ├── SessionCard.jsx
│   │   │   └── PredictModal.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── wagmi.js
│   │   ├── contractConfig.js
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── hardhat.config.js
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- MetaMask or another Web3 wallet
- USDC on Base network (for mainnet) or Base Sepolia (for testnet)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prediction
```

### 2. Install Smart Contract Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
# Private key for deployment (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# Base Network RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# BaseScan API Key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# USDC Contract Address on Base
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 4. Compile Smart Contracts

```bash
npm run compile
```

### 5. Run Tests

```bash
npm test
```

### 6. Deploy to Base Network

For Base Sepolia Testnet:
```bash
npm run deploy:base-sepolia
```

For Base Mainnet:
```bash
npm run deploy:base
```

Save the deployed contract address from the output.

### 7. Setup Frontend

```bash
cd frontend
npm install
```

### 8. Configure Frontend

Edit `frontend/src/contractConfig.js` and update:

```javascript
export const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS"
```

Edit `frontend/src/wagmi.js` and update:

```javascript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' // Get from https://cloud.walletconnect.com
```

### 9. Run Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 10. Build for Production

```bash
npm run build
```

The production build will be in `frontend/dist/`

## Smart Contract Details

### PredictionPool Contract

**Main Functions:**

- `createSession(name, endTime, minPrediction, maxPrediction, optionNames)` - Create a new prediction session
- `placePrediction(sessionId, optionId, amount)` - Place a prediction on an option
- `closeSession(sessionId)` - Close a session (creator only)
- `selectWinner(sessionId, winningOptionId)` - Select the winning option (creator only)
- `claimRewards(sessionId)` - Claim rewards for winning predictions
- `deleteSession(sessionId)` - Delete a session with no predictions (creator only)
- `updateSession(sessionId, name, endTime, minPrediction, maxPrediction)` - Update session details (creator only, no predictions)
- `emergencyWithdraw(sessionId)` - **NEW!** Emergency refund all participants (creator only, before winner selection)

**View Functions:**

- `getSessionDetails(sessionId)` - Get session information
- `getOptionDetails(sessionId, optionId)` - Get option details
- `getUserPrediction(sessionId, user, optionId)` - Get user's prediction amount
- `calculatePotentialWinnings(sessionId, user, optionId)` - **NEW!** Calculate potential winnings if option wins
- `getUserPredictions(sessionId, user)` - **NEW!** Get all user predictions for a session
- `getUserTotalPrediction(sessionId, user)` - **NEW!** Get total amount user has bet in a session

**Events:**

- `SessionCreated` - Emitted when a new session is created
- `PredictionPlaced` - Emitted when a prediction is placed
- `SessionClosed` - Emitted when a session is closed
- `WinnerSelected` - Emitted when a winner is selected
- `RewardsDistributed` - Emitted when rewards are claimed

### USDC Addresses

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Usage Guide

### Creating a Prediction Session

1. Connect your wallet
2. Navigate to "My Sessions" tab
3. Click "Create New Session"
4. Fill in:
   - Session name
   - End time (when predictions close)
   - Min/Max prediction amounts in USDC
   - At least 2 prediction options
5. Confirm the transaction

### Placing a Prediction

1. Connect your wallet
2. Browse available sessions in "All Sessions"
3. Click "Place Prediction" on a session
4. Select your preferred option
5. Enter your prediction amount (within min/max range)
6. Approve USDC spending (first time)
7. Confirm the prediction transaction

### Managing Sessions (Creator)

1. Navigate to "My Sessions" tab
2. For each session you can:
   - **Close Session**: Stop accepting new predictions
   - **Select Winner**: Choose the winning option after closing
   - **Delete**: Remove session (only if no predictions placed)
   - **Emergency Withdraw**: Refund all participants if something goes wrong (only before winner selection)

### Viewing Analytics Dashboard

1. Connect your wallet
2. Navigate to "Dashboard" tab
3. View comprehensive statistics:
   - Total amount bet across all sessions
   - Total winnings from successful predictions
   - Active and completed predictions count
   - Win rate percentage
   - Net profit/loss
   - Detailed prediction history with results

### Searching and Filtering Sessions

1. In "All Sessions" or "My Predictions" tab
2. Use the search bar to find sessions by name or option
3. Use filter buttons to show:
   - **All**: All sessions
   - **Active**: Only active sessions accepting predictions
   - **Closed**: Only closed/completed sessions

### Claiming Rewards

1. Navigate to "My Predictions" tab
2. Find sessions where you predicted the winner
3. Click "Claim Rewards"
4. Confirm the transaction to receive your share of the pool

## Reward Distribution

When a winner is selected:

1. Platform fee (1% default) is deducted from total pool
2. Remaining pool is distributed proportionally to winning predictors
3. Each winner receives: `(their prediction amount / total winning predictions) * (total pool - fee)`

**Example:**
- Total pool: 1000 USDC
- Platform fee: 10 USDC (1%)
- Distributable: 990 USDC
- If you predicted 100 USDC on winning option with 500 USDC total
- You receive: `(100 / 500) * 990 = 198 USDC` (98% profit!)

## Security Features

- ReentrancyGuard protection against reentrancy attacks
- SafeERC20 for secure token transfers
- Ownable for administrative functions
- Session creator verification
- Input validation and bounds checking
- No ETH handling (USDC only)

## Testing

The contract includes comprehensive tests covering:
- Session creation
- Prediction placement
- Session management (close, delete, update)
- Winner selection
- Reward distribution
- Platform fees
- Edge cases and error conditions

Run tests with:
```bash
npm test
```

## Deployment Checklist

- [ ] Smart contract compiled successfully
- [ ] All tests passing
- [ ] `.env` file configured with private key and RPC URLs
- [ ] Contract deployed to Base network
- [ ] Contract verified on BaseScan
- [ ] Frontend `contractConfig.js` updated with contract address
- [ ] WalletConnect Project ID configured
- [ ] Frontend tested locally
- [ ] Frontend built for production

## Troubleshooting

### Common Issues

**Issue**: Transaction fails when placing prediction
- Ensure you have enough USDC in your wallet
- Check that you've approved USDC spending
- Verify the session is still active
- Confirm your amount is within min/max range

**Issue**: Can't connect wallet
- Ensure MetaMask is installed and unlocked
- Switch to Base network in your wallet
- Clear browser cache and try again

**Issue**: Contract address not found
- Verify you're on the correct network (Base Mainnet or Sepolia)
- Check that `contractConfig.js` has the correct address
- Ensure the contract was deployed successfully

## Future Enhancements

- Multiple token support (not just USDC)
- Oracle integration for automated winner selection
- NFT-based participation tickets
- Leaderboards and user statistics
- Social features (comments, shares)
- Mobile app version
- Advanced analytics dashboard

## License

MIT

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review smart contract comments

## Disclaimer

This is a decentralized application. Users are responsible for:
- Their own wallet security
- Understanding smart contract risks
- Verifying prediction details before participating
- Compliance with local gambling/prediction market regulations

The platform takes a 1% fee from each pool for maintenance and development.
