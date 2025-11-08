import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSessions } from './hooks/useSessions'
import { useNotification } from './hooks/useNotification'
import { applyFilters, getEmptyStateMessage } from './utils/sessionFilters'
import CreateSessionModal from './components/CreateSessionModal'
import SessionCard from './components/SessionCard'
import PredictModal from './components/PredictModal'
import UserDashboard from './components/UserDashboard'
import './App.css'

const TABS = {
  ALL: 'all',
  MY_PREDICTIONS: 'my-predictions',
  CREATOR: 'creator',
  DASHBOARD: 'dashboard',
}

const AUTO_REFRESH_DELAY = 3000 // 3 seconds

function App() {
  const { address, isConnected } = useAccount()

  // State management
  const [activeTab, setActiveTab] = useState(TABS.ALL)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showPredictModal, setShowPredictModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Custom hooks
  const { sessions, loading, refreshSessions } = useSessions(address, isConnected)
  const { notification, showNotification } = useNotification()

  // Filtered sessions based on current filters
  const filteredSessions = useMemo(() =>
    applyFilters(sessions, {
      tab: activeTab,
      searchQuery,
      statusFilter,
      userAddress: address,
    }),
    [sessions, activeTab, searchQuery, statusFilter, address]
  )

  // Event handlers
  const handleSessionCreated = async () => {
    setShowCreateModal(false)
    showNotification('Session created successfully! Refreshing in 3 seconds...', 'success')

    setTimeout(async () => {
      await refreshSessions()
      showNotification('Sessions refreshed!', 'success')
    }, AUTO_REFRESH_DELAY)
  }

  const handleManualRefresh = async () => {
    showNotification('Refreshing sessions from blockchain...', 'info')
    await refreshSessions()
  }

  const handlePredictClick = (session) => {
    setSelectedSession(session)
    setShowPredictModal(true)
  }

  const handlePredictionPlaced = async () => {
    setShowPredictModal(false)
    showNotification('Prediction placed successfully!', 'success')

    // Refresh after a short delay
    setTimeout(async () => {
      await refreshSessions()
    }, 1000)
  }

  // Empty state message
  const emptyMessage = getEmptyStateMessage(activeTab, searchQuery, statusFilter)

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🎯 Prediction Pool dApp</h1>
        <ConnectButton />
      </header>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      {!isConnected ? (
        <div className="card">
          <h2>Welcome to Prediction Pool</h2>
          <p>Connect your wallet to start creating or participating in prediction pools!</p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs and Refresh Button */}
          <div className="top-bar">
            <nav className="nav-tabs">
              <button
                className={`tab-button ${activeTab === TABS.ALL ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.ALL)}
              >
                All Sessions
              </button>
              <button
                className={`tab-button ${activeTab === TABS.MY_PREDICTIONS ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.MY_PREDICTIONS)}
              >
                My Predictions
              </button>
              <button
                className={`tab-button ${activeTab === TABS.CREATOR ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.CREATOR)}
              >
                My Sessions
              </button>
              <button
                className={`tab-button ${activeTab === TABS.DASHBOARD ? 'active' : ''}`}
                onClick={() => setActiveTab(TABS.DASHBOARD)}
              >
                Dashboard
              </button>
            </nav>

            <button
              className="button button-secondary"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Dashboard Tab */}
          {activeTab === TABS.DASHBOARD ? (
            <UserDashboard sessions={sessions} />
          ) : (
            <>
              {/* Search and Filter (not shown on creator tab) */}
              {activeTab !== TABS.CREATOR && (
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

              {/* Create Session Button (only on creator tab) */}
              {activeTab === TABS.CREATOR && (
                <button
                  className="button button-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginBottom: '1.5rem' }}
                >
                  + Create New Session
                </button>
              )}

              {/* Sessions List */}
              {loading ? (
                <div className="loading">Loading sessions...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="card">
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                <div className="session-grid">
                  {filteredSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      userAddress={address}
                      onPredict={handlePredictClick}
                      onRefresh={refreshSessions}
                      showNotification={showNotification}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
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
