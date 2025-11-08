/**
 * Utility functions for filtering sessions
 */

export const SESSION_STATUS = {
  ACTIVE: 0,
  CLOSED: 1,
  DELETED: 2,
}

/**
 * Filter sessions by tab type
 */
export function filterByTab(sessions, tab, userAddress) {
  switch (tab) {
    case 'my-predictions':
      return sessions.filter(s => s.userPredictions && s.userPredictions.length > 0)

    case 'creator':
      return sessions.filter(s =>
        s.creator.toLowerCase() === userAddress?.toLowerCase()
      )

    case 'dashboard':
    case 'all':
    default:
      return sessions
  }
}

/**
 * Filter sessions by search query
 */
export function filterBySearch(sessions, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) {
    return sessions
  }

  const query = searchQuery.toLowerCase().trim()

  return sessions.filter(session =>
    session.name.toLowerCase().includes(query) ||
    session.options.some(option => option.name.toLowerCase().includes(query))
  )
}

/**
 * Filter sessions by status
 */
export function filterByStatus(sessions, statusFilter) {
  if (statusFilter === 'all') {
    return sessions
  }

  if (statusFilter === 'active') {
    return sessions.filter(s => s.status === SESSION_STATUS.ACTIVE)
  }

  if (statusFilter === 'closed') {
    return sessions.filter(s =>
      s.status === SESSION_STATUS.CLOSED ||
      s.status === SESSION_STATUS.DELETED
    )
  }

  return sessions
}

/**
 * Apply all filters to sessions
 */
export function applyFilters(sessions, { tab, searchQuery, statusFilter, userAddress }) {
  let filtered = sessions

  // Apply tab filter
  filtered = filterByTab(filtered, tab, userAddress)

  // Apply search filter
  filtered = filterBySearch(filtered, searchQuery)

  // Apply status filter
  filtered = filterByStatus(filtered, statusFilter)

  return filtered
}

/**
 * Get empty state message based on current filters
 */
export function getEmptyStateMessage(tab, searchQuery, statusFilter) {
  if (tab === 'all' && (searchQuery || statusFilter !== 'all')) {
    return 'No sessions match your filters.'
  }

  if (tab === 'all' && !searchQuery && statusFilter === 'all') {
    return 'No prediction sessions yet. Create the first one!'
  }

  if (tab === 'my-predictions') {
    return "You haven't made any predictions yet."
  }

  if (tab === 'creator') {
    return "You haven't created any sessions yet."
  }

  return 'No sessions found.'
}
