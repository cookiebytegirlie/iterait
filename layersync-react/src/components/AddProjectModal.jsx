import { useMemo, useState } from 'react'
import { useGitHub } from '../hooks/useGitHub'
import { useProjects } from '../hooks/useProjects'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function AddProjectModal({ onClose, onCreated }) {
  const { repos, loading } = useGitHub()
  const { createProject } = useProjects()
  const [query, setQuery] = useState('')
  const [selectedRepoId, setSelectedRepoId] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos
    return repos.filter(r => r.name.toLowerCase().includes(q))
  }, [repos, query])

  const selectedRepo = repos.find(r => r.id === selectedRepoId) || null

  function selectRepo(repo) {
    setSelectedRepoId(repo.id)
    setProjectName(repo.name)
    setError(null)
  }

  function handleCreate() {
    if (!selectedRepo || !projectName.trim() || creating) return
    setCreating(true)
    setTimeout(() => {
      try {
        const project = createProject(selectedRepo, projectName)
        onCreated(project)
      } catch {
        setError('Something went wrong creating the project. Try again.')
        setCreating(false)
      }
    }, 400)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>Create new project</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1, padding: 0, marginTop: '2px' }}>×</button>
          </div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px', lineHeight: 1.5 }}>Select a GitHub repository to track in iterait.</div>
        </div>

        <div style={{ padding: '0 28px 8px' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Select a repository…"
            style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box', marginBottom: '10px' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
            {loading && (
              <>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: '52px', borderRadius: '10px', background: '#f5f5f4' }} />
                ))}
              </>
            )}
            {!loading && filteredRepos.length === 0 && (
              <div style={{ fontSize: '13px', color: '#aaa', padding: '12px 0' }}>No repositories match "{query}".</div>
            )}
            {!loading && filteredRepos.map(repo => {
              const isSel = repo.id === selectedRepoId
              return (
                <div key={repo.id} onClick={() => selectRepo(repo)}
                  style={{ padding: '10px 13px', borderRadius: '10px', border: `1.5px solid ${isSel ? 'var(--primary)' : '#e8e8e8'}`, cursor: 'pointer', background: isSel ? 'rgba(26,26,25,.03)' : '#fff' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{repo.name}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {repo.commitCount.toLocaleString()} commits · Last: {timeAgo(repo.lastCommit.timestamp)}
                  </div>
                </div>
              )
            })}
          </div>

          {selectedRepo && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>Project name</div>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Name this project"
                  style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#fafaf9', border: '1px solid #ececea', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', fontSize: '13px', color: '#555', lineHeight: 1.7 }}>
                <div><strong style={{ color: '#333' }}>Repository:</strong> {selectedRepo.owner}/{selectedRepo.name}</div>
                <div><strong style={{ color: '#333' }}>Owner:</strong> {selectedRepo.owner}</div>
                <div><strong style={{ color: '#333' }}>Commits:</strong> {selectedRepo.commitCount.toLocaleString()} total</div>
                <div><strong style={{ color: '#333' }}>Last commit:</strong> "{selectedRepo.lastCommit.message}" · {timeAgo(selectedRepo.lastCommit.timestamp)} · by {selectedRepo.lastCommit.author}</div>
              </div>
            </>
          )}

          {error && <div style={{ fontSize: '13px', color: '#c0392b', marginBottom: '8px' }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!selectedRepo || !projectName.trim() || creating}
            style={{
              padding: '10px 20px',
              background: selectedRepo && projectName.trim() ? '#0a0a0a' : '#d4d4d4',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: selectedRepo && projectName.trim() && !creating ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}>
            {creating ? 'Creating project…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
