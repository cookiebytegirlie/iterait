import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'

// Commit history as a version timeline. This stub already fetches commits
// through the API client (mock or live) so the team has a working reference
// for wiring. TODO: side-by-side diff view + "Save as Action" dialog.
export default function Timeline() {
  const { owner, repo } = useParams()
  const [commits, setCommits] = useState([])
  const [selected, setSelected] = useState(null)
  const [diff, setDiff] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .listCommits(owner, repo)
      .then((data) => alive && setCommits(data))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [owner, repo])

  function openCommit(sha) {
    setSelected(sha)
    setDiff(null)
    api.getCommitDiff(owner, repo, sha).then(setDiff).catch((e) => setError(e.message))
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        {owner}/{repo}
      </h1>
      <p className="mt-1 text-sm text-ink-2">Commit history — each commit is a version.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-[1fr_1.2fr] gap-6">
        <ul className="flex flex-col gap-2">
          {commits.map((c) => (
            <li key={c.sha}>
              <button
                onClick={() => openCommit(c.sha)}
                className={`w-full rounded-[14px] border bg-surface p-4 text-left shadow-[var(--shadow-soft)] transition-colors ${
                  selected === c.sha ? 'border-ink' : 'border-border hover:border-ink-3'
                }`}
              >
                <div className="text-sm font-medium">{c.message}</div>
                <div className="mt-1 text-xs text-ink-3">
                  {c.sha.slice(0, 7)} · {c.author} · {c.filesChanged} file(s)
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          {!selected && <p className="text-sm text-ink-3">Select a commit to see its diff.</p>}
          {selected && !diff && <p className="text-sm text-ink-3">Loading diff…</p>}
          {diff &&
            diff.files.map((f) => (
              <div key={f.path}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{f.path}</span>
                  <span className="text-xs text-ink-3">
                    +{f.additions} −{f.deletions}
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-canvas p-3 text-xs leading-relaxed">
                  {f.patch}
                </pre>
              </div>
            ))}
          {diff && (
            <button className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
              Save as Action
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
