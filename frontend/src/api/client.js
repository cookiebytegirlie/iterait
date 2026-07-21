// iterait API client.
//
// One place that talks to the backend agent. Reads config from Vite env:
//   VITE_API_BASE   — backend base URL (e.g. http://localhost:4000)
//   VITE_USE_MOCKS  — "true" to return canned data (see ./mocks.js)
//
// Endpoints mirror docs/iterait-build-flow.md. As the backend goes live,
// flip VITE_USE_MOCKS to "false" and these call the real routes unchanged.

import { mockCommits, mockDiff, mockActions, mockJob } from './mocks.js'

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
  // GET /api/repos/:owner/:repo/commits
  listCommits(owner, repo) {
    if (USE_MOCKS) return mock(mockCommits)
    return request(`/api/repos/${owner}/${repo}/commits`)
  },

  // GET /api/repos/:owner/:repo/commit/:sha/diff
  getCommitDiff(owner, repo, sha) {
    if (USE_MOCKS) return mock({ ...mockDiff, sha })
    return request(`/api/repos/${owner}/${repo}/commit/${sha}/diff`)
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
