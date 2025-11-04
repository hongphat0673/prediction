const hre = require("hardhat");

async function main() {
  console.log("Deploying PredictionPool contract to", hre.network.name);

  // USDC addresses on different networks
  const USDC_ADDRESSES = {
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    hardhat: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // placeholder
  };

  const usdcAddress = USDC_ADDRESSES[hre.network.name] || process.env.USDC_ADDRESS;

  if (!usdcAddress) {
    throw new Error(`USDC address not configured for network: ${hre.network.name}`);
  }

  console.log("Using USDC address:", usdcAddress);

  // Get the contract factory
  const PredictionPool = await hre.ethers.getContractFactory("PredictionPool");

  // Deploy the contract
  console.log("Deploying contract...");
  const predictionPool = await PredictionPool.deploy(usdcAddress);

  await predictionPool.waitForDeployment();

  const contractAddress = await predictionPool.getAddress();

  console.log("PredictionPool deployed to:", contractAddress);
  console.log("Deployment transaction:", predictionPool.deploymentTransaction().hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await predictionPool.deploymentTransaction().wait(5);

  // Verify the contract on BaseScan if not on hardhat network
  if (hre.network.name !== "hardhat" && process.env.BASESCAN_API_KEY) {
    console.log("Verifying contract on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [usdcAddress],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    usdcAddress: usdcAddress,
    deploymentTime: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address,
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("==========================\n");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
