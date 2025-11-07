import { useState, useEffect } from 'react'
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
  const [refreshKey, setRefreshKey] = useState(0) // Force refresh key

  // Read session counter with refetch interval
  const { data: sessionCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'sessionCounter',
  })

  // Load all sessions when sessionCounter or refreshKey changes
  useEffect(() => {
    if (sessionCounter) {
      console.log('Session counter:', sessionCounter?.toString())
      loadSessions()
    }
  }, [sessionCounter, address, refreshKey])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const sessionsData = []
      const count = Number(sessionCounter)
      console.log('Loading sessions, total count:', count)

      for (let i = 1; i <= count; i++) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

          const details = await contract.getSessionDetails(i)
          console.log(`Loaded session ${i}:`, details.name)

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
    showNotification('Session created successfully! Click Refresh to see it.', 'success')
  }

  const forceRefresh = async () => {
    console.log('Force refresh triggered')
    showNotification('Refreshing sessions...', 'info')
    await refetchCounter()
    setRefreshKey(prev => prev + 1)
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="nav-tabs" style={{ marginBottom: 0 }}>
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
            <button
              className="button button-secondary"
              onClick={forceRefresh}
              disabled={loading}
              style={{ padding: '0.5rem 1rem' }}
            >
              {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
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
