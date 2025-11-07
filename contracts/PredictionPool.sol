// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionPool
 * @dev Smart contract for decentralized prediction pools on Base network
 */
contract PredictionPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;

    enum SessionStatus {
        Active,
        Closed,
        Distributed
    }

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
        mapping(address => mapping(uint256 => uint256)) userPredictions; // user => optionId => amount
        mapping(address => bool) hasClaimed;
    }

    uint256 public sessionCounter;
    mapping(uint256 => Session) public sessions;

    // Platform fee (1% = 100 basis points)
    uint256 public platformFee = 100; // 1%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public collectedFees;

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

    modifier onlySessionCreator(uint256 sessionId) {
        require(
            sessions[sessionId].creator == msg.sender,
            "Only session creator can perform this action"
        );
        _;
    }

    modifier sessionExists(uint256 sessionId) {
        require(sessionId > 0 && sessionId <= sessionCounter, "Session does not exist");
        _;
    }

    modifier sessionActive(uint256 sessionId) {
        require(
            sessions[sessionId].status == SessionStatus.Active,
            "Session is not active"
        );
        require(block.timestamp < sessions[sessionId].endTime, "Session has ended");
        _;
    }

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @dev Create a new prediction session with options
     * @param name Name of the prediction session
     * @param endTime Unix timestamp for when predictions close
     * @param minPrediction Minimum prediction amount in USDC (with 6 decimals)
     * @param maxPrediction Maximum prediction amount in USDC (with 6 decimals)
     * @param optionNames Array of option names for this prediction
     */
    function createSession(
        string memory name,
        uint256 endTime,
        uint256 minPrediction,
        uint256 maxPrediction,
        string[] memory optionNames
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Session name cannot be empty");
        require(endTime > block.timestamp, "End time must be in the future");
        require(minPrediction > 0, "Min prediction must be greater than 0");
        require(maxPrediction >= minPrediction, "Max must be >= min");
        require(optionNames.length >= 2, "Must have at least 2 options");

        sessionCounter++;
        uint256 sessionId = sessionCounter;

        Session storage newSession = sessions[sessionId];
        newSession.id = sessionId;
        newSession.name = name;
        newSession.creator = msg.sender;
        newSession.startTime = block.timestamp;
        newSession.endTime = endTime;
        newSession.minPrediction = minPrediction;
        newSession.maxPrediction = maxPrediction;
        newSession.status = SessionStatus.Active;
        newSession.optionCount = optionNames.length;

        for (uint256 i = 0; i < optionNames.length; i++) {
            require(bytes(optionNames[i]).length > 0, "Option name cannot be empty");
            newSession.options[i].name = optionNames[i];
            emit OptionAdded(sessionId, i, optionNames[i]);
        }

        emit SessionCreated(
            sessionId,
            name,
            msg.sender,
            block.timestamp,
            endTime,
            minPrediction,
            maxPrediction
        );

        return sessionId;
    }

    /**
     * @dev Place a prediction on a specific option
     * @param sessionId ID of the prediction session
     * @param optionId ID of the option to predict
     * @param amount Amount of USDC to bet (with 6 decimals)
     */
    function placePrediction(
        uint256 sessionId,
        uint256 optionId,
        uint256 amount
    ) external sessionExists(sessionId) sessionActive(sessionId) nonReentrant {
        Session storage session = sessions[sessionId];

        require(optionId < session.optionCount, "Invalid option ID");
        require(amount >= session.minPrediction, "Amount below minimum");
        require(amount <= session.maxPrediction, "Amount above maximum");

        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update session data
        session.totalPool += amount;
        session.userPredictions[msg.sender][optionId] += amount;

        PredictionOption storage option = session.options[optionId];

        // Add user to predictors list if first time predicting this option
        if (session.userPredictions[msg.sender][optionId] == amount) {
            option.predictors.push(msg.sender);
        }

        option.totalAmount += amount;

        emit PredictionPlaced(sessionId, optionId, msg.sender, amount);
    }

    /**
     * @dev Close a prediction session (only creator can close)
     * @param sessionId ID of the session to close
     */
    function closeSession(uint256 sessionId)
        external
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Active, "Session already closed");

        session.status = SessionStatus.Closed;
        emit SessionClosed(sessionId, block.timestamp);
    }

    /**
     * @dev Select the winning option (only creator after closing)
     * @param sessionId ID of the session
     * @param winningOptionId ID of the winning option
     */
    function selectWinner(uint256 sessionId, uint256 winningOptionId)
        external
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Closed, "Session must be closed first");
        require(!session.winnerSelected, "Winner already selected");
        require(winningOptionId < session.optionCount, "Invalid option ID");

        session.winningOptionId = winningOptionId;
        session.winnerSelected = true;

        emit WinnerSelected(
            sessionId,
            winningOptionId,
            session.options[winningOptionId].name
        );
    }

    /**
     * @dev Claim rewards for a winning prediction
     * @param sessionId ID of the session
     */
    function claimRewards(uint256 sessionId)
        external
        sessionExists(sessionId)
        nonReentrant
    {
        Session storage session = sessions[sessionId];
        require(session.winnerSelected, "Winner not selected yet");
        require(!session.hasClaimed[msg.sender], "Already claimed");

        uint256 userPrediction = session.userPredictions[msg.sender][session.winningOptionId];
        require(userPrediction > 0, "No winning prediction");

        session.hasClaimed[msg.sender] = true;

        // Calculate rewards
        PredictionOption storage winningOption = session.options[session.winningOptionId];

        // Calculate platform fee
        uint256 feeAmount = (session.totalPool * platformFee) / FEE_DENOMINATOR;
        uint256 distributionPool = session.totalPool - feeAmount;
        collectedFees += feeAmount;

        // Calculate user's share based on their contribution to winning option
        uint256 userReward = (distributionPool * userPrediction) / winningOption.totalAmount;

        // Transfer rewards
        usdcToken.safeTransfer(msg.sender, userReward);

        emit RewardsDistributed(sessionId, msg.sender, userReward);
    }

    /**
     * @dev Update session details (only creator, only if active and no predictions yet)
     * @param sessionId ID of the session
     * @param name New name
     * @param endTime New end time
     * @param minPrediction New minimum
     * @param maxPrediction New maximum
     */
    function updateSession(
        uint256 sessionId,
        string memory name,
        uint256 endTime,
        uint256 minPrediction,
        uint256 maxPrediction
    ) external sessionExists(sessionId) onlySessionCreator(sessionId) {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Active, "Can only update active sessions");
        require(session.totalPool == 0, "Cannot update session with predictions");
        require(endTime > block.timestamp, "End time must be in the future");
        require(maxPrediction >= minPrediction, "Max must be >= min");

        session.name = name;
        session.endTime = endTime;
        session.minPrediction = minPrediction;
        session.maxPrediction = maxPrediction;
    }

    /**
     * @dev Delete a session (only creator, only if no predictions)
     * @param sessionId ID of the session to delete
     */
    function deleteSession(uint256 sessionId)
        external
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.totalPool == 0, "Cannot delete session with predictions");

        delete sessions[sessionId];
        emit SessionDeleted(sessionId);
    }

    /**
     * @dev Get session details
     */
    function getSessionDetails(uint256 sessionId)
        external
        view
        sessionExists(sessionId)
        returns (
            string memory name,
            address creator,
            uint256 startTime,
            uint256 endTime,
            uint256 minPrediction,
            uint256 maxPrediction,
            SessionStatus status,
            uint256 totalPool,
            uint256 optionCount,
            bool winnerSelected,
            uint256 winningOptionId
        )
    {
        Session storage session = sessions[sessionId];
        return (
            session.name,
            session.creator,
            session.startTime,
            session.endTime,
            session.minPrediction,
            session.maxPrediction,
            session.status,
            session.totalPool,
            session.optionCount,
            session.winnerSelected,
            session.winningOptionId
        );
    }

    /**
     * @dev Get option details
     */
    function getOptionDetails(uint256 sessionId, uint256 optionId)
        external
        view
        sessionExists(sessionId)
        returns (
            string memory name,
            uint256 totalAmount,
            uint256 predictorCount
        )
    {
        Session storage session = sessions[sessionId];
        require(optionId < session.optionCount, "Invalid option ID");

        PredictionOption storage option = session.options[optionId];
        return (option.name, option.totalAmount, option.predictors.length);
    }

    /**
     * @dev Get user's prediction for a specific option
     */
    function getUserPrediction(uint256 sessionId, address user, uint256 optionId)
        external
        view
        sessionExists(sessionId)
        returns (uint256)
    {
        return sessions[sessionId].userPredictions[user][optionId];
    }

    /**
     * @dev Check if user has claimed rewards
     */
    function hasClaimed(uint256 sessionId, address user)
        external
        view
        sessionExists(sessionId)
        returns (bool)
    {
        return sessions[sessionId].hasClaimed[user];
    }

    /**
     * @dev Withdraw collected platform fees (only owner)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        require(collectedFees > 0, "No fees to withdraw");
        uint256 amount = collectedFees;
        collectedFees = 0;
        usdcToken.safeTransfer(owner(), amount);
    }

    /**
     * @dev Update platform fee (only owner)
     * @param newFee New fee in basis points (100 = 1%)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = newFee;
    }

    /**
     * @dev Emergency withdraw function for session creator
     * Allows creator to refund all participants if something goes wrong
     * Can only be called if winner hasn't been selected yet
     * @param sessionId ID of the session to withdraw from
     */
    function emergencyWithdraw(uint256 sessionId)
        external
        sessionExists(sessionId)
        onlySessionCreator(sessionId)
        nonReentrant
    {
        Session storage session = sessions[sessionId];
        require(!session.winnerSelected, "Cannot withdraw after winner selected");
        require(session.totalPool > 0, "No funds to withdraw");

        uint256 totalPool = session.totalPool;

        // Mark session as distributed to prevent further actions
        session.status = SessionStatus.Distributed;

        // Refund all participants proportionally
        for (uint256 i = 0; i < session.optionCount; i++) {
            PredictionOption storage option = session.options[i];
            address[] memory predictors = option.predictors;

            for (uint256 j = 0; j < predictors.length; j++) {
                address predictor = predictors[j];
                uint256 userAmount = session.userPredictions[predictor][i];

                if (userAmount > 0 && !session.hasClaimed[predictor]) {
                    session.hasClaimed[predictor] = true;
                    usdcToken.safeTransfer(predictor, userAmount);
                }
            }
        }

        emit SessionClosed(sessionId, block.timestamp);
    }

    /**
     * @dev Calculate potential winnings for a user in a specific session
     * @param sessionId ID of the session
     * @param user Address of the user
     * @param optionId Option ID to calculate winnings for
     * @return Potential winnings if this option wins
     */
    function calculatePotentialWinnings(
        uint256 sessionId,
        address user,
        uint256 optionId
    ) external view sessionExists(sessionId) returns (uint256) {
        Session storage session = sessions[sessionId];

        if (session.totalPool == 0) return 0;

        uint256 userPrediction = session.userPredictions[user][optionId];
        if (userPrediction == 0) return 0;

        PredictionOption storage option = session.options[optionId];
        if (option.totalAmount == 0) return 0;

        // Calculate potential winnings
        uint256 feeAmount = (session.totalPool * platformFee) / FEE_DENOMINATOR;
        uint256 distributionPool = session.totalPool - feeAmount;

        return (distributionPool * userPrediction) / option.totalAmount;
    }

    /**
     * @dev Get all user predictions for a session
     * @param sessionId ID of the session
     * @param user Address of the user
     * @return Array of prediction amounts for each option
     */
    function getUserPredictions(uint256 sessionId, address user)
        external
        view
        sessionExists(sessionId)
        returns (uint256[] memory)
    {
        Session storage session = sessions[sessionId];
        uint256[] memory predictions = new uint256[](session.optionCount);

        for (uint256 i = 0; i < session.optionCount; i++) {
            predictions[i] = session.userPredictions[user][i];
        }

        return predictions;
    }

    /**
     * @dev Get total amount user has bet in a session
     * @param sessionId ID of the session
     * @param user Address of the user
     * @return Total amount bet by user
     */
    function getUserTotalPrediction(uint256 sessionId, address user)
        external
        view
        sessionExists(sessionId)
        returns (uint256)
    {
        Session storage session = sessions[sessionId];
        uint256 total = 0;

        for (uint256 i = 0; i < session.optionCount; i++) {
            total += session.userPredictions[user][i];
        }

        return total;
    }
}
