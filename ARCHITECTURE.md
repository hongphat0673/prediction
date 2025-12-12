# Prediction dApp Architecture

A comprehensive decentralized application for prediction markets on Base Network using USDC.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Smart Contract Design](#smart-contract-design)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow](#data-flow)
6. [Security Considerations](#security-considerations)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability](#scalability)

---

## Overview

### Purpose

This dApp enables users to:
- **Create Predictions**: Set up prediction sessions with multiple options
- **Place Bets**: Wager USDC on chosen outcomes
- **Claim Rewards**: Receive proportional winnings when backing the correct option

### Technology Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Base Network (Ethereum L2) |
| Token | USDC (6 decimals) |
| Smart Contract | Solidity 0.8.20 |
| Frontend | React 18 + Vite |
| Web3 Integration | Wagmi v2 + Ethers.js v6 |
| Wallet Connection | RainbowKit v2 |
| Contract Framework | Hardhat |

### Network Configuration

| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Base Mainnet | 8453 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Base Sepolia | 84532 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ SessionCard │  │CreateSession│  │  UserDashboard  │   │  │
│  │  │  Component  │  │   Modal     │  │    Component    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │  ┌─────────────┐  ┌─────────────┐                        │  │
│  │  │ PredictModal│  │ App (Router)│                        │  │
│  │  │  Component  │  │  Component  │                        │  │
│  │  └─────────────┘  └─────────────┘                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       WEB3 LAYER                                │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │  RainbowKit  │  │  Wagmi v2     │  │   Ethers.js v6   │     │
│  │  (Wallets)   │  │  (Hooks)      │  │   (Provider)     │     │
│  └──────────────┘  └───────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE NETWORK (L2)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  PredictionPool Contract                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │  Sessions  │  │  Options   │  │   User Predictions │  │  │
│  │  │  Storage   │  │  Storage   │  │      Storage       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    USDC Token Contract                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Design

### Contract: PredictionPool.sol

The core smart contract manages all prediction logic with the following structure:

#### State Variables

```solidity
IERC20 public immutable usdcToken;      // USDC token reference
uint256 public sessionCounter;           // Auto-incrementing session ID
uint256 public platformFee = 100;        // 1% fee (100 basis points)
uint256 public constant FEE_DENOMINATOR = 10000;
uint256 public collectedFees;            // Accumulated platform fees
```

#### Data Structures

```solidity
enum SessionStatus { Active, Closed, Distributed }

struct PredictionOption {
    string name;
    uint256 totalAmount;
    address[] predictors;
}

struct Session {
    uint256 id;
    string name;
    address creator;
    uint256 startTime;
    uint256 endTime;
    uint256 minPrediction;
    uint256 maxPrediction;
    SessionStatus status;
    uint256 winningOptionId;
    bool winnerSelected;
    uint256 totalPool;
    uint256 optionCount;
    mapping(uint256 => PredictionOption) options;
    mapping(address => mapping(uint256 => uint256)) userPredictions;
    mapping(address => bool) hasClaimed;
}
```

#### Core Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createSession()` | Public | Create new prediction with options |
| `placePrediction()` | Public | Place USDC bet on an option |
| `closeSession()` | Creator Only | Stop accepting new predictions |
| `selectWinner()` | Creator Only | Designate winning option |
| `claimRewards()` | Public | Claim winnings (for winners) |
| `emergencyWithdraw()` | Creator Only | Refund all participants |
| `deleteSession()` | Creator Only | Remove empty session |
| `updateSession()` | Creator Only | Modify session (no bets yet) |

#### View Functions

| Function | Returns |
|----------|---------|
| `getSessionDetails()` | Full session information |
| `getOptionDetails()` | Option name, total amount, predictor count |
| `getUserPrediction()` | User's bet on specific option |
| `getUserPredictions()` | All user bets for a session |
| `calculatePotentialWinnings()` | Estimated payout if option wins |
| `hasClaimed()` | Whether user has claimed rewards |

#### Reward Distribution Formula

```
userReward = (distributionPool * userPrediction) / winningOptionTotalAmount

where:
  distributionPool = totalPool - (totalPool * platformFee / 10000)
```

### Session Lifecycle

```
┌─────────┐    createSession()    ┌────────┐
│  START  │ ──────────────────▶   │ ACTIVE │
└─────────┘                       └────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                    closeSession()          emergencyWithdraw()
                          │                       │
                          ▼                       ▼
                    ┌────────┐              ┌─────────────┐
                    │ CLOSED │              │ DISTRIBUTED │
                    └────────┘              │  (Refunded) │
                          │                 └─────────────┘
                    selectWinner()
                          │
                          ▼
                    ┌─────────────┐
                    │   WINNER    │
                    │  SELECTED   │
                    └─────────────┘
                          │
                    claimRewards() (by each winner)
                          │
                          ▼
                    ┌─────────────┐
                    │ DISTRIBUTED │
                    └─────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── Header (ConnectButton)
├── Navigation Tabs
│   ├── All Sessions
│   ├── My Predictions
│   ├── My Sessions (Creator)
│   └── Dashboard
├── Search & Filter Controls
├── Session Grid
│   └── SessionCard.jsx (multiple)
│       ├── Session Info
│       ├── Options Display
│       └── Action Buttons
├── CreateSessionModal.jsx
│   ├── Form Fields
│   └── Dynamic Options
├── PredictModal.jsx
│   ├── Option Selection
│   ├── Amount Input
│   └── USDC Approval
└── UserDashboard.jsx
    ├── Statistics Cards
    └── Prediction History
```

### State Management

```javascript
// App-level State
const [sessions, setSessions] = useState([])        // All sessions
const [activeTab, setActiveTab] = useState('all')   // Current view
const [searchQuery, setSearchQuery] = useState('')  // Search filter
const [statusFilter, setStatusFilter] = useState('all') // Status filter
const [notification, setNotification] = useState(null)  // Alerts

// Web3 State (via Wagmi hooks)
const { address, isConnected } = useAccount()       // Wallet connection
const { data: sessionCounter } = useReadContract()  // Contract state
```

### Key Components

#### SessionCard.jsx
Displays individual prediction sessions with:
- Session metadata (name, dates, pool size)
- Option breakdown with statistics
- User's predictions highlighted
- Context-aware action buttons
- Winner badge and claim functionality

#### CreateSessionModal.jsx
Form for creating new predictions:
- Session name and end time
- Min/max prediction amounts
- Dynamic option management (add/remove)
- Input validation
- Transaction handling

#### PredictModal.jsx
Interface for placing predictions:
- Option selection
- Amount input with validation
- USDC allowance check and approval
- Two-step transaction flow
- Real-time balance display

#### UserDashboard.jsx
Analytics view showing:
- Total amount bet across all sessions
- Total winnings claimed
- Win rate percentage
- Net profit/loss
- Detailed prediction history

---

## Data Flow

### Creating a Session

```
User                    Frontend                  Contract
  │                        │                         │
  │  Fill Form             │                         │
  │ ──────────────────▶    │                         │
  │                        │  createSession()        │
  │                        │ ────────────────────▶   │
  │                        │                         │
  │                        │     TX Hash             │
  │                        │ ◀────────────────────   │
  │                        │                         │
  │                        │  Wait for Receipt       │
  │                        │ ────────────────────▶   │
  │                        │                         │
  │   Success Notification │                         │
  │ ◀──────────────────────│                         │
```

### Placing a Prediction

```
User                    Frontend                  Contract
  │                        │                         │
  │  Select Option         │                         │
  │  Enter Amount          │                         │
  │ ──────────────────▶    │                         │
  │                        │  Check Allowance        │
  │                        │ ────────────────────▶   │
  │                        │                         │
  │                        │  (If insufficient)      │
  │                        │  USDC.approve()         │
  │                        │ ────────────────────▶   │
  │   Sign Approval TX     │                         │
  │ ◀──────────────────────│                         │
  │ ──────────────────▶    │                         │
  │                        │                         │
  │                        │  placePrediction()      │
  │                        │ ────────────────────▶   │
  │   Sign Prediction TX   │                         │
  │ ◀──────────────────────│                         │
  │ ──────────────────▶    │                         │
  │                        │     Confirmation        │
  │                        │ ◀────────────────────   │
  │   Update UI            │                         │
  │ ◀──────────────────────│                         │
```

### Claiming Rewards

```
User                    Frontend                  Contract
  │                        │                         │
  │  Click Claim           │                         │
  │ ──────────────────▶    │                         │
  │                        │  claimRewards()         │
  │                        │ ────────────────────▶   │
  │   Sign TX              │                         │
  │ ◀──────────────────────│                         │
  │ ──────────────────▶    │                         │
  │                        │                         │
  │                        │  Calculate:             │
  │                        │  - Platform fee         │
  │                        │  - User share           │
  │                        │ ◀────────────────────   │
  │                        │                         │
  │                        │  USDC.transfer(user)    │
  │                        │ ────────────────────▶   │
  │                        │                         │
  │   USDC Received        │                         │
  │ ◀──────────────────────│                         │
```

---

## Security Considerations

### Smart Contract Security

#### Access Control
```solidity
modifier onlySessionCreator(uint256 sessionId) {
    require(sessions[sessionId].creator == msg.sender,
        "Only session creator can perform this action");
    _;
}
```

#### Reentrancy Protection
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

function claimRewards(uint256 sessionId) external nonReentrant {
    // State changes before external calls
    session.hasClaimed[msg.sender] = true;
    // External call last
    usdcToken.safeTransfer(msg.sender, userReward);
}
```

#### Safe Token Transfers
```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;

// Prevents issues with non-standard ERC20 tokens
usdcToken.safeTransferFrom(msg.sender, address(this), amount);
```

#### Input Validation
- Session names cannot be empty
- End time must be in the future
- Minimum prediction must be greater than 0
- Maximum must be >= minimum
- At least 2 options required
- Option names cannot be empty

#### State Machine Enforcement
- Can only place predictions on Active sessions
- Can only close Active sessions
- Can only select winner on Closed sessions
- Can only claim after winner is selected
- Cannot claim twice
- Cannot emergency withdraw after winner selected

### Frontend Security

#### Wallet Connection
- Uses RainbowKit for secure wallet integration
- Supports WalletConnect for mobile wallets
- No private key storage in frontend

#### Transaction Signing
- All transactions require user wallet approval
- Clear transaction details shown before signing
- No automatic transaction signing

#### Input Sanitization
- Amount validation before submission
- Proper decimal handling (6 decimals for USDC)
- Timestamp validation for end times

---

## Deployment Architecture

### Contract Deployment

```
┌────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Compile Contract                                       │
│     └── hardhat compile                                    │
│                                                            │
│  2. Run Tests                                              │
│     └── hardhat test                                       │
│                                                            │
│  3. Deploy to Network                                      │
│     └── hardhat run scripts/deploy.js --network base      │
│                                                            │
│  4. Verify on BaseScan                                     │
│     └── hardhat verify --network base <address> <usdc>    │
│                                                            │
│  5. Update Frontend Config                                 │
│     └── Update contractConfig.js with new address         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```bash
# .env file structure
PRIVATE_KEY=<deployer-private-key>
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=<basescan-api-key>
```

### Frontend Deployment

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend Build Process                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Install Dependencies                                │
│     └── npm install (in frontend/)                      │
│                                                         │
│  2. Configure Environment                               │
│     └── Set VITE_CONTRACT_ADDRESS in .env               │
│                                                         │
│  3. Build Production Bundle                             │
│     └── npm run build                                   │
│                                                         │
│  4. Deploy to Hosting                                   │
│     └── Upload dist/ to Vercel/Netlify/IPFS            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability

### Current Limitations

1. **Session Loading**: O(n) where n = total sessions
2. **Option Loading**: O(m) per session where m = options
3. **User Predictions**: Sequential queries per session

### Optimization Strategies

#### Indexing Solution
For production scale, implement an indexer:

```
┌─────────────┐     Events      ┌──────────────┐
│  Contract   │ ──────────────▶ │   Indexer    │
└─────────────┘                 └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Database   │
                                │  (PostgreSQL)│
                                └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │  GraphQL API │
                                └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Frontend   │
                                └──────────────┘
```

#### Pagination
Implement pagination for session listing:
- Load sessions in batches of 20
- Lazy load on scroll
- Cache loaded sessions

#### Event-Based Updates
Use contract events for real-time updates:
- `SessionCreated` - Add new session to list
- `PredictionPlaced` - Update pool amounts
- `WinnerSelected` - Update session status
- `RewardsDistributed` - Update claim status

### Gas Optimization

The contract implements several gas optimizations:
- `immutable` for USDC token address
- Optimizer enabled with 200 runs
- Efficient storage packing in structs
- Batch option creation in `createSession()`

---

## Project Structure

```
prediction-dapp/
├── contracts/                    # Smart Contracts
│   ├── PredictionPool.sol       # Main contract
│   └── MockERC20.sol            # Test token
│
├── scripts/                      # Deployment Scripts
│   ├── deploy.js                # Main deployment
│   └── check-balance.js         # Utility scripts
│
├── test/                         # Contract Tests
│   └── PredictionPool.test.js   # Test suite
│
├── frontend/                     # React Application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── App.jsx              # Main app
│   │   ├── contractConfig.js    # Contract config
│   │   ├── wagmi.js             # Web3 config
│   │   └── index.css            # Styles
│   ├── package.json             # Frontend deps
│   └── vite.config.js           # Build config
│
├── hardhat.config.js            # Hardhat config
├── package.json                 # Root deps
├── ARCHITECTURE.md              # This document
├── README.md                    # Project readme
└── DEPLOYMENT_GUIDE.md          # Deploy instructions
```

---

## API Reference

### Contract Events

```solidity
event SessionCreated(
    uint256 indexed sessionId,
    string name,
    address indexed creator,
    uint256 startTime,
    uint256 endTime,
    uint256 minPrediction,
    uint256 maxPrediction
);

event OptionAdded(
    uint256 indexed sessionId,
    uint256 indexed optionId,
    string optionName
);

event PredictionPlaced(
    uint256 indexed sessionId,
    uint256 indexed optionId,
    address indexed predictor,
    uint256 amount
);

event SessionClosed(uint256 indexed sessionId, uint256 timestamp);

event WinnerSelected(
    uint256 indexed sessionId,
    uint256 indexed winningOptionId,
    string optionName
);

event RewardsDistributed(
    uint256 indexed sessionId,
    address indexed winner,
    uint256 amount
);

event SessionDeleted(uint256 indexed sessionId);
```

### Frontend Hooks

```javascript
// Read contract state
const { data: sessionCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'sessionCounter',
});

// Write to contract
const { writeContract } = useWriteContract();
writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'createSession',
    args: [name, endTime, minPrediction, maxPrediction, options],
});

// Wait for transaction
const { isSuccess } = useWaitForTransactionReceipt({ hash });
```

---

## Conclusion

This architecture provides a secure, scalable foundation for a prediction market dApp on Base Network. The separation of concerns between smart contract logic and frontend presentation allows for independent scaling and updates. Security is prioritized through OpenZeppelin contracts, proper access control, and input validation at both layers.

For production deployment, consider adding:
- Event indexer for improved query performance
- Rate limiting on frontend API calls
- Analytics and monitoring
- Multi-signature wallet for platform fee collection
