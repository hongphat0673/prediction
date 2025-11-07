import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'

function UserDashboard({ sessions }) {
  const { address } = useAccount()
  const [stats, setStats] = useState({
    totalBet: '0',
    totalWinnings: '0',
    activePredictions: 0,
    completedPredictions: 0,
    winRate: 0,
    sessions: []
  })

  useEffect(() => {
    if (address && sessions.length > 0) {
      calculateStats()
    }
  }, [address, sessions])

  const calculateStats = async () => {
    try {
      let totalBet = 0n
      let totalWinnings = 0n
      let activePredictions = 0
      let completedPredictions = 0
      let wins = 0
      const userSessions = []

      for (const session of sessions) {
        // Check if user has predictions in this session
        const userPreds = session.userPredictions || []

        if (userPreds.length > 0) {
          const sessionBet = userPreds.reduce((sum, pred) => sum + BigInt(pred.amount), 0n)
          totalBet += sessionBet

          const sessionInfo = {
            id: session.id,
            name: session.name,
            betAmount: sessionBet,
            status: session.status,
            winnerSelected: session.winnerSelected,
            isWinner: false,
            winnings: 0n,
          }

          // Check if session is complete
          if (session.winnerSelected) {
            completedPredictions++

            // Check if user won
            const winningPred = userPreds.find(p => p.optionId === session.winningOptionId)
            if (winningPred && BigInt(winningPred.amount) > 0n) {
              sessionInfo.isWinner = true
              wins++

              // Calculate winnings
              try {
                const provider = new ethers.BrowserProvider(window.ethereum)
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
                const potentialWinnings = await contract.calculatePotentialWinnings(
                  session.id,
                  address,
                  session.winningOptionId
                )
                sessionInfo.winnings = potentialWinnings
                totalWinnings += potentialWinnings
              } catch (err) {
                console.error('Error calculating winnings:', err)
              }
            }
          } else if (session.status === 0) {
            activePredictions++
          }

          userSessions.push(sessionInfo)
        }
      }

      const winRate = completedPredictions > 0 ? (wins / completedPredictions) * 100 : 0

      setStats({
        totalBet: ethers.formatUnits(totalBet, 6),
        totalWinnings: ethers.formatUnits(totalWinnings, 6),
        activePredictions,
        completedPredictions,
        winRate: winRate.toFixed(1),
        sessions: userSessions.sort((a, b) => b.id - a.id), // Sort by newest first
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const formatUSDC = (amount) => {
    if (typeof amount === 'bigint') {
      return ethers.formatUnits(amount, 6)
    }
    return amount
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Active'
      case 1:
        return 'Closed'
      case 2:
        return 'Distributed'
      default:
        return 'Unknown'
    }
  }

  if (!address) {
    return (
      <div className="card">
        <p>Connect your wallet to view your dashboard</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <h2 style={{ marginBottom: '2rem' }}>My Dashboard</h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Bet</div>
          <div className="stat-value">{stats.totalBet} USDC</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Winnings</div>
          <div className="stat-value success-text">{stats.totalWinnings} USDC</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Predictions</div>
          <div className="stat-value">{stats.activePredictions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.completedPredictions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{stats.winRate}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Net Profit</div>
          <div className={`stat-value ${parseFloat(stats.totalWinnings) - parseFloat(stats.totalBet) >= 0 ? 'success-text' : 'error-text'}`}>
            {(parseFloat(stats.totalWinnings) - parseFloat(stats.totalBet)).toFixed(2)} USDC
          </div>
        </div>
      </div>

      {/* Session History */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Prediction History</h3>

        {stats.sessions.length === 0 ? (
          <div className="card">
            <p>You haven't made any predictions yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {stats.sessions.map((session) => (
              <div key={session.id} className="history-item">
                <div className="history-header">
                  <div>
                    <div className="history-title">{session.name}</div>
                    <div className="history-subtitle">Session #{session.id}</div>
                  </div>
                  <div className="history-status">
                    <span className={`status-badge status-${getStatusLabel(session.status).toLowerCase()}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                </div>

                <div className="history-stats">
                  <div className="history-stat">
                    <span className="history-stat-label">Bet Amount:</span>
                    <span className="history-stat-value">{formatUSDC(session.betAmount)} USDC</span>
                  </div>

                  {session.winnerSelected && (
                    <>
                      <div className="history-stat">
                        <span className="history-stat-label">Result:</span>
                        <span className={`history-stat-value ${session.isWinner ? 'success-text' : 'error-text'}`}>
                          {session.isWinner ? '🎉 Won!' : '❌ Lost'}
                        </span>
                      </div>

                      {session.isWinner && (
                        <div className="history-stat">
                          <span className="history-stat-label">Winnings:</span>
                          <span className="history-stat-value success-text">
                            {formatUSDC(session.winnings)} USDC
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
