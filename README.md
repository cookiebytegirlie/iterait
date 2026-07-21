# iterait

**Git-based version control for cross-platform design components.**

Designers and devs build components in Lovable, Claude, Cursor, or Figma and push
to GitHub. iterait reads the commit history and shows it as a visual version
timeline, lets you save changes as reusable **Actions**, and can **apply** an
Action to another project — adapting the code to fit — via an AI agent.

> Git does the heavy lifting; iterait is a better UI on top of it.
> Full concept and flows: [`docs/iterait-build-flow.md`](docs/iterait-build-flow.md).

## Repo layout

| Path | What | Owner |
| --- | --- | --- |
| [`frontend/`](frontend/) | React + Vite + Tailwind web app | Frontend team |
| [`backend/`](backend/) | Node API / agent (GitHub + Claude + jobs) | Backend |
| [`docs/`](docs/) | Build-flow doc + historical context | Everyone |

This is a **monorepo**: frontend and backend live side by side and deploy
separately (frontend → Vercel, backend → DigitalOcean).

## Quickstart

**Frontend** (runs standalone on mock data — no backend needed):

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev            # http://localhost:5173
```

**Backend:** see [`backend/`](backend/) (its own setup; being redirected to the
Git-based model described in the build-flow doc).

## Working together

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch/PR workflow and who works
where. Short version: **frontend team works in `frontend/`**, opens PRs into the
default branch, and doesn't need to touch `backend/`.

## History

The original HTML-upload prototype (branded "LayerSync") is archived at the
`pre-git-pivot` git tag and summarized in
[`docs/project-context.md`](docs/project-context.md).
