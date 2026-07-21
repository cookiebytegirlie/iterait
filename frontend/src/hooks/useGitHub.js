import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// Fetches the user's GitHub repos on mount. Meant to be used inside a
// component that only mounts while its consumer (e.g. AddProjectModal) is
// open, so "fetch on open" falls out of normal mount/unmount.
export function useGitHub() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .listRepos()
      .then((data) => alive && setRepos(data.repos))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return { repos, loading, error }
}
