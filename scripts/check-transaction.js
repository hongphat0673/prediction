const hre = require('hardhat');
const { ethers } = hre;

const CONTRACT_ADDRESS = "0x8EBC4A73788D38D2697B219A2d37e10f7f0BBC92";
const TX_HASH = "0xd5f5df4d84b185041ad84daee59bee743e81ec374d803aa657d60833046d2d0d";

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
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "sessionId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"}
    ],
    "name": "SessionCreated",
    "type": "event"
  }
];

async function main() {
  console.log('🔍 Checking Transaction and Contract State\n');

  // Connect to Base Sepolia
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Alternative: use hardhat's provider
  // const provider = ethers.provider;

  console.log('RPC URL:', rpcUrl);
  console.log('Contract Address:', CONTRACT_ADDRESS);
  console.log('Transaction Hash:', TX_HASH, '\n');

  try {
    // 1. Get transaction receipt
    console.log('📝 Fetching transaction receipt...');
    const receipt = await provider.getTransactionReceipt(TX_HASH);

    if (!receipt) {
      console.log('❌ Transaction not found!');
      return;
    }

    console.log('✅ Transaction Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('   Block Number:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());
    console.log('   From:', receipt.from);
    console.log('   To:', receipt.to);

    // 2. Parse logs to find SessionCreated event
    console.log('\n📋 Events emitted:');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    let sessionCreatedFound = false;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog && parsedLog.name === 'SessionCreated') {
          sessionCreatedFound = true;
          console.log('   ✅ SessionCreated Event:');
          console.log('      - Session ID:', parsedLog.args.sessionId.toString());
          console.log('      - Name:', parsedLog.args.name);
          console.log('      - Creator:', parsedLog.args.creator);
          console.log('      - End Time:', parsedLog.args.endTime.toString());
        }
      } catch (e) {
        // Not a contract event we're interested in
      }
    }

    if (!sessionCreatedFound) {
      console.log('   ⚠️  No SessionCreated event found');
    }

    // 3. Check current sessionCounter on-chain
    console.log('\n🔢 Checking current sessionCounter on-chain...');
    const sessionCounter = await contract.sessionCounter();
    console.log('   Current sessionCounter:', sessionCounter.toString());

    // 4. Try to fetch all sessions
    console.log('\n📊 Fetching all sessions from contract...');
    const count = Number(sessionCounter);

    if (count === 0) {
      console.log('   ⚠️  No sessions found (counter is 0)');
    } else {
      for (let i = 1; i <= count; i++) {
        try {
          const details = await contract.getSessionDetails(i);
          console.log(`   Session ${i}:`);
          console.log(`      - Name: ${details.name}`);
          console.log(`      - Creator: ${details.creator}`);
          console.log(`      - Status: ${details.status}`);
          console.log(`      - End Time: ${new Date(Number(details.endTime) * 1000).toLocaleString()}`);
          console.log(`      - Pool: ${ethers.formatUnits(details.totalPool, 6)} USDC`);
        } catch (err) {
          console.log(`   ❌ Error fetching session ${i}:`, err.message);
        }
      }
    }

    // 5. Check block timestamp
    console.log('\n⏱️  Checking block info...');
    const block = await provider.getBlock(receipt.blockNumber);
    console.log('   Block Timestamp:', new Date(block.timestamp * 1000).toLocaleString());
    console.log('   Current Time:', new Date().toLocaleString());

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
