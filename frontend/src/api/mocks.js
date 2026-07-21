// Canned data returned by the API client when VITE_USE_MOCKS === 'true'.
// Lets the frontend run end-to-end before the backend agent exists.
// Shapes here are the contract the real backend should match — keep them in
// sync with docs/iterait-build-flow.md as endpoints go live.

// GitHub identity returned once the (mocked) OAuth flow "completes".
export const mockGithubUser = {
  login: 'sydneynguyyen',
  name: 'Sydney Nguyen',
  avatar: 'https://avatars.githubusercontent.com/u/123456',
}

export const mockDiff = {
  sha: 'a1b2c3d',
  files: [
    {
      path: 'src/components/Button.jsx',
      status: 'modified',
      additions: 6,
      deletions: 2,
      patch:
        "@@ -1,8 +1,12 @@\n export default function Button({ children }) {\n-  return <button className=\"btn\">{children}</button>\n+  return (\n+    <button className=\"btn rounded-xl shadow-md\">\n+      {children}\n+    </button>\n+  )\n }",
    },
  ],
}

// Richer commit feed for the Timeline page — each commit carries its own
// files-changed summary so the page doesn't need a second diff fetch just to
// render the "Files Changed" list (the diff *viewer* itself is deferred).
const AVATARS = {
  'Sydney Nguyen': 'https://avatars.githubusercontent.com/u/123456',
  'Basmah Masood': 'https://avatars.githubusercontent.com/u/234567',
  'Shreya Hambir': 'https://avatars.githubusercontent.com/u/345678',
}

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => hoursAgo(d * 24)

export const mockTimelineCommits = [
  {
    sha: 'abc123def456',
    message: 'Add button component',
    author: 'Sydney Nguyen',
    avatar: AVATARS['Sydney Nguyen'],
    timestamp: hoursAgo(2),
    filesChanged: 2,
    additions: 145,
    deletions: 0,
    files: [
      { filename: 'src/components/Button.jsx', status: 'added', additions: 145, deletions: 0 },
      { filename: 'src/styles/button.css', status: 'modified', additions: 32, deletions: 12 },
    ],
  },
  {
    sha: 'def456ghi789',
    message: 'Fix responsive layout on mobile',
    author: 'Basmah Masood',
    avatar: AVATARS['Basmah Masood'],
    timestamp: daysAgo(1),
    filesChanged: 5,
    additions: 203,
    deletions: 89,
    files: [
      { filename: 'src/pages/Home.jsx', status: 'modified', additions: 67, deletions: 45 },
      { filename: 'src/styles/layout.css', status: 'modified', additions: 136, deletions: 44 },
    ],
  },
  {
    sha: 'ghi789jkl012',
    message: 'Update color palette',
    author: 'Shreya Hambir',
    avatar: AVATARS['Shreya Hambir'],
    timestamp: daysAgo(3),
    filesChanged: 3,
    additions: 67,
    deletions: 45,
    files: [
      { filename: 'src/styles/theme.css', status: 'modified', additions: 40, deletions: 30 },
      { filename: 'src/components/Badge.jsx', status: 'modified', additions: 27, deletions: 15 },
    ],
  },
  {
    sha: 'jkl012mno345',
    message: 'Add hover + focus states to inputs',
    author: 'Sydney Nguyen',
    avatar: AVATARS['Sydney Nguyen'],
    timestamp: daysAgo(4),
    filesChanged: 1,
    additions: 28,
    deletions: 4,
    files: [{ filename: 'src/components/Input.jsx', status: 'modified', additions: 28, deletions: 4 }],
  },
  {
    sha: 'mno345pqr678',
    message: 'Extract shared card shadow token',
    author: 'Basmah Masood',
    avatar: AVATARS['Basmah Masood'],
    timestamp: daysAgo(5),
    filesChanged: 2,
    additions: 18,
    deletions: 9,
    files: [
      { filename: 'src/index.css', status: 'modified', additions: 4, deletions: 1 },
      { filename: 'src/components/Card.jsx', status: 'modified', additions: 14, deletions: 8 },
    ],
  },
  {
    sha: 'pqr678stu901',
    message: 'Wire up nav active states',
    author: 'Sydney Nguyen',
    avatar: AVATARS['Sydney Nguyen'],
    timestamp: daysAgo(6),
    filesChanged: 1,
    additions: 21,
    deletions: 3,
    files: [{ filename: 'src/components/Layout.jsx', status: 'modified', additions: 21, deletions: 3 }],
  },
  {
    sha: 'stu901vwx234',
    message: 'Add empty states to Actions page',
    author: 'Shreya Hambir',
    avatar: AVATARS['Shreya Hambir'],
    timestamp: daysAgo(8),
    filesChanged: 1,
    additions: 34,
    deletions: 0,
    files: [{ filename: 'src/pages/Actions.jsx', status: 'modified', additions: 34, deletions: 0 }],
  },
  {
    sha: 'vwx234yzab567',
    message: 'Fix commit list overflow on small screens',
    author: 'Basmah Masood',
    avatar: AVATARS['Basmah Masood'],
    timestamp: daysAgo(9),
    filesChanged: 1,
    additions: 12,
    deletions: 6,
    files: [{ filename: 'src/pages/Timeline.jsx', status: 'modified', additions: 12, deletions: 6 }],
  },
  {
    sha: 'yzab567cde890',
    message: 'Initial setup',
    author: 'Sydney Nguyen',
    avatar: AVATARS['Sydney Nguyen'],
    timestamp: daysAgo(12),
    filesChanged: 14,
    additions: 480,
    deletions: 0,
    files: [
      { filename: 'package.json', status: 'added', additions: 24, deletions: 0 },
      { filename: 'src/App.jsx', status: 'added', additions: 56, deletions: 0 },
    ],
  },
]

