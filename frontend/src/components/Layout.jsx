import { NavLink, Outlet } from 'react-router-dom'
import { USE_MOCKS } from '../api/client.js'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/timeline/basmah/lovable-components', label: 'Timeline' },
  { to: '/actions', label: 'Actions' },
  { to: '/apply', label: 'Apply' },
]

// App shell: sidebar nav + routed content. Intentionally minimal — the
// frontend team owns the real navigation/branding. This just wires the
// pages together so every route is reachable from day one.
export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 px-2 text-lg font-semibold tracking-tight">iterait</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-canvas font-medium text-ink' : 'text-ink-2 hover:bg-canvas'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {USE_MOCKS && (
          <div className="border-b border-border bg-butter/50 px-6 py-1.5 text-center text-xs text-ink-2">
            Mock mode — set <code>VITE_USE_MOCKS=false</code> once the backend is live
          </div>
        )}
        <main className="min-w-0 flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
