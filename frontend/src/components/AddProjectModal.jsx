import { useMemo, useState } from 'react'
import { useGitHub } from '../hooks/useGitHub.js'
import { api } from '../api/client.js'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Rendered only while open (Dashboard mounts/unmounts it via `showAddModal &&`),
// so every open starts with a clean slate — no stale selection to reset.
export default function AddProjectModal({ onClose, onCreateProject }) {
  const { repos, loading, error: reposError } = useGitHub()
  const [query, setQuery] = useState('')
  const [selectedRepoId, setSelectedRepoId] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos
    return repos.filter((r) => r.name.toLowerCase().includes(q))
  }, [repos, query])

  const selectedRepo = repos.find((r) => r.id === selectedRepoId) || null

  function selectRepo(repo) {
    setSelectedRepoId(repo.id)
    setProjectName(repo.name)
    setCreateError(null)
  }

  async function handleCreate() {
    if (!selectedRepo || !projectName.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const { project } = await api.createProject(selectedRepo.owner, selectedRepo.name, projectName.trim())
      onCreateProject(project)
    } catch (e) {
      setCreateError(e.message || 'Something went wrong creating the project.')
      setCreating(false)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md rounded-[14px] bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Create new project</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink">×</button>
        </div>
        <p className="mb-4 text-sm text-ink-2">Select a GitHub repository to track in iterait.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Select a repository…"
          className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
        />

        <div className="mb-4 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {loading && [0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-canvas" />)}
          {!loading && reposError && (
            <p className="text-sm text-red-600">Couldn't load repositories. {reposError}</p>
          )}
          {!loading && !reposError && filteredRepos.length === 0 && (
            <p className="py-2 text-sm text-ink-3">No repositories match "{query}".</p>
          )}
          {!loading && filteredRepos.map((repo) => {
            const isSel = repo.id === selectedRepoId
            return (
              <button
                key={repo.id}
                onClick={() => selectRepo(repo)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSel ? 'border-ink bg-canvas' : 'border-border hover:bg-canvas'
                }`}
              >
                <div className="font-medium text-ink">{repo.name}</div>
                <div className="text-xs text-ink-3">
                  {repo.commitCount.toLocaleString()} commits · Last: {timeAgo(repo.lastCommit.timestamp)}
                </div>
              </button>
            )
          })}
        </div>

        {selectedRepo && (
          <>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-2">Project name</span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My project"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
              />
            </label>

            <div className="mb-3 rounded-lg border border-border bg-canvas px-3 py-2 text-xs leading-relaxed text-ink-2">
              <div><span className="font-medium text-ink">Repository:</span> {selectedRepo.owner}/{selectedRepo.name}</div>
              <div><span className="font-medium text-ink">Commits:</span> {selectedRepo.commitCount.toLocaleString()}</div>
              <div>
                <span className="font-medium text-ink">Last commit:</span> "{selectedRepo.lastCommit.message}" ·{' '}
                {timeAgo(selectedRepo.lastCommit.timestamp)}
              </div>
            </div>
          </>
        )}

        {createError && <p className="mb-2 text-sm text-red-600">{createError}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedRepo || !projectName.trim() || creating}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
