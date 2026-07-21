// GitHub read service: commit history + per-commit diffs.
//
// Fully decoupled from auth and db. Callers pass in:
//   - `octokit`: an authenticated @octokit/rest instance (built by a sibling task)
//   - `cache` (optional): { get(key) -> Promise<value|null>, set(key, value) -> Promise }
//
// Response shapes are a HARD CONTRACT frozen by the frontend
// (see frontend/src/api/mocks.js — `mockCommits` and `mockDiff`):
//   commit -> { sha, message, author, date, filesChanged }
//   diff   -> { sha, files: [{ path, status, additions, deletions, patch }] }

// Max concurrent getCommit calls when hydrating filesChanged for a commit list.
const FILES_CHANGED_CONCURRENCY = 5;
const COMMITS_PER_PAGE = 30;

// Run an async mapper over `items` with a bounded number of in-flight promises.
// Preserves input order in the returned results array.
async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await mapper(items[i], i);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// Fetch the filesChanged count for a single commit, using the cache if present.
// This is the N+1 half of listCommits (see note there).
async function getFilesChanged(octokit, owner, repo, sha, cache) {
  const cacheKey = `filesChanged:${owner}/${repo}/${sha}`;
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached != null) return cached;
  }
  const { data } = await octokit.repos.getCommit({ owner, repo, ref: sha });
  const count = Array.isArray(data.files) ? data.files.length : 0;
  if (cache) await cache.set(cacheKey, count);
  return count;
}

/**
 * List recent commits for a repo (page 1).
 *
 * @returns Array<{ sha, message, author, date, filesChanged }>
 *
 * NOTE (N+1 tradeoff): the list payload from repos.listCommits does NOT include
 * the number of files changed per commit. To populate `filesChanged` we make an
 * extra repos.getCommit call per commit. That is an N+1 fan-out, so we bound it
 * with a small concurrency cap and cache each result. For a ~30-commit page this
 * is acceptable; if it ever becomes a hot path, drop `filesChanged` from the
 * list view or precompute it during ingestion.
 */
async function listCommits(octokit, owner, repo, opts = {}) {
  const perPage = opts.perPage || COMMITS_PER_PAGE;
  const cacheKey = `commits:${owner}/${repo}`;
  const cache = opts.cache || null;

  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached != null) return cached;
  }

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: perPage,
    page: 1,
  });

  const result = await mapWithConcurrency(
    commits,
    FILES_CHANGED_CONCURRENCY,
    async (c) => {
      const commit = c.commit || {};
      const gitAuthor = commit.author || {};
      // Prefer the git commit author's name; fall back to the GitHub login.
      const author = gitAuthor.name || (c.author && c.author.login) || null;
      const filesChanged = await getFilesChanged(octokit, owner, repo, c.sha, cache);
      return {
        sha: c.sha,
        message: commit.message,
        author,
        date: gitAuthor.date,
        filesChanged,
      };
    }
  );

  if (cache) await cache.set(cacheKey, result);
  return result;
}

/**
 * Get the diff (per-file patches) for a single commit.
 *
 * @returns { sha, files: [{ path, status, additions, deletions, patch }] }
 */
async function getCommitDiff(octokit, owner, repo, sha, opts = {}) {
  const cache = opts.cache || null;
  const cacheKey = `diff:${owner}/${repo}/${sha}`;

  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached != null) return cached;
  }

  const { data } = await octokit.repos.getCommit({ owner, repo, ref: sha });
  const files = Array.isArray(data.files) ? data.files : [];

  const result = {
    sha,
    files: files.map((f) => ({
      path: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch != null ? f.patch : '',
    })),
  };

  if (cache) await cache.set(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// EXAMPLE ONLY — how a caller would wire a Postgres-backed cache to the
// `github_cache` table provisioned by a sibling task. This is intentionally
// NOT exported: the service above stays DB-agnostic. A caller would build this
// and pass it in as `opts.cache`.
//
//   function makePgCache(pool) {
//     return {
//       async get(key) {
//         const { rows } = await pool.query(
//           'SELECT value FROM github_cache WHERE key = $1', [key]
//         );
//         return rows.length ? rows[0].value : null; // value is JSONB
//       },
//       async set(key, value) {
//         await pool.query(
//           `INSERT INTO github_cache (key, value, updated_at)
//              VALUES ($1, $2, now())
//            ON CONFLICT (key) DO UPDATE
//              SET value = EXCLUDED.value, updated_at = now()`,
//           [key, value]
//         );
//       },
//     };
//   }
//
//   // usage: listCommits(octokit, owner, repo, { cache: makePgCache(pool) })
// ---------------------------------------------------------------------------

module.exports = { listCommits, getCommitDiff };
