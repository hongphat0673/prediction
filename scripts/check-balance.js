const hre = require("hardhat");

async function main() {
  console.log("Checking wallet balance on", hre.network.name);
  console.log("Network Chain ID:", hre.network.config.chainId);

  const [deployer] = await hre.ethers.getSigners();
  const address = await deployer.getAddress();

  console.log("\n📍 Wallet Address:", address);

  const balance = await hre.ethers.provider.getBalance(address);
  const balanceInEth = hre.ethers.formatEther(balance);

  console.log("💰 Balance:", balanceInEth, "ETH");

  // Estimate if balance is sufficient for deployment
  const estimatedGasForDeployment = 3000000n; // ~3M gas
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  const estimatedCost = estimatedGasForDeployment * gasPrice;
  const estimatedCostInEth = hre.ethers.formatEther(estimatedCost);

  console.log("\n⛽ Current Gas Price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("📊 Estimated Deployment Cost:", estimatedCostInEth, "ETH");

  if (balance > estimatedCost * 2n) {
    console.log("✅ Sufficient balance for deployment");
  } else if (balance > estimatedCost) {
    console.log("⚠️  Balance is close to estimated cost. Consider adding more ETH.");
  } else {
    console.log("❌ Insufficient balance for deployment. Please add more ETH.");
  }

  // Check USDC balance
  if (hre.network.name === "base" || hre.network.name === "baseSepolia") {
    const USDC_ADDRESSES = {
      base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    };

    const usdcAddress = USDC_ADDRESSES[hre.network.name];

    try {
      const USDC_ABI = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];

      const usdc = new hre.ethers.Contract(usdcAddress, USDC_ABI, deployer);
      const usdcBalance = await usdc.balanceOf(address);
      const decimals = await usdc.decimals();
      const symbol = await usdc.symbol();

      const formattedBalance = hre.ethers.formatUnits(usdcBalance, decimals);
      console.log(`\n💵 ${symbol} Balance:`, formattedBalance, symbol);
    } catch (error) {
      console.log("\n⚠️  Could not fetch USDC balance:", error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
