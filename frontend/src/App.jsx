import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESSES, USDC_ABI } from './contractConfig'
import CreateSessionModal from './components/CreateSessionModal'
import SessionCard from './components/SessionCard'
import PredictModal from './components/PredictModal'

function App() {
  const { address, isConnected, chain } = useAccount()
  const [activeTab, setActiveTab] = useState('all') // all, my-predictions, creator
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showPredictModal, setShowPredictModal] = useState(false)
  const [notification, setNotification] = useState(null)

  // Read session counter
  const { data: sessionCounter } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'sessionCounter',
    watch: true,
  })

  // Load all sessions
  useEffect(() => {
    if (sessionCounter) {
      loadSessions()
    }
  }, [sessionCounter, address])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const sessionsData = []
      const count = Number(sessionCounter)

      for (let i = 1; i <= count; i++) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

          const details = await contract.getSessionDetails(i)

          // Load options for this session
          const options = []
          for (let j = 0; j < Number(details.optionCount); j++) {
            const optionDetails = await contract.getOptionDetails(i, j)
            options.push({
              id: j,
              name: optionDetails.name,
              totalAmount: optionDetails.totalAmount,
              predictorCount: Number(optionDetails.predictorCount),
            })
          }

          // Check if user has predictions
          let userPredictions = []
          if (address) {
            for (let j = 0; j < options.length; j++) {
              const prediction = await contract.getUserPrediction(i, address, j)
              if (prediction > 0n) {
                userPredictions.push({
                  optionId: j,
                  amount: prediction,
                })
              }
            }
          }

          sessionsData.push({
            id: i,
            name: details.name,
            creator: details.creator,
            startTime: Number(details.startTime),
            endTime: Number(details.endTime),
            minPrediction: details.minPrediction,
            maxPrediction: details.maxPrediction,
            status: Number(details.status),
            totalPool: details.totalPool,
            optionCount: Number(details.optionCount),
            winnerSelected: details.winnerSelected,
            winningOptionId: Number(details.winningOptionId),
            options,
            userPredictions,
          })
        } catch (err) {
          console.error(`Error loading session ${i}:`, err)
        }
      }

      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading sessions:', error)
      showNotification('Error loading sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSessionCreated = () => {
    setShowCreateModal(false)
    showNotification('Session created successfully!', 'success')
    loadSessions()
  }

  const handlePredictClick = (session) => {
    setSelectedSession(session)
    setShowPredictModal(true)
  }

  const handlePredictionPlaced = () => {
    setShowPredictModal(false)
    showNotification('Prediction placed successfully!', 'success')
    loadSessions()
  }

  const filterSessions = () => {
    if (activeTab === 'all') {
      return sessions
    } else if (activeTab === 'my-predictions') {
      return sessions.filter(s => s.userPredictions.length > 0)
    } else if (activeTab === 'creator') {
      return sessions.filter(s => s.creator.toLowerCase() === address?.toLowerCase())
    }
    return sessions
  }

  const filteredSessions = filterSessions()

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 Prediction Pool dApp</h1>
        <ConnectButton />
      </header>

      {notification && (
        <div className={`${notification.type}`}>
          {notification.message}
        </div>
      )}

      {!isConnected ? (
        <div className="card">
          <h2>Welcome to Prediction Pool</h2>
          <p>Connect your wallet to start creating or participating in prediction pools!</p>
        </div>
      ) : (
        <>
          <div className="nav-tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Sessions
            </button>
            <button
              className={`tab-button ${activeTab === 'my-predictions' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-predictions')}
            >
              My Predictions
            </button>
            <button
              className={`tab-button ${activeTab === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveTab('creator')}
            >
              My Sessions
            </button>
          </div>

          {activeTab === 'creator' && (
            <button
              className="button button-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New Session
            </button>
          )}

          {loading ? (
            <div className="loading">Loading sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="card">
              <p>
                {activeTab === 'all' && 'No prediction sessions yet. Create the first one!'}
                {activeTab === 'my-predictions' && "You haven't made any predictions yet."}
                {activeTab === 'creator' && "You haven't created any sessions yet."}
              </p>
            </div>
          ) : (
            <div className="session-grid">
              {filteredSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userAddress={address}
                  onPredict={handlePredictClick}
                  onRefresh={loadSessions}
                  showNotification={showNotification}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSessionCreated}
          showNotification={showNotification}
        />
      )}

      {showPredictModal && selectedSession && (
        <PredictModal
          session={selectedSession}
          onClose={() => setShowPredictModal(false)}
          onSuccess={handlePredictionPlaced}
          showNotification={showNotification}
        />
      )}
    </div>
  )
}

export default App