// GitHub repos available to connect from the Dashboard's "Add Project" flow.
export const mockRepos = [
  {
    id: 'repo_1',
    name: 'my-lovable-app',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/my-lovable-app',
    description: 'Built in Lovable with React',
    commitCount: 2458,
    lastCommit: { message: 'Add button component', timestamp: hoursAgo(2), author: 'Sydney Nguyen' },
  },
  {
    id: 'repo_2',
    name: 'design-system-v2',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/design-system-v2',
    description: 'Design tokens and component library',
    commitCount: 143,
    lastCommit: { message: 'Update typography scale', timestamp: daysAgo(5), author: 'Shreya Hambir' },
  },
  {
    id: 'repo_3',
    name: 'claude-designer',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/claude-designer',
    description: 'AI-powered design generator',
    commitCount: 8,
    lastCommit: { message: 'Initial setup', timestamp: daysAgo(14), author: 'Sydney Nguyen' },
  },
]

// Projects the user has connected on the Dashboard. owner/repo IS the
// identifier (matches Timeline's /timeline/:owner/:repo route) — no separate
// synthetic project id. Mutated in place by client.js's createProject mock.
export const mockProjects = [
  { name: 'Lovable App', repo: mockRepos[0], lastUpdated: hoursAgo(2) },
  { name: 'Design System', repo: mockRepos[1], lastUpdated: daysAgo(5) },
]

export const mockActions = [
  {
    id: 'act-rounded-button',
    name: 'Rounded Button',
    description: 'Simple button with shadow and hover state',
    tags: ['component', 'button', 'ui', 'lovable'],
    repoOwner: 'basmah',
    repoName: 'lovable-components',
    startSha: 'e4f5g6h',
    endSha: 'a1b2c3d',
    createdAt: '2026-07-19T14:10:00Z',
  },
]

// A completed job — the frontend polls GET /api/jobs/:id until status is done.
export const mockJob = {
  id: 'job-123',
  type: 'apply-action',
  status: 'done', // queued | running | done | error
  progress: 100,
  result: {
    commitSha: 'abc1234',
    branch: 'apply-action/rounded-button',
    url: 'https://github.com/example/my-claude-app/commit/abc1234',
  },
  error: null,
}
