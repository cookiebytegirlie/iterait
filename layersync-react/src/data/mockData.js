// GitHub repos (what GitHub API returns)
export const MOCK_GITHUB_REPOS = [
  {
    id: 'repo_1',
    name: 'my-lovable-app',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/my-lovable-app',
    description: 'Built in Lovable with React',
    stars: 12,
    commitCount: 2458,
    lastCommit: {
      sha: 'abc123def456',
      message: 'Add button component',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      author: 'Sydney Nguyen',
      avatar: 'https://avatars.githubusercontent.com/u/123456',
    },
  },
  {
    id: 'repo_2',
    name: 'design-system-v2',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/design-system-v2',
    description: 'Design tokens and component library',
    stars: 5,
    commitCount: 143,
    lastCommit: {
      sha: 'xyz789',
      message: 'Update typography scale',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      author: 'Shreya Hambir',
      avatar: 'https://avatars.githubusercontent.com/u/789012',
    },
  },
  {
    id: 'repo_3',
    name: 'claude-designer',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/claude-designer',
    description: 'AI-powered design system generator',
    stars: 2,
    commitCount: 8,
    lastCommit: {
      sha: 'rst234',
      message: 'Initial setup',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      author: 'Sydney Nguyen',
      avatar: 'https://avatars.githubusercontent.com/u/123456',
    },
  },
]

// iterait projects (user has created some)
// Note: project.name can differ from repo.name (user can rename)
// Repo info is always shown in metadata
export const MOCK_ITERAIT_PROJECTS = [
  {
    id: 'project_1',
    name: 'Lovable App',
    repo: MOCK_GITHUB_REPOS[0],
    createdAt: new Date('2026-04-15'),
    actionsCount: 8,
  },
  {
    id: 'project_2',
    name: 'Design System',
    repo: MOCK_GITHUB_REPOS[1],
    createdAt: new Date('2026-04-18'),
    actionsCount: 3,
  },
]

// Commits for a project (what backend will return)
export const MOCK_COMMITS = [
  {
    sha: 'abc123def456',
    message: 'Add button component',
    author: 'Sydney Nguyen',
    avatar: 'https://avatars.githubusercontent.com/u/123456',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    filesChanged: 2,
    additions: 145,
    deletions: 0,
    diff: {
      files: [
        { filename: 'src/components/Button.jsx', status: 'added', additions: 145, deletions: 0, patch: 'export default function Button...' },
        { filename: 'src/styles/button.css', status: 'modified', additions: 32, deletions: 12, patch: '.button { border-radius: 8px; ...' },
      ],
    },
  },
  {
    sha: 'def456ghi789',
    message: 'Fix responsive layout on mobile',
    author: 'Basmah Masood',
    avatar: 'https://avatars.githubusercontent.com/u/234567',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    filesChanged: 5,
    additions: 203,
    deletions: 89,
    diff: {
      files: [
        { filename: 'src/components/Nav.jsx', status: 'modified', additions: 61, deletions: 34, patch: '...' },
        { filename: 'src/components/Card.jsx', status: 'modified', additions: 48, deletions: 20, patch: '...' },
        { filename: 'src/styles/layout.css', status: 'modified', additions: 94, deletions: 35, patch: '...' },
      ],
    },
  },
  {
    sha: 'ghi789jkl012',
    message: 'Update color palette',
    author: 'Shreya Hambir',
    avatar: 'https://avatars.githubusercontent.com/u/345678',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    filesChanged: 3,
    additions: 67,
    deletions: 45,
    diff: {
      files: [
        { filename: 'src/styles/tokens.css', status: 'modified', additions: 40, deletions: 30, patch: '...' },
        { filename: 'src/components/Badge.jsx', status: 'modified', additions: 27, deletions: 15, patch: '...' },
      ],
    },
  },
  {
    sha: 'jkl012mno345',
    message: 'Initial setup',
    author: 'Sydney Nguyen',
    avatar: 'https://avatars.githubusercontent.com/u/123456',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    filesChanged: 12,
    additions: 480,
    deletions: 0,
    diff: {
      files: [
        { filename: 'package.json', status: 'added', additions: 24, deletions: 0, patch: '...' },
        { filename: 'src/App.jsx', status: 'added', additions: 56, deletions: 0, patch: '...' },
      ],
    },
  },
]

// Saved Actions (user has saved some)
export const MOCK_ACTIONS = [
  {
    id: 'action_1',
    name: 'Rounded button component',
    description: 'Button with 8px radius, soft shadow, and hover state',
    tags: ['button', 'component', 'ui'],
    projectId: 'project_1',
    commitSha: 'abc123def456',
    createdAt: new Date('2026-04-20'),
    appliedCount: 2,
  },
  {
    id: 'action_2',
    name: 'Responsive grid layout',
    description: '3-column grid that collapses to 1 on mobile',
    tags: ['layout', 'responsive'],
    projectId: 'project_1',
    commitSha: 'def456ghi789',
    createdAt: new Date('2026-04-19'),
    appliedCount: 1,
  },
]

export const ACTION_TAG_SUGGESTIONS = ['button', 'component', 'ui', 'layout', 'responsive', 'typography', 'color', 'react']
