const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PredictionPool", function () {
  let predictionPool;
  let usdcToken;
  let owner;
  let creator;
  let user1;
  let user2;
  let user3;

  const INITIAL_BALANCE = ethers.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy a mock ERC20 token to simulate USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdcToken.waitForDeployment();

    // Mint USDC to test accounts
    await usdcToken.mint(creator.address, INITIAL_BALANCE);
    await usdcToken.mint(user1.address, INITIAL_BALANCE);
    await usdcToken.mint(user2.address, INITIAL_BALANCE);
    await usdcToken.mint(user3.address, INITIAL_BALANCE);

    // Deploy PredictionPool
    const PredictionPool = await ethers.getContractFactory("PredictionPool");
    predictionPool = await PredictionPool.deploy(await usdcToken.getAddress());
    await predictionPool.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      expect(await predictionPool.usdcToken()).to.equal(await usdcToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await predictionPool.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct platform fee", async function () {
      expect(await predictionPool.platformFee()).to.equal(100); // 1%
    });
  });

  describe("Session Creation", function () {
    it("Should create a new session successfully", async function () {
      const endTime = (await time.latest()) + 86400; // 1 day from now
      const minPrediction = ethers.parseUnits("10", 6); // 10 USDC
      const maxPrediction = ethers.parseUnits("1000", 6); // 1000 USDC
      const options = ["Option A", "Option B", "Option C"];

      const tx = await predictionPool
        .connect(creator)
        .createSession("Test Prediction", endTime, minPrediction, maxPrediction, options);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(predictionPool, "SessionCreated")
        .withArgs(1, "Test Prediction", creator.address, block.timestamp, endTime, minPrediction, maxPrediction);

      const sessionDetails = await predictionPool.getSessionDetails(1);
      expect(sessionDetails.name).to.equal("Test Prediction");
      expect(sessionDetails.creator).to.equal(creator.address);
      expect(sessionDetails.optionCount).to.equal(3);
    });

    it("Should fail to create session with empty name", async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await expect(
        predictionPool.connect(creator).createSession("", endTime, minPrediction, maxPrediction, ["A", "B"])
      ).to.be.revertedWith("Session name cannot be empty");
    });

    it("Should fail to create session with less than 2 options", async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await expect(
        predictionPool.connect(creator).createSession("Test", endTime, minPrediction, maxPrediction, ["A"])
      ).to.be.revertedWith("Must have at least 2 options");
    });

    it("Should fail to create session with past end time", async function () {
      const endTime = (await time.latest()) - 86400; // 1 day ago
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await expect(
        predictionPool.connect(creator).createSession("Test", endTime, minPrediction, maxPrediction, ["A", "B"])
      ).to.be.revertedWith("End time must be in the future");
    });
  });

  describe("Place Predictions", function () {
    let sessionId;
    const minPrediction = ethers.parseUnits("10", 6);
    const maxPrediction = ethers.parseUnits("1000", 6);

    beforeEach(async function () {
      const endTime = (await time.latest()) + 86400;
      const tx = await predictionPool
        .connect(creator)
        .createSession("Test Prediction", endTime, minPrediction, maxPrediction, ["Team A", "Team B"]);
      const receipt = await tx.wait();
      sessionId = 1;
    });

    it("Should allow user to place a prediction", async function () {
      const amount = ethers.parseUnits("100", 6); // 100 USDC

      // Approve USDC
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);

      await expect(predictionPool.connect(user1).placePrediction(sessionId, 0, amount))
        .to.emit(predictionPool, "PredictionPlaced")
        .withArgs(sessionId, 0, user1.address, amount);

      const userPrediction = await predictionPool.getUserPrediction(sessionId, user1.address, 0);
      expect(userPrediction).to.equal(amount);
    });

    it("Should update total pool correctly", async function () {
      const amount1 = ethers.parseUnits("100", 6);
      const amount2 = ethers.parseUnits("200", 6);

      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount1);
      await usdcToken.connect(user2).approve(await predictionPool.getAddress(), amount2);

      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount1);
      await predictionPool.connect(user2).placePrediction(sessionId, 1, amount2);

      const sessionDetails = await predictionPool.getSessionDetails(sessionId);
      expect(sessionDetails.totalPool).to.equal(amount1 + amount2);
    });

    it("Should fail if amount is below minimum", async function () {
      const amount = ethers.parseUnits("5", 6); // Below 10 USDC minimum

      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);

      await expect(
        predictionPool.connect(user1).placePrediction(sessionId, 0, amount)
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should fail if amount is above maximum", async function () {
      const amount = ethers.parseUnits("2000", 6); // Above 1000 USDC maximum

      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);

      await expect(
        predictionPool.connect(user1).placePrediction(sessionId, 0, amount)
      ).to.be.revertedWith("Amount above maximum");
    });

    it("Should fail if session is closed", async function () {
      await predictionPool.connect(creator).closeSession(sessionId);

      const amount = ethers.parseUnits("100", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);

      await expect(
        predictionPool.connect(user1).placePrediction(sessionId, 0, amount)
      ).to.be.revertedWith("Session is not active");
    });
  });

  describe("Session Management", function () {
    let sessionId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await predictionPool
        .connect(creator)
        .createSession("Test Prediction", endTime, minPrediction, maxPrediction, ["A", "B"]);
      sessionId = 1;
    });

    it("Should allow creator to close session", async function () {
      const tx = await predictionPool.connect(creator).closeSession(sessionId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(predictionPool, "SessionClosed")
        .withArgs(sessionId, block.timestamp);

      const sessionDetails = await predictionPool.getSessionDetails(sessionId);
      expect(sessionDetails.status).to.equal(1); // SessionStatus.Closed
    });

    it("Should fail if non-creator tries to close session", async function () {
      await expect(predictionPool.connect(user1).closeSession(sessionId)).to.be.revertedWith(
        "Only session creator can perform this action"
      );
    });

    it("Should allow creator to select winner after closing", async function () {
      // Place some predictions first
      const amount = ethers.parseUnits("100", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount);

      await predictionPool.connect(creator).closeSession(sessionId);

      await expect(predictionPool.connect(creator).selectWinner(sessionId, 0))
        .to.emit(predictionPool, "WinnerSelected")
        .withArgs(sessionId, 0, "A");

      const sessionDetails = await predictionPool.getSessionDetails(sessionId);
      expect(sessionDetails.winnerSelected).to.be.true;
      expect(sessionDetails.winningOptionId).to.equal(0);
    });

    it("Should allow creator to delete session with no predictions", async function () {
      await expect(predictionPool.connect(creator).deleteSession(sessionId))
        .to.emit(predictionPool, "SessionDeleted")
        .withArgs(sessionId);
    });

    it("Should fail to delete session with predictions", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount);

      await expect(predictionPool.connect(creator).deleteSession(sessionId)).to.be.revertedWith(
        "Cannot delete session with predictions"
      );
    });
  });

  describe("Reward Distribution", function () {
    let sessionId;

    beforeEach(async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await predictionPool
        .connect(creator)
        .createSession("Test Prediction", endTime, minPrediction, maxPrediction, ["Team A", "Team B"]);
      sessionId = 1;
    });

    it("Should distribute rewards correctly to winners", async function () {
      // User1 bets 100 USDC on Team A
      // User2 bets 200 USDC on Team B
      // User3 bets 100 USDC on Team A
      // Total: 400 USDC
      // Team A wins with 200 USDC total
      // After 1% fee: 396 USDC to distribute
      // User1 should get: 396 * 100/200 = 198 USDC
      // User3 should get: 396 * 100/200 = 198 USDC

      const amount1 = ethers.parseUnits("100", 6);
      const amount2 = ethers.parseUnits("200", 6);
      const amount3 = ethers.parseUnits("100", 6);

      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount1);
      await usdcToken.connect(user2).approve(await predictionPool.getAddress(), amount2);
      await usdcToken.connect(user3).approve(await predictionPool.getAddress(), amount3);

      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount1);
      await predictionPool.connect(user2).placePrediction(sessionId, 1, amount2);
      await predictionPool.connect(user3).placePrediction(sessionId, 0, amount3);

      // Close session and select winner
      await predictionPool.connect(creator).closeSession(sessionId);
      await predictionPool.connect(creator).selectWinner(sessionId, 0);

      // Get initial balances
      const initialBalance1 = await usdcToken.balanceOf(user1.address);
      const initialBalance3 = await usdcToken.balanceOf(user3.address);

      // Claim rewards
      await predictionPool.connect(user1).claimRewards(sessionId);
      await predictionPool.connect(user3).claimRewards(sessionId);

      // Check balances
      const finalBalance1 = await usdcToken.balanceOf(user1.address);
      const finalBalance3 = await usdcToken.balanceOf(user3.address);

      const reward1 = finalBalance1 - initialBalance1;
      const reward3 = finalBalance3 - initialBalance3;

      // Each should receive approximately 198 USDC (half of 396)
      expect(reward1).to.equal(ethers.parseUnits("198", 6));
      expect(reward3).to.equal(ethers.parseUnits("198", 6));
    });

    it("Should fail if user tries to claim without winning", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount);

      await predictionPool.connect(creator).closeSession(sessionId);
      await predictionPool.connect(creator).selectWinner(sessionId, 1); // User1 bet on 0

      await expect(predictionPool.connect(user1).claimRewards(sessionId)).to.be.revertedWith(
        "No winning prediction"
      );
    });

    it("Should fail if user tries to claim twice", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(sessionId, 0, amount);

      await predictionPool.connect(creator).closeSession(sessionId);
      await predictionPool.connect(creator).selectWinner(sessionId, 0);

      await predictionPool.connect(user1).claimRewards(sessionId);

      await expect(predictionPool.connect(user1).claimRewards(sessionId)).to.be.revertedWith("Already claimed");
    });
  });

  describe("Platform Fees", function () {
    it("Should collect platform fees correctly", async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await predictionPool
        .connect(creator)
        .createSession("Test", endTime, minPrediction, maxPrediction, ["A", "B"]);

      const amount = ethers.parseUnits("1000", 6); // 1000 USDC total
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(1, 0, amount);

      await predictionPool.connect(creator).closeSession(1);
      await predictionPool.connect(creator).selectWinner(1, 0);
      await predictionPool.connect(user1).claimRewards(1);

      // Expected fee: 1000 * 1% = 10 USDC
      const collectedFees = await predictionPool.collectedFees();
      expect(collectedFees).to.equal(ethers.parseUnits("10", 6));
    });

    it("Should allow owner to withdraw fees", async function () {
      const endTime = (await time.latest()) + 86400;
      const minPrediction = ethers.parseUnits("10", 6);
      const maxPrediction = ethers.parseUnits("1000", 6);

      await predictionPool
        .connect(creator)
        .createSession("Test", endTime, minPrediction, maxPrediction, ["A", "B"]);

      const amount = ethers.parseUnits("1000", 6);
      await usdcToken.connect(user1).approve(await predictionPool.getAddress(), amount);
      await predictionPool.connect(user1).placePrediction(1, 0, amount);

      await predictionPool.connect(creator).closeSession(1);
      await predictionPool.connect(creator).selectWinner(1, 0);
      await predictionPool.connect(user1).claimRewards(1);

      const initialBalance = await usdcToken.balanceOf(owner.address);
      await predictionPool.connect(owner).withdrawFees();
      const finalBalance = await usdcToken.balanceOf(owner.address);

      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("10", 6));
    });

    it("Should allow owner to update platform fee", async function () {
      await predictionPool.connect(owner).updatePlatformFee(200); // 2%
      expect(await predictionPool.platformFee()).to.equal(200);
    });

    it("Should fail if non-owner tries to withdraw fees", async function () {
      await expect(predictionPool.connect(user1).withdrawFees()).to.be.revertedWithCustomError(
        predictionPool,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
