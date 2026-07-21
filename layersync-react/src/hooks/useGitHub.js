import { useEffect, useState } from 'react'
import { MOCK_GITHUB_REPOS } from '../data/mockData'

// Mocked until the backend implements GET /api/github/repos
export function useGitHub() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setRepos(MOCK_GITHUB_REPOS)
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [])

  return { repos, loading, error }
}
