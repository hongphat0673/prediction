import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'

/**
 * Custom hook for interacting with the PredictionPool contract
 * Bypasses wagmi caching to ensure fresh blockchain data
 */
export function useContract() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get contract instance
  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  }, [])

  // Load session counter
  const getSessionCounter = useCallback(async () => {
    try {
      const contract = await getContract()
      const counter = await contract.sessionCounter()
      return Number(counter)
    } catch (err) {
      console.error('Error getting session counter:', err)
      throw err
    }
  }, [getContract])

  // Load single session details
  const getSessionDetails = useCallback(async (sessionId) => {
    try {
      const contract = await getContract()
      const details = await contract.getSessionDetails(sessionId)

      return {
        id: sessionId,
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
      }
    } catch (err) {
      console.error(`Error loading session ${sessionId}:`, err)
      throw err
    }
  }, [getContract])

  // Load options for a session
  const getSessionOptions = useCallback(async (sessionId, optionCount) => {
    const contract = await getContract()
    const options = []

    for (let j = 0; j < optionCount; j++) {
      try {
        const optionDetails = await contract.getOptionDetails(sessionId, j)
        options.push({
          id: j,
          name: optionDetails.name,
          totalAmount: optionDetails.totalAmount,
          predictorCount: Number(optionDetails.predictorCount),
        })
      } catch (err) {
        console.error(`Error loading option ${j} for session ${sessionId}:`, err)
      }
    }

    return options
  }, [getContract])

  // Load user predictions for a session
  const getUserPredictions = useCallback(async (sessionId, userAddress, optionCount) => {
    if (!userAddress) return []

    const contract = await getContract()
    const predictions = []

    for (let j = 0; j < optionCount; j++) {
      try {
        const prediction = await contract.getUserPrediction(sessionId, userAddress, j)
        if (prediction > 0n) {
          predictions.push({
            optionId: j,
            amount: prediction,
          })
        }
      } catch (err) {
        console.error(`Error loading prediction for option ${j}:`, err)
      }
    }

    return predictions
  }, [getContract])

  // Load all sessions with full details
  const loadAllSessions = useCallback(async (userAddress = null) => {
    console.log('=== Loading sessions from blockchain ===')
    setLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }

      const count = await getSessionCounter()
      console.log('Session count:', count)

      if (count === 0) {
        console.log('No sessions to load')
        return []
      }

      const sessions = []

      for (let i = 1; i <= count; i++) {
        try {
          const sessionDetails = await getSessionDetails(i)
          const options = await getSessionOptions(i, sessionDetails.optionCount)
          const userPredictions = await getUserPredictions(i, userAddress, sessionDetails.optionCount)

          sessions.push({
            ...sessionDetails,
            options,
            userPredictions,
          })

          console.log(`✅ Loaded session ${i}: ${sessionDetails.name}`)
        } catch (err) {
          console.error(`Failed to load session ${i}:`, err)
          // Continue loading other sessions
        }
      }

      console.log(`✅ Loaded ${sessions.length} sessions`)
      return sessions
    } catch (err) {
      console.error('Error loading sessions:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [getSessionCounter, getSessionDetails, getSessionOptions, getUserPredictions])

  return {
    loading,
    error,
    getContract,
    getSessionCounter,
    getSessionDetails,
    loadAllSessions,
  }
}
