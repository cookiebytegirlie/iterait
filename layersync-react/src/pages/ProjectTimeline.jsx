import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { MOCK_COMMITS } from '../data/mockData'
import SaveActionDialog from '../components/SaveActionDialog'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const STATUS_LABEL = { added: 'NEW', modified: 'MODIFIED', removed: 'REMOVED' }

export default function ProjectTimeline() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const project = projects.find(p => p.id === projectId)

  const commits = MOCK_COMMITS
  const [selectedSha, setSelectedSha] = useState(commits[0]?.sha ?? null)
  const [filterQ, setFilterQ] = useState('')
  const [showSaveAction, setShowSaveAction] = useState(false)

  const filteredCommits = useMemo(() => {
    const q = filterQ.trim().toLowerCase()
    if (!q) return commits
    return commits.filter(c => c.message.toLowerCase().includes(q) || c.author.toLowerCase().includes(q))
  }, [commits, filterQ])

  const selectedCommit = commits.find(c => c.sha === selectedSha) || null

  if (!project) {
    return (
      <main className="main-v2">
        <div style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Project not found</div>
          <button onClick={() => navigate('/dashboard')}
            style={{ padding: '9px 18px', border: '1.5px solid var(--primary)', background: '#fff', color: 'var(--primary)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  const commitUrl = (sha) => `${project.repo.url}/commit/${sha}`

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-3)' }}>
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Projects</span>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{project.name}</span>
        </div>
        <div className="search-v2" />
        <div className="right" />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 240px', gap: 0, height: 'calc(100vh - 62px)' }}>
        {/* Commit list */}
        <div style={{ borderRight: '1px solid #ececea', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '20px 18px 12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Commits</div>
            <input value={filterQ} onChange={e => setFilterQ(e.target.value)} placeholder="Filter commits…"
              style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
            {filteredCommits.map(c => {
              const isSel = c.sha === selectedSha
              return (
                <div key={c.sha} onClick={() => setSelectedSha(c.sha)}
                  style={{ padding: '10px 10px', borderRadius: '10px', cursor: 'pointer', background: isSel ? '#f5f5f4' : 'transparent', marginBottom: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', lineHeight: 1.3 }}>{c.message}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={c.avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{c.author}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>· {timeAgo(c.timestamp)}</span>
                  </div>
                </div>
              )
            })}
            {filteredCommits.length === 0 && (
              <div style={{ fontSize: '13px', color: '#aaa', padding: '12px' }}>No commits match "{filterQ}".</div>
            )}
          </div>
        </div>

        {/* Commit detail */}
        <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
          {!selectedCommit ? (
            <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>Select a commit to view details.</div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-3)', marginRight: '8px' }}>{selectedCommit.sha.slice(0, 7)}</span>
                  {selectedCommit.message}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{selectedCommit.author} · {timeAgo(selectedCommit.timestamp)}</div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '10px' }}>Files Changed</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCommit.diff.files.map(f => (
                    <div key={f.filename} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #ececea', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: f.status === 'added' ? '#DCFCE7' : '#FEF3C7', color: f.status === 'added' ? '#15803D' : '#B45309' }}>
                          {STATUS_LABEL[f.status] || f.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-3)', flexShrink: 0, marginLeft: '10px' }}>
                        <span style={{ color: '#15803D' }}>+{f.additions}</span> <span style={{ color: '#B91C1C' }}>-{f.deletions}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '32px', border: '1.5px dashed #e0e0dd', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '10px' }}>Diff viewer coming soon</div>
                <a href={commitUrl(selectedCommit.sha)} target="_blank" rel="noreferrer"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}>
                  View full diff on GitHub →
                </a>
              </div>
            </>
          )}
        </div>

        {/* Actions sidebar */}
        <div style={{ borderLeft: '1px solid #ececea', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => selectedCommit && setShowSaveAction(true)} disabled={!selectedCommit}
            style={{ padding: '10px 16px', background: selectedCommit ? 'var(--primary)' : '#d4d4d4', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: selectedCommit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            Save as Action
          </button>
          {selectedCommit && (
            <a href={commitUrl(selectedCommit.sha)} target="_blank" rel="noreferrer"
              style={{ padding: '10px 16px', border: '1.5px solid #e8e8e8', color: 'var(--text-2)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textAlign: 'center', fontFamily: 'inherit' }}>
              View on GitHub
            </a>
          )}

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ececea', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{project.repo.commitCount.toLocaleString()} commits total</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Last commit {timeAgo(project.repo.lastCommit.timestamp)}</div>
          </div>
        </div>
      </div>

      {showSaveAction && selectedCommit && (
        <SaveActionDialog commit={selectedCommit} projectId={project.id} onClose={() => setShowSaveAction(false)} />
      )}
    </main>
  )
}
