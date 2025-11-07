const hre = require("hardhat");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n🚀 Quick Deployment Script for Prediction Pool\n");

  // Check environment
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'your_private_key_here') {
    console.log("❌ Error: PRIVATE_KEY not set in .env file");
    console.log("\nPlease edit .env file and add your private key:");
    console.log("PRIVATE_KEY=your_actual_private_key\n");
    process.exit(1);
  }

  // Get network
  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);

  // USDC addresses
  const USDC_ADDRESSES = {
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };

  const usdcAddress = USDC_ADDRESSES[network];

  if (!usdcAddress) {
    console.log(`❌ Error: No USDC address configured for network: ${network}`);
    process.exit(1);
  }

  console.log(`💵 USDC Address: ${usdcAddress}\n`);

  // Confirm deployment
  const confirm = await question(`Deploy to ${network}? (yes/no): `);

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log("\n❌ Deployment cancelled\n");
    rl.close();
    process.exit(0);
  }

  console.log("\n⏳ Deploying contract...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.log("❌ Error: Insufficient balance for deployment");
    console.log("\nGet testnet ETH from:");
    console.log("- Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet\n");
    rl.close();
    process.exit(1);
  }

  // Deploy
  const PredictionPool = await hre.ethers.getContractFactory("PredictionPool");
  const predictionPool = await PredictionPool.deploy(usdcAddress);

  await predictionPool.waitForDeployment();

  const contractAddress = await predictionPool.getAddress();

  console.log("✅ Contract deployed successfully!\n");
  console.log("📋 Contract Details:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Network: ${network}`);
  console.log(`   USDC: ${usdcAddress}`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // Wait for confirmations
  console.log("⏳ Waiting for block confirmations...");
  await predictionPool.deploymentTransaction().wait(3);
  console.log("✅ Confirmed!\n");

  // Verify
  if (network !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("⏳ Verifying contract on BaseScan (via Etherscan)...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [usdcAddress],
      });
      console.log("✅ Contract verified!\n");
    } catch (error) {
      console.log("⚠️  Verification failed (you can verify manually later)\n");
      console.log(`Error: ${error.message}\n`);
    }
  }

  // Save deployment info
  const fs = require("fs");
  const path = require("path");

  const deploymentInfo = {
    network,
    contractAddress,
    usdcAddress,
    deploymentTime: new Date().toISOString(),
    deployer: deployer.address,
    transactionHash: predictionPool.deploymentTransaction().hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const latestFile = path.join(deploymentsDir, `${network}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("1. Update frontend/src/contractConfig.js:");
  console.log(`   export const CONTRACT_ADDRESS = "${contractAddress}"\n`);
  console.log("2. Update frontend/src/wagmi.js with WalletConnect Project ID\n");
  console.log("3. Test the dApp:");
  console.log("   cd frontend && npm run dev\n");
  console.log("4. View on BaseScan:");
  const explorerUrl = network === 'base'
    ? `https://basescan.org/address/${contractAddress}`
    : `https://sepolia.basescan.org/address/${contractAddress}`;
  console.log(`   ${explorerUrl}\n`);
  console.log("=".repeat(60));
  console.log(`\n💾 Deployment info saved to: ${latestFile}\n`);

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    rl.close();
    process.exit(1);
  });
