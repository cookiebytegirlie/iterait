import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

// Library of saved Actions. Fetches through the API client (mock or live).
// TODO: search/filter, and richer Action cards.
export default function Actions() {
  const [actions, setActions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .listActions()
      .then((data) => alive && setActions(data))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Actions</h1>
      <p className="mt-1 text-sm text-ink-2">
        Reusable design changes you can apply to other projects.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4">
        {actions.map((a) => (
          <div
            key={a.id}
            className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="text-sm font-medium">{a.name}</div>
            <div className="mt-1 text-xs text-ink-2">{a.description}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(a.tags || []).map((t) => (
                <span key={t} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-3">
                  {t}
                </span>
              ))}
            </div>
            <Link
              to="/apply"
              className="mt-4 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              Apply this Action
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
