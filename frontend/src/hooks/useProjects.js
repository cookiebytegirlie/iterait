import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// Fetches the user's connected projects on mount.
export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .listProjects()
      .then((data) => alive && setProjects(data.projects))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return { projects, loading, error }
}
