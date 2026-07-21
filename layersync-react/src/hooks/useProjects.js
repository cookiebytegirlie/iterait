import { useState } from 'react'

const PROJECTS_KEY = 'iterait_gh_projects'

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [] } catch { return [] }
}

// Manages iterait projects (each wraps a GitHub repo). Separate localStorage
// key from the legacy `iterait_projects` used by the old file-tracking pages.
export function useProjects() {
  const [projects, setProjects] = useState(loadProjects)
  const [error] = useState(null)

  function persist(next) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next))
    setProjects(next)
  }

  function createProject(repo, projectName) {
    const project = {
      id: `project_${Date.now()}`,
      name: (projectName || repo.name).trim(),
      repo,
      createdAt: new Date().toISOString(),
      actionsCount: 0,
    }
    persist([...projects, project])
    return project
  }

  function deleteProject(projectId) {
    persist(projects.filter(p => p.id !== projectId))
  }

  return { projects, loading: false, error, createProject, deleteProject }
}
