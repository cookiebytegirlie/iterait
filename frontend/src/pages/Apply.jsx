import { useState } from 'react'
import { api } from '../api/client.js'

// Apply an Action to a target repo. Demonstrates the async job flow:
// POST apply → get jobId → poll GET /api/jobs/:id until done.
// TODO: real target-repo picker + framework auto-detection + preview.
export default function Apply() {
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [result, setResult] = useState(null)

  async function handleApply() {
    setStatus('running')
    setResult(null)
    try {
      const { jobId } = await api.applyAction('act-rounded-button', {
        targetRepo: 'my-claude-app',
        targetPath: 'src/components/',
        targetFramework: 'React + Tailwind',
      })
      // Poll until the job finishes. Real UI should cap attempts / show progress.
      let job = await api.getJob(jobId)
      while (job.status === 'queued' || job.status === 'running') {
        await new Promise((r) => setTimeout(r, 800))
        job = await api.getJob(jobId)
      }
      if (job.status === 'done') {
        setResult(job.result)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Apply Action</h1>
      <p className="mt-1 text-sm text-ink-2">
        Adapt a saved Action into a target project (clone → Claude adapts → commit).
      </p>

      <div className="mt-6 rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-ink-3">Action</dt>
          <dd>Rounded Button</dd>
          <dt className="text-ink-3">Target repo</dt>
          <dd>my-claude-app</dd>
          <dt className="text-ink-3">Target path</dt>
          <dd>src/components/</dd>
          <dt className="text-ink-3">Framework</dt>
          <dd>React + Tailwind</dd>
        </dl>

        <button
          onClick={handleApply}
          disabled={status === 'running'}
          className="mt-5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'running' ? 'Applying…' : 'Apply'}
        </button>

        {status === 'done' && result && (
          <div className="mt-4 rounded-lg bg-mint/50 p-3 text-sm">
            Applied on branch <code>{result.branch}</code> ·{' '}
            <a href={result.url} className="underline" target="_blank" rel="noreferrer">
              view commit {result.commitSha}
            </a>
          </div>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-red-600">Something went wrong — try again.</p>
        )}
      </div>
    </div>
  )
}
