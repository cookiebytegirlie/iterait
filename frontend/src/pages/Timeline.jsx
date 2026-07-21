import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useCommits } from '../hooks/useCommits.js'
import CommitList from '../components/CommitList.jsx'
import CommitDetail from '../components/CommitDetail.jsx'
import SaveActionDialog from '../components/SaveActionDialog.jsx'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// Commit history as a version timeline: commit list on the left, selected
// commit's details in the middle, Actions panel on the right.
// TODO: diff viewer is a placeholder until Shreya's design is ready.
export default function Timeline() {
  const { owner, repo } = useParams()
  const { commits, loading, error, hasMore, total, loadMore } = useCommits(owner, repo)
  const [selectedShaOverride, setSelectedShaOverride] = useState(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [toast, setToast] = useState(null)

  // Discard the user's manual selection when navigating to a different repo
  // (adjusted during render rather than in an effect — see react.dev
  // "Adjusting state when a prop changes").
  const routeKey = `${owner}/${repo}`
  const [loadedRouteKey, setLoadedRouteKey] = useState(routeKey)
  if (routeKey !== loadedRouteKey) {
    setLoadedRouteKey(routeKey)
    setSelectedShaOverride(null)
  }

  // No selection yet → default to the first commit once it's loaded.
  const selectedSha = selectedShaOverride ?? commits[0]?.sha ?? null

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const selectedCommit = commits.find((c) => c.sha === selectedSha) || null
  const githubCommitUrl = selectedCommit ? `https://github.com/${owner}/${repo}/commit/${selectedCommit.sha}` : null

  async function handleSaveAction({ name, description, tags }) {
    await api.saveAction({
      name,
      description,
      tags,
      repo: `${owner}/${repo}`,
      startSha: selectedCommit.sha,
      endSha: selectedCommit.sha,
    })
    setShowSaveDialog(false)
    setToast('Action saved!')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Link to="/dashboard" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <span className="font-medium text-ink">{owner}/{repo}</span>
        </div>
        <Link to="/dashboard" className="text-sm text-ink-2 hover:text-ink">← Back to Dashboard</Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_220px]">
        <div className="h-[70vh] lg:h-[calc(100vh-180px)]">
          <CommitList
            commits={commits}
            selectedSha={selectedSha}
            onSelectCommit={setSelectedShaOverride}
            isLoading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </div>

        <CommitDetail commit={selectedCommit} isLoading={loading && commits.length === 0} githubCommitUrl={githubCommitUrl} />

        <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Actions</h3>
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!selectedCommit}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save as Action
          </button>
          {githubCommitUrl && (
            <a
              href={githubCommitUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-ink-2"
            >
              View on GitHub
            </a>
          )}

          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-4 text-sm text-ink-2">
            <span>{total.toLocaleString()} commits total</span>
            {commits[0] && <span className="text-ink-3">Last commit {timeAgo(commits[0].timestamp)}</span>}
          </div>
        </div>
      </div>

      <SaveActionDialog
        key={selectedCommit?.sha}
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveAction}
        commit={selectedCommit}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)]">
          {toast}
        </div>
      )}
    </div>
  )
}
