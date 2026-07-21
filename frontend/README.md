# iterait — frontend

React + Vite + Tailwind v4. The web UI for iterait (Git-based version control
for cross-platform design components).

## Quickstart

```bash
cd frontend
cp .env.example .env.local   # keep VITE_USE_MOCKS=true until the backend is live
npm install
npm run dev                  # http://localhost:5173
```

The app runs fully on **mock data** out of the box — you don't need the backend
to start building UI. Flip `VITE_USE_MOCKS=false` (and point `VITE_API_BASE` at a
running backend) when the API is ready.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |

## Where things live

```
src/
  main.jsx            App entry + <BrowserRouter>
  App.jsx             Route map (matches docs/iterait-build-flow.md)
  index.css           Tailwind import + iterait design tokens (@theme)
  components/
    Layout.jsx        Sidebar nav shell
  pages/
    Dashboard.jsx     Connect repo / projects
    Timeline.jsx      Commit history + diff + "Save as Action"
    Actions.jsx       Actions library + "Apply"
    Apply.jsx         Apply an Action (async job flow)
    AuthCallback.jsx  GitHub OAuth callback (stub)
  api/
    client.js         The one place that talks to the backend
    mocks.js          Canned data used when VITE_USE_MOCKS=true
```

The pages are **stubs** — clear, wired entry points. Routing, the theme, the nav
shell, and the API client are already set up; build the real UI inside the pages.

## Talking to the backend

All backend calls go through `src/api/client.js`. Its endpoints mirror the team
build-flow doc (`../docs/iterait-build-flow.md`). To add one: add a method to
`api` in `client.js` and a matching mock in `mocks.js`. Don't call `fetch`
directly from pages — keep it in the client so mock/live stays a one-flag switch.

## Design tokens

Colors, fonts, radius, and shadow live as `@theme` tokens in `src/index.css`
(warm off-white canvas, white cards, Inter, pastel accents). Use the token
utilities (`bg-surface`, `text-ink-2`, `border-border`, …) instead of raw hex.

## Deploy

Vercel, root directory `frontend/`. SPA rewrite is in `frontend/vercel.json`.
