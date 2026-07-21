// Canned data returned by the API client when VITE_USE_MOCKS === 'true'.
// Lets the frontend run end-to-end before the backend agent exists.
// Shapes here are the contract the real backend should match — keep them in
// sync with docs/iterait-build-flow.md as endpoints go live.

export const mockCommits = [
  {
    sha: 'a1b2c3d',
    message: 'Style button: rounded corners + shadow',
    author: 'Basmah',
    date: '2026-07-19T14:03:00Z',
    filesChanged: 1,
  },
  {
    sha: 'e4f5g6h',
    message: 'Add rounded button component',
    author: 'Basmah',
    date: '2026-07-18T09:41:00Z',
    filesChanged: 1,
  },
  {
    sha: 'i7j8k9l',
    message: 'Initial commit',
    author: 'Basmah',
    date: '2026-07-17T17:20:00Z',
    filesChanged: 12,
  },
]

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
