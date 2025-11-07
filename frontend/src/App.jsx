import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractConfig'
import CreateSessionModal from './components/CreateSessionModal'
import SessionCard from './components/SessionCard'
import PredictModal from './components/PredictModal'
import UserDashboard from './components/UserDashboard'

function App() {
  const { address, isConnected, chain } = useAccount()
  const [activeTab, setActiveTab] = useState('all') // all, my-predictions, creator, dashboard
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showPredictModal, setShowPredictModal] = useState(false)
  const [notification, setNotification] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, closed

  // Read session counter - disable caching to get fresh data
  const { data: sessionCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'sessionCounter',
    query: {
      gcTime: 0, // Don't cache the data
      staleTime: 0, // Always consider data stale
    }
  })

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const loadSessions = useCallback(async () => {
    console.log('=== loadSessions called ===')
    setLoading(true)
    try {
      const sessionsData = []
      const count = Number(sessionCounter)
      console.log('SessionCounter value in loadSessions:', sessionCounter?.toString())
      console.log('Loading sessions, total count:', count)

      if (count === 0) {
        console.log('⚠️ SessionCounter is 0, no sessions to load')
        setSessions([])
        setLoading(false)
        return
      }

      // Check if ethereum provider is available
      if (!window.ethereum) {
        console.error('No ethereum provider found')
        setSessions([])
        setLoading(false)
        return
      }

      // Query the contract directly to double-check sessionCounter
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const onChainCounter = await contract.sessionCounter()
      console.log('On-chain sessionCounter (via ethers):', onChainCounter.toString())

      for (let i = 1; i <= count; i++) {
        try {
          const details = await contract.getSessionDetails(i)
          console.log(`✅ Loaded session ${i}:`, details.name)

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
      // Only show error notification for critical errors
      if (error.code !== 'ACTION_REJECTED') {
        console.error('Critical error loading sessions:', error.message)
      }
      // Set empty sessions array on error
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [sessionCounter, address, showNotification])

  // Load all sessions when sessionCounter changes
  useEffect(() => {
    if (sessionCounter) {
      console.log('Session counter:', sessionCounter?.toString())
      loadSessions()
    }
  }, [sessionCounter, loadSessions])

  const handleSessionCreated = () => {
    setShowCreateModal(false)
    showNotification('Session created successfully!', 'success')
  }

  const handlePredictClick = (session) => {
    setSelectedSession(session)
    setShowPredictModal(true)
  }

  const handlePredictionPlaced = async () => {
    setShowPredictModal(false)
    showNotification('Prediction placed successfully!', 'success')
    // Add a small delay to ensure blockchain state is updated
    setTimeout(() => {
      loadSessions()
    }, 1000)
  }

  const filterSessions = () => {
    let filtered = sessions

    // Filter by tab
    if (activeTab === 'my-predictions') {
      filtered = filtered.filter(s => s.userPredictions.length > 0)
    } else if (activeTab === 'creator') {
      filtered = filtered.filter(s => s.creator.toLowerCase() === address?.toLowerCase())
    } else if (activeTab === 'dashboard') {
      return filtered // Dashboard handles its own filtering
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.options.some(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(s => s.status === 0)
      } else if (statusFilter === 'closed') {
        filtered = filtered.filter(s => s.status === 1 || s.status === 2)
      }
    }

    return filtered
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
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <UserDashboard sessions={sessions} />
          ) : (
            <>
              {/* Search and Filter */}
              {activeTab !== 'creator' && (
                <div className="search-filter-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search sessions by name or option..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="filter-buttons">
                    <button
                      className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </button>
                    <button
                      className={`filter-button ${statusFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('active')}
                    >
                      Active
                    </button>
                    <button
                      className={`filter-button ${statusFilter === 'closed' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('closed')}
                    >
                      Closed
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'creator' && (
                <button
                  className="button button-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginBottom: '1.5rem' }}
                >
                  + Create New Session
                </button>
              )}

              {loading ? (
                <div className="loading">Loading sessions...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="card">
                  <p>
                    {activeTab === 'all' && (searchQuery || statusFilter !== 'all') && 'No sessions match your filters.'}
                    {activeTab === 'all' && !searchQuery && statusFilter === 'all' && 'No prediction sessions yet. Create the first one!'}
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
