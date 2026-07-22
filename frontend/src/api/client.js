// iterait API client.
//
// One place that talks to the backend agent. Reads config from Vite env:
//   VITE_API_BASE   — backend base URL (e.g. http://localhost:4000)
//   VITE_USE_MOCKS  — "true" to return canned data (see ./mocks.js)
//
// Endpoints mirror docs/iterait-build-flow.md. As the backend goes live,
// flip VITE_USE_MOCKS to "false" and these call the real routes unchanged.

import {
  mockRepos,
  mockProjects,
  mockGithubUser,
  mockVersions,
  mockLibrary,
  mockDesignSystems,
} from './mocks.js'

// A lineage's identity is its first-saved variant's id: that variant carries
// lineageId: null, every later variant carries lineageId === that id. This
// resolves either kind of row (or a raw id no row currently owns) to the
// shared key so lineage membership stays consistent regardless of which
// variant a caller references it by.
const lineageKeyOf = (component) => component.lineageId || component.id

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

  // GET /api/projects/:owner/:repo/versions
  // Version checkpoints for a project, newest first.
  listVersions(owner, repo) {
    if (USE_MOCKS) return mock({ versions: mockVersions[`${owner}/${repo}`] || [] })
    return request(`/api/projects/${owner}/${repo}/versions`)
  },

  // GET /api/projects/:owner/:repo/versions/:versionId
  // Returns the version (snapshot) and its detected components separately.
  getVersion(owner, repo, versionId) {
    if (USE_MOCKS) {
      const versions = mockVersions[`${owner}/${repo}`] || []
      const found = versions.find((v) => v.id === versionId)
      if (!found) return mock({ version: null, components: [] })
      const { components, ...version } = found
      return mock({ version, components })
    }
    return request(`/api/projects/${owner}/${repo}/versions/${versionId}`)
  },

  // POST /api/library  { component, sourceProject, sourceVersionId, lineageId? }
  // `component` also carries `selector` (the node's selector in the source
  // snapshot, stored as sourceSelector) alongside html/css/capturedWidth.
  // Copies an extracted component into the saved library and marks it saved
  // on the version it came from (when it corresponds to a pre-detected
  // component there). `lineageId`, when present, is the id of the existing
  // library component this is a new version of — identity is user-asserted,
  // no auto-matching.
  saveComponent({ component, sourceProject, sourceVersionId, lineageId }) {
    if (USE_MOCKS) {
      let resolvedLineageId = null
      let variantNumber = 1
      if (lineageId) {
        const anchor = mockLibrary.find((c) => c.id === lineageId)
        resolvedLineageId = anchor ? lineageKeyOf(anchor) : lineageId
        const siblings = mockLibrary.filter((c) => lineageKeyOf(c) === resolvedLineageId)
        variantNumber = Math.max(0, ...siblings.map((c) => c.variantNumber || 1)) + 1
      }
      const saved = {
        id: `lib_${Date.now()}`,
        name: component.name,
        type: component.type,
        html: component.html,
        css: component.css || '',
        capturedWidth: component.capturedWidth || null,
        sourceProject,
        sourceVersionId,
        sourceSelector: component.selector || null,
        lineageId: resolvedLineageId,
        variantNumber,
        createdAt: new Date().toISOString(),
        designSystemIds: [],
      }
      mockLibrary.push(saved)
      const version = (mockVersions[sourceProject] || []).find((v) => v.id === sourceVersionId)
      const detected = version?.components?.find((c) => c.id === component.id)
      if (detected) detected.saved = true
      return mock({ component: saved })
    }
    return request('/api/library', { method: 'POST', body: { component, sourceProject, sourceVersionId, lineageId } })
  },

  // GET /api/library?type=&designSystemId=
  // Groups by lineage first — each lineage's gallery card is its latest
  // variant, annotated with a `variants` count — then applies the type/
  // design-system filters on top of that deduped list.
  listComponents({ type, designSystemId } = {}) {
    if (USE_MOCKS) {
      const latestByLineage = new Map()
      const sizeByLineage = new Map()
      for (const c of mockLibrary) {
        const key = lineageKeyOf(c)
        sizeByLineage.set(key, (sizeByLineage.get(key) || 0) + 1)
        const current = latestByLineage.get(key)
        if (!current || c.variantNumber > current.variantNumber) latestByLineage.set(key, c)
      }
      const gallery = Array.from(latestByLineage, ([key, c]) => ({ ...c, variants: sizeByLineage.get(key) }))
      const components = gallery.filter(
        (c) => (!type || c.type === type) && (!designSystemId || c.designSystemIds.includes(designSystemId))
      )
      return mock({ components })
    }
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (designSystemId) params.set('designSystemId', designSystemId)
    return request(`/api/library?${params.toString()}`)
  },

  // GET /api/library/lineage/:lineageId — every variant in a lineage,
  // oldest first, for a future component-history view. `lineageId` may be
  // either a lineage's anchor id or any later variant's id.
  getLineage(lineageId) {
    if (USE_MOCKS) {
      const found = mockLibrary.find((c) => c.id === lineageId)
      const key = found ? lineageKeyOf(found) : lineageId
      const variants = mockLibrary
        .filter((c) => lineageKeyOf(c) === key)
        .sort((a, b) => a.variantNumber - b.variantNumber)
      return mock({ variants })
    }
    return request(`/api/library/lineage/${lineageId}`)
  },

  // GET /api/library/:componentId
  getComponent(componentId) {
    if (USE_MOCKS) return mock({ component: mockLibrary.find((c) => c.id === componentId) || null })
    return request(`/api/library/${componentId}`)
  },

  // POST /api/library/:componentId/prompt  { targetTool }
  // Returns a pasteable prompt for recreating the component in another tool.
  generateComponentPrompt(componentId, targetTool) {
    if (USE_MOCKS) {
      const component = mockLibrary.find((c) => c.id === componentId)
      const prompt = component
        ? `Recreate this ${component.type} component ("${component.name}") in ${targetTool}, matching this markup and inline styles exactly:\n\n${component.html}`
        : ''
      return mock({ prompt })
    }
    return request(`/api/library/${componentId}/prompt`, { method: 'POST', body: { targetTool } })
  },

  // GET /api/design-systems
  listDesignSystems() {
    if (USE_MOCKS) return mock({ designSystems: mockDesignSystems })
    return request('/api/design-systems')
  },

  // POST /api/design-systems  { name, description }
  createDesignSystem(name, description) {
    if (USE_MOCKS) {
      const designSystem = { id: `ds_${Date.now()}`, name, description, componentIds: [], createdAt: new Date().toISOString() }
      mockDesignSystems.push(designSystem)
      return mock({ designSystem })
    }
    return request('/api/design-systems', { method: 'POST', body: { name, description } })
  },

  // POST /api/design-systems/:designSystemId/components  { componentId }
  addComponentToSystem(designSystemId, componentId) {
    if (USE_MOCKS) {
      const designSystem = mockDesignSystems.find((d) => d.id === designSystemId)
      const component = mockLibrary.find((c) => c.id === componentId)
      if (designSystem && !designSystem.componentIds.includes(componentId)) designSystem.componentIds.push(componentId)
      if (component && !component.designSystemIds.includes(designSystemId)) component.designSystemIds.push(designSystemId)
      return mock({ ok: true })
    }
    return request(`/api/design-systems/${designSystemId}/components`, { method: 'POST', body: { componentId } })
  },

  // DELETE /api/design-systems/:designSystemId/components/:componentId
  removeComponentFromSystem(designSystemId, componentId) {
    if (USE_MOCKS) {
      const designSystem = mockDesignSystems.find((d) => d.id === designSystemId)
      const component = mockLibrary.find((c) => c.id === componentId)
      if (designSystem) designSystem.componentIds = designSystem.componentIds.filter((id) => id !== componentId)
      if (component) component.designSystemIds = component.designSystemIds.filter((id) => id !== designSystemId)
      return mock({ ok: true })
    }
    return request(`/api/design-systems/${designSystemId}/components/${componentId}`, { method: 'DELETE' })
  },
}

export { API_BASE, USE_MOCKS }
