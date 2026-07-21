import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import ProjectCard from '../components/ProjectCard.jsx'
import AddProjectModal from '../components/AddProjectModal.jsx'
import EmptyState from '../components/EmptyState.jsx'

// Lists the user's connected projects and lets them connect a new one.
// A "project" is just a named pointer at a GitHub repo — owner/repo is the
// identifier, matching Timeline's /timeline/:owner/:repo route.
export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()
  const [showAddModal, setShowAddModal] = useState(false)

  function goToProject(project) {
    navigate(`/timeline/${project.repo.owner}/${project.repo.name}`)
  }

  function handleCreated(project) {
    setShowAddModal(false)
    goToProject(project)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="bg-gradient-hero mb-8 rounded-[14px] px-8 py-10 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Your Projects</h1>
        <p className="mt-1 text-sm text-white/90">
          Git-based version control for cross-platform design components.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Connected</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          + Add Project
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-[14px] bg-canvas" />)}
        </div>
      )}

      {!loading && projects.length === 0 && (
        <EmptyState title="No projects yet" description="Create your first project to get started" />
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={`${p.repo.owner}/${p.repo.name}`} project={p} onClick={() => goToProject(p)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProjectModal onClose={() => setShowAddModal(false)} onCreateProject={handleCreated} />
      )}
    </div>
  )
}
