import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'
import { ethers } from 'ethers'

function SessionCard({ session, userAddress, onPredict, onRefresh, showNotification }) {
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [showWinnerSelect, setShowWinnerSelect] = useState(false)

  const { data: closeHash, writeContract: closeSession } = useWriteContract()
  const { data: winnerHash, writeContract: selectWinner } = useWriteContract()
  const { data: claimHash, writeContract: claimRewards } = useWriteContract()
  const { data: deleteHash, writeContract: deleteSession } = useWriteContract()

  const { isSuccess: closeSuccess } = useWaitForTransactionReceipt({ hash: closeHash })
  const { isSuccess: winnerSuccess } = useWaitForTransactionReceipt({ hash: winnerHash })
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimHash })
  const { isSuccess: deleteSuccess } = useWaitForTransactionReceipt({ hash: deleteHash })

  // Refresh when transactions succeed
  useEffect(() => {
    if (closeSuccess || winnerSuccess || claimSuccess || deleteSuccess) {
      onRefresh()
    }
  }, [closeSuccess, winnerSuccess, claimSuccess, deleteSuccess, onRefresh])

  const isCreator = session.creator.toLowerCase() === userAddress?.toLowerCase()
  const isActive = session.status === 0
  const isClosed = session.status === 1
  const hasEnded = Date.now() / 1000 > session.endTime

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatUSDC = (amount) => {
    return ethers.formatUnits(amount, 6)
  }

  const getStatusBadge = () => {
    if (session.status === 0) {
      return <span className="status-badge status-active">Active</span>
    } else if (session.status === 1) {
      return <span className="status-badge status-closed">Closed</span>
    } else {
      return <span className="status-badge status-distributed">Distributed</span>
    }
  }

  const handleClose = () => {
    closeSession({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'closeSession',
      args: [BigInt(session.id)],
    })
  }

  const handleSelectWinner = () => {
    if (selectedWinner === null) {
      showNotification('Please select a winning option', 'error')
      return
    }

    selectWinner({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'selectWinner',
      args: [BigInt(session.id), BigInt(selectedWinner)],
    })
  }

  const handleClaim = () => {
    claimRewards({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'claimRewards',
      args: [BigInt(session.id)],
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSession({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'deleteSession',
        args: [BigInt(session.id)],
      })
    }
  }

  const canUserClaim = () => {
    if (!session.winnerSelected) return false

    const winningPrediction = session.userPredictions.find(
      p => p.optionId === session.winningOptionId
    )
    return winningPrediction && Number(winningPrediction.amount) > 0
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${session.id}`
    const shareText = `Check out this prediction: "${session.name}" - Pool: ${formatUSDC(session.totalPool)} USDC`

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: session.name,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if (err.name !== 'AbortError') {
          console.log('Share failed, copying to clipboard')
        }
      }
    }

    // Fall back to clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl)
      showNotification('Link copied to clipboard!', 'success')
    } catch (err) {
      // Final fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showNotification('Link copied to clipboard!', 'success')
    }
  }

  return (
    <div className="session-card">
      <div className="session-header">
        <div>
          <div className="session-title">{session.name}</div>
          {isCreator && <small style={{ color: '#888' }}>Created by you</small>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="share-button"
            onClick={handleShare}
            title="Share this session"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          {getStatusBadge()}
        </div>
      </div>

      <div className="session-info">
        <div>📅 Ends: {formatDate(session.endTime)}</div>
        <div>💰 Pool: {formatUSDC(session.totalPool)} USDC</div>
        <div>📊 Range: {formatUSDC(session.minPrediction)} - {formatUSDC(session.maxPrediction)} USDC</div>
      </div>

      <div className="options-container">
        {session.options.map((option) => (
          <div
            key={option.id}
            className={`option-button ${
              session.winnerSelected && option.id === session.winningOptionId ? 'winner' : ''
            } ${selectedWinner === option.id ? 'selected' : ''}`}
            onClick={() => {
              if (showWinnerSelect) {
                setSelectedWinner(option.id)
              }
            }}
          >
            <div className="option-name">
              {option.name}
              {session.winnerSelected && option.id === session.winningOptionId && ' 🏆'}
            </div>
            <div className="option-stats">
              <span>{formatUSDC(option.totalAmount)} USDC</span>
              <span>{option.predictorCount} predictors</span>
            </div>
            {session.userPredictions.map(p => {
              if (p.optionId === option.id) {
                return (
                  <div key={p.optionId} style={{ fontSize: '0.85rem', color: '#667eea', marginTop: '0.25rem' }}>
                    Your prediction: {formatUSDC(p.amount)} USDC
                  </div>
                )
              }
              return null
            })}
          </div>
        ))}
      </div>

      <div className="session-actions">
        {/* User actions */}
        {!isCreator && isActive && !hasEnded && (
          <button
            className="button button-primary"
            onClick={() => onPredict(session)}
          >
            Place Prediction
          </button>
        )}

        {!isCreator && session.winnerSelected && canUserClaim() && (
          <button
            className="button button-success"
            onClick={handleClaim}
          >
            Claim Rewards
          </button>
        )}

        {/* Creator actions */}
        {isCreator && isActive && (
          <>
            <button
              className="button button-secondary"
              onClick={handleClose}
            >
              Close Session
            </button>
            {session.totalPool === 0n && (
              <button
                className="button button-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </>
        )}

        {isCreator && isClosed && !session.winnerSelected && (
          <>
            {!showWinnerSelect ? (
              <button
                className="button button-success"
                onClick={() => setShowWinnerSelect(true)}
              >
                Select Winner
              </button>
            ) : (
              <>
                <button
                  className="button button-success"
                  onClick={handleSelectWinner}
                  disabled={selectedWinner === null}
                >
                  Confirm Winner
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setShowWinnerSelect(false)
                    setSelectedWinner(null)
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </>
        )}
      </div>

      {showWinnerSelect && (
        <div className="info" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Click on an option above to select the winner
        </div>
      )}
    </div>
  )
}

export default SessionCard
