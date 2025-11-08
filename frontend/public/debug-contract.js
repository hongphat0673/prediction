// Debug script to check contract state on Base mainnet
// Run this in browser console or as a standalone script

const CONTRACT_ADDRESS = "0xf91100f0C37548EfA3155FC4BACb010a0297fED0";
const RPC_URL = "https://mainnet.base.org";

const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "sessionCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "sessionId", "type": "uint256"}],
    "name": "getSessionDetails",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "minPrediction", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPrediction", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
      {"internalType": "uint256", "name": "optionCount", "type": "uint256"},
      {"internalType": "bool", "name": "winnerSelected", "type": "bool"},
      {"internalType": "uint256", "name": "winningOptionId", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkContract() {
  console.log("🔍 Checking contract state on Base Mainnet...\n");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("RPC:", RPC_URL);
  console.log("Network: Base Mainnet (Chain ID: 8453)\n");

  try {
    // Check if ethers is available
    if (typeof ethers === 'undefined') {
      console.error("❌ ethers.js not found. Make sure you're running this in the app context.");
      return;
    }

    // Check if wallet is connected
    if (!window.ethereum) {
      console.error("❌ No wallet detected. Please connect MetaMask or another wallet.");
      return;
    }

    // Check network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log("Current Chain ID:", parseInt(chainId, 16));

    if (parseInt(chainId, 16) !== 8453) {
      console.warn("⚠️ WARNING: You're not on Base Mainnet (8453). Current chain:", parseInt(chainId, 16));
      console.log("Please switch to Base Mainnet in your wallet.\n");
    }

    // Connect to contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Check sessionCounter
    console.log("📊 Querying sessionCounter...");
    const counter = await contract.sessionCounter();
    console.log("✅ SessionCounter:", counter.toString(), "\n");

    if (counter.toString() === "0") {
      console.log("⚠️ No sessions have been created yet.");
      console.log("   - If you just created a session, check the transaction on BaseScan");
      console.log("   - Transaction might have failed or is still pending\n");
      return;
    }

    // Load all sessions
    console.log(`📋 Loading ${counter} session(s)...\n`);

    for (let i = 1; i <= Number(counter); i++) {
      try {
        const details = await contract.getSessionDetails(i);
        console.log(`Session ${i}:`);
        console.log("  Name:", details.name);
        console.log("  Creator:", details.creator);
        console.log("  Status:", details.status, details.status === 0 ? "(Active)" : details.status === 1 ? "(Closed)" : "(Deleted)");
        console.log("  End Time:", new Date(Number(details.endTime) * 1000).toLocaleString());
        console.log("  Total Pool:", ethers.formatUnits(details.totalPool, 6), "USDC");
        console.log("  Options:", details.optionCount.toString());
        console.log("  Winner Selected:", details.winnerSelected);
        console.log("");
      } catch (err) {
        console.error(`❌ Error loading session ${i}:`, err.message);
      }
    }

    console.log("✅ Contract check complete!");

  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Message:", error.message);

    if (error.message.includes("could not detect network")) {
      console.log("\n💡 Try refreshing the page and reconnecting your wallet.");
    }
  }
}

// Run the check
checkContract();
