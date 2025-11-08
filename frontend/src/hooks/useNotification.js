import { useState, useCallback } from 'react'

const NOTIFICATION_DURATION = 5000 // 5 seconds

/**
 * Custom hook for managing notifications
 */
export function useNotification() {
  const [notification, setNotification] = useState(null)

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })

    // Auto-clear notification after duration
    setTimeout(() => {
      setNotification(null)
    }, NOTIFICATION_DURATION)
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showNotification,
    hideNotification,
  }
}
