import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const PAGE_SIZE = 5

// Paginated commit feed for a repo. Call loadMore() to fetch the next page;
// resets automatically when owner/repo changes.
export function useCommits(owner, repo) {
  const repoKey = `${owner}/${repo}`
  const [loadedKey, setLoadedKey] = useState(repoKey)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)

  // Adjust state during render when the repo changes, rather than resetting
  // it in an effect (see react.dev "Adjusting state when a prop changes").
  if (repoKey !== loadedKey) {
    setLoadedKey(repoKey)
    setCommits([])
    setOffset(0)
    setHasMore(true)
    setTotal(0)
    setError(null)
    setLoading(true)
  }

  useEffect(() => {
    let alive = true
    api
      .listCommits(owner, repo, { limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!alive) return
        setCommits(data.commits)
        setHasMore(data.hasMore)
        setTotal(data.total)
        setOffset(PAGE_SIZE)
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))

    return () => { alive = false }
  }, [owner, repo])

  function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    api
      .listCommits(owner, repo, { limit: PAGE_SIZE, offset })
      .then((data) => {
        setCommits((prev) => [...prev, ...data.commits])
        setHasMore(data.hasMore)
        setOffset((prev) => prev + PAGE_SIZE)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return { commits, loading, error, hasMore, total, loadMore }
}
