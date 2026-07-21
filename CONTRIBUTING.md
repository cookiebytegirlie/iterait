# Contributing to iterait

A short guide so the team can work in parallel without stepping on each other.

## Who works where

- **Frontend team** → `frontend/`. You don't need the backend to start — the app
  runs on mock data (`VITE_USE_MOCKS=true`). Build pages against the API client
  in `frontend/src/api/client.js`.
- **Backend** → `backend/`. GitHub integration, Claude adaptation, job queue.
- Please stay in your folder. If a change needs both (e.g. a new API endpoint),
  agree on the request/response **shape** first, then build against a mock.

## Branch & PR workflow

1. Branch off the default branch: `git checkout -b <area>/<short-description>`
   (e.g. `frontend/timeline-diff`, `backend/save-action`).
2. Commit in small, clear steps.
3. Push and open a **PR into the default branch**. Keep PRs focused.
4. At least one teammate reviews before merge.
5. Don't commit secrets — use `.env.local` (gitignored). `frontend/.env.example`
   documents the vars.

## Running the frontend

```bash
cd frontend
cp .env.example .env.local     # VITE_USE_MOCKS=true to start
npm install
npm run dev
npm run lint                   # before pushing
```

## Adding a backend call (frontend)

All backend calls go through `frontend/src/api/client.js`. To add one:

1. Add a method to the `api` object in `client.js`.
2. Add a matching mock in `frontend/src/api/mocks.js`.
3. Use it from a page via `import { api } from '../api/client.js'`.

Endpoint shapes mirror [`docs/iterait-build-flow.md`](docs/iterait-build-flow.md)
— keep them in sync as the backend goes live.

## Definition of done

See the "Definition of Done" checklists in
[`docs/iterait-build-flow.md`](docs/iterait-build-flow.md).
