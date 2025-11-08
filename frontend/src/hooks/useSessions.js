import { useState, useCallback, useEffect } from 'react'
import { useContract } from './useContract'

/**
 * Custom hook for managing prediction sessions
 */
export function useSessions(userAddress, isConnected) {
  const [sessions, setSessions] = useState([])
  const { loading, error, loadAllSessions } = useContract()

  // Load sessions from blockchain
  const refreshSessions = useCallback(async () => {
    if (!isConnected) {
      setSessions([])
      return
    }

    const loadedSessions = await loadAllSessions(userAddress)
    setSessions(loadedSessions)
  }, [isConnected, userAddress, loadAllSessions])

  // Auto-load on mount and when user connects
  useEffect(() => {
    if (isConnected && userAddress) {
      console.log('Wallet connected, loading sessions...')
      refreshSessions()
    }
  }, [isConnected, userAddress, refreshSessions])

  return {
    sessions,
    loading,
    error,
    refreshSessions,
  }
}
