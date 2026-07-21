// iterait API client.
//
// One place that talks to the backend agent. Reads config from Vite env:
//   VITE_API_BASE   — backend base URL (e.g. http://localhost:4000)
//   VITE_USE_MOCKS  — "true" to return canned data (see ./mocks.js)
//
// Endpoints mirror docs/iterait-build-flow.md. As the backend goes live,
// flip VITE_USE_MOCKS to "false" and these call the real routes unchanged.

import { mockDiff, mockActions, mockJob, mockTimelineCommits, mockRepos, mockProjects, mockGithubUser } from './mocks.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
// Mocks are ON by default so a fresh clone runs with zero setup. Opt out
// explicitly (VITE_USE_MOCKS=false) once the backend is live.
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send the session cookie once GitHub OAuth is wired
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed (${res.status}) ${detail}`)
  }
  return res.status === 204 ? null : res.json()
}

// Small helper so mock responses feel async like the real thing.
const mock = (data) => new Promise((r) => setTimeout(() => r(data), 250))

export const api = {
  // POST /api/auth/signup  { email }
  signUp(email) {
    if (USE_MOCKS) return mock({ userId: `user_${Date.now()}`, token: 'mock-token', user: { email } })
    return request('/api/auth/signup', { method: 'POST', body: { email } })
  },

  // POST /api/auth/github/callback  { code } — mocked client-side entirely for
  // now (no GitHub OAuth app is registered yet, so there's nothing real to
  // redirect to). Swap for a real code-exchange once one exists.
  connectGithub() {
    if (USE_MOCKS) return mock({ githubUser: mockGithubUser })
    return request('/api/auth/github/callback', { method: 'POST', body: {} })
  },

  // GET /api/repos/:owner/:repo/commits?limit=&offset=
  // Returns { commits, total, hasMore } — paginated so Timeline can lazy-load.
  listCommits(owner, repo, { limit = 20, offset = 0 } = {}) {
    if (USE_MOCKS) {
      const slice = mockTimelineCommits.slice(offset, offset + limit)
      return mock({
        commits: slice,
        total: mockTimelineCommits.length,
        hasMore: offset + limit < mockTimelineCommits.length,
      })
    }
    return request(`/api/repos/${owner}/${repo}/commits?limit=${limit}&offset=${offset}`)
  },

  // GET /api/repos/:owner/:repo/commit/:sha/diff
  getCommitDiff(owner, repo, sha) {
    if (USE_MOCKS) return mock({ ...mockDiff, sha })
    return request(`/api/repos/${owner}/${repo}/commit/${sha}/diff`)
  },

  // GET /api/github/repos — repos the user has write access to.
  listRepos() {
    if (USE_MOCKS) return mock({ repos: mockRepos })
    return request('/api/github/repos')
  },

  // GET /api/projects — repos the user has connected on the Dashboard.
  listProjects() {
    if (USE_MOCKS) return mock({ projects: mockProjects })
    return request('/api/projects')
  },

  // POST /api/projects  { repoOwner, repoName, projectName }
  // owner/repo is the project's identifier — no separate synthetic id.
  createProject(repoOwner, repoName, projectName) {
    if (USE_MOCKS) {
      const repo = mockRepos.find((r) => r.owner === repoOwner && r.name === repoName)
      const project = { name: projectName, repo, lastUpdated: new Date().toISOString() }
      mockProjects.push(project)
      return mock({ project })
    }
    return request('/api/projects', { method: 'POST', body: { repoOwner, repoName, projectName } })
  },

  // GET /api/actions
  listActions() {
    if (USE_MOCKS) return mock(mockActions)
    return request('/api/actions')
  },

  // POST /api/actions  { name, description, repo, startSha, endSha, tags }
  saveAction(payload) {
    if (USE_MOCKS) return mock({ id: `act-${Date.now()}`, ...payload })
    return request('/api/actions', { method: 'POST', body: payload })
  },

  // POST /api/actions/:id/apply  { targetRepo, targetPath, targetFramework }
  applyAction(actionId, payload) {
    if (USE_MOCKS) return mock({ jobId: 'job-123' })
    return request(`/api/actions/${actionId}/apply`, { method: 'POST', body: payload })
  },

  // GET /api/jobs/:jobId  → { status, progress, result, error }
  getJob(jobId) {
    if (USE_MOCKS) return mock({ ...mockJob, id: jobId })
    return request(`/api/jobs/${jobId}`)
  },
}

export { API_BASE, USE_MOCKS }
