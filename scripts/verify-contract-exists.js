const ethers = require('ethers');

const CONTRACT_ADDRESS = "0xf91100f0C37548EfA3155FC4BACb010a0297fED0";
const RPC_URL = "https://mainnet.base.org";

async function checkContractExists() {
  console.log("🔍 Checking if contract exists on Base Mainnet...\n");
  console.log("Address:", CONTRACT_ADDRESS);
  console.log("Network: Base Mainnet (Chain ID: 8453)\n");

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Get the bytecode at the address
    const code = await provider.getCode(CONTRACT_ADDRESS);

    console.log("Code at address:", code);

    if (code === '0x' || code === '0x0') {
      console.log("\n❌ NO CONTRACT FOUND AT THIS ADDRESS");
      console.log("   This address has no contract deployed.");
      console.log("   You need to deploy the contract first.\n");
      return false;
    } else {
      console.log("\n✅ CONTRACT EXISTS at this address");
      console.log("   Bytecode length:", code.length, "characters\n");
      return true;
    }
  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
    return false;
  }
}

checkContractExists();
