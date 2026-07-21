import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import AddProjectModal from '../components/AddProjectModal'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function ProjectCard({ project, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease', padding: '18px' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#000', marginBottom: '2px' }}>{project.name}</div>
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '14px' }}>{project.repo.owner}/{project.repo.name}</div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', marginBottom: '16px' }}>
        <span>{project.repo.commitCount.toLocaleString()} commits</span>
        <span>Updated {timeAgo(project.repo.lastCommit.timestamp)}</span>
      </div>
      <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
        View Project →
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects } = useProjects()
  const [showAddModal, setShowAddModal] = useState(false)

  function goToProject(id) {
    navigate(`/projects/${id}`)
  }

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" />
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{user?.email}</span>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', padding: '30px 32px 6px' }}>
        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', flex: 1 }}>
          Your Projects
        </div>
        <button onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ margin: '40px 32px', padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px dashed #e0e0dd' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>No projects yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>Create your first project to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', padding: '2px 32px 28px' }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => goToProject(p.id)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onCreated={(project) => { setShowAddModal(false); navigate(`/projects/${project.id}`) }}
        />
      )}
    </main>
  )
}
