import { NavLink, Outlet } from 'react-router-dom'
import { USE_MOCKS } from '../api/client.js'
import logo from '/iterait-logo.svg'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  designSystems: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 2L3 7l9 5 9-5-9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  ),
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/library', label: 'Components', icon: 'library' },
  { to: '/design-systems', label: 'Design Systems', icon: 'designSystems' },
]

// App shell: sidebar nav + top header (search / avatar) + routed content.
export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <img src={logo} alt="" className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">iterait</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-ink font-medium text-white' : 'text-ink-2 hover:bg-canvas'
                }`
              }
            >
              <span className="h-4 w-4 shrink-0">{ICONS[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
          <div className="flex-1" />
          <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-border bg-canvas px-3.5 py-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-3">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input placeholder="Search..." className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-3" />
          </div>
          <div className="flex flex-1 justify-end">
            <div className="h-8 w-8 rounded-full bg-gradient-hero" />
          </div>
        </header>

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
