'use strict';

// Git-only operations for the async "Apply" pipeline: clone a target repo into a
// throwaway OS temp dir, create a branch, write + commit adapted files, push, and
// revert. This module is intentionally decoupled: it receives its GitHub auth
// token as a PARAMETER (a sibling mints short-lived installation tokens) and never
// imports sibling modules.
//
// NOTE ON PR CREATION: opening the pull request AFTER a push is deliberately NOT
// part of this module. The caller does that via Octokit (`octokit.pulls.create`).
// This file stays a pure git layer with no GitHub API surface.
//
// SECURITY:
//   * Shallow fetch (`--depth 1`); for a target sub-path, partial clone
//     (`--filter=blob:none`) + sparse-checkout of only that path.
//   * The token is embedded ONLY in an in-memory remote URL
//     (`https://x-access-token:<TOKEN>@github.com/<owner>/<repo>.git`) that is
//     passed as a command argument to fetch/push. It is NEVER written to the
//     on-disk git config (the stored `origin` remote is the token-less URL) and
//     is NEVER logged (errors are redacted).
//   * All work happens in an `fs.mkdtemp` dir that is always `rm -rf`'d in a
//     `finally` (see `cleanup` / `withRepo`).

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const simpleGit = require('simple-git');

const DEFAULT_AUTHOR = { name: 'iterait-bot', email: 'bot@iterait.dev' };

// Holds the authenticated (token-bearing) remote URL for each git instance,
// in memory only, so push/fetch can authenticate without the token ever being
// persisted to the on-disk `origin` remote. Keyed weakly by the git instance.
const authUrls = new WeakMap();

// Build the two remote URL variants for a repo.
function buildUrls(owner, repo, token) {
  const suffix = `github.com/${owner}/${repo}.git`;
  const clean = `https://${suffix}`;
  const auth = token ? `https://x-access-token:${token}@${suffix}` : clean;
  return { clean, auth };
}

// Remove any embedded token from a string (for safe error messages / logs).
function redact(str) {
  return String(str).replace(/x-access-token:[^@/\s]+@/g, 'x-access-token:***@');
}

// Wrap an async git op so a failure never leaks the token in its message.
async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    const clean = new Error(redact(err && err.message ? err.message : err));
    clean.original = null; // drop the original to avoid leaking the token via cause
    throw clean;
  }
}

/**
 * Clone a repo into a fresh OS temp dir.
 *
 * @param {object} opts
 * @param {string} opts.owner
 * @param {string} opts.repo
 * @param {string} [opts.token]      GitHub token; if falsy, clones the public URL.
 * @param {string} [opts.sparsePath] Restrict checkout to this sub-path (partial + sparse clone).
 * @param {object} [opts.author]     { name, email } for the local commit identity.
 * @param {string} [opts.branch]     Ref to fetch/checkout; defaults to the remote's HEAD.
 * @param {number|null} [opts.depth] Shallow depth (default 1); pass null/0 for full history.
 * @returns {Promise<{ git: import('simple-git').SimpleGit, dir: string }>}
 */
async function cloneRepo({ owner, repo, token, sparsePath, author, branch, depth } = {}) {
  if (!owner || !repo) throw new Error('cloneRepo requires { owner, repo }');

  const { clean, auth } = buildUrls(owner, repo, token);
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'iterait-git-'));

  try {
    const git = simpleGit(dir);
    authUrls.set(git, auth);

    // Init an empty repo and register the TOKEN-LESS remote on disk.
    await git.init();
    await git.addRemote('origin', clean);

    // Local commit identity (never global).
    const who = { ...DEFAULT_AUTHOR, ...(author || {}) };
    await git.addConfig('user.name', who.name);
    await git.addConfig('user.email', who.email);

    // Configure partial + sparse checkout BEFORE fetching, so only the wanted
    // path's blobs are ever downloaded.
    if (sparsePath) {
      await git.raw(['config', 'extensions.partialClone', 'origin']);
      await git.raw(['sparse-checkout', 'init', '--cone']);
      await git.raw(['sparse-checkout', 'set', sparsePath]);
    }

    // Shallow fetch straight from the in-memory authenticated URL. The token
    // lives only in this argv, never in .git/config.
    const useDepth = depth === null || depth === 0 ? null : depth == null ? 1 : depth;
    const ref = branch || 'HEAD';
    const fetchArgs = ['fetch'];
    if (useDepth) fetchArgs.push('--depth', String(useDepth));
    if (sparsePath) fetchArgs.push('--filter=blob:none');
    fetchArgs.push(auth, ref);
    await safe(() => git.raw(fetchArgs));

    // Check out the fetched tip. When a branch name is known, materialize it as a
    // local branch so push has a natural upstream name; otherwise detach on the tip.
    if (branch) {
      await git.raw(['checkout', '-B', branch, 'FETCH_HEAD']);
    } else {
      await git.raw(['checkout', 'FETCH_HEAD']);
    }

    return { git, dir };
  } catch (err) {
    // Never leak a half-built temp dir on failure.
    await cleanup(dir);
    throw err;
  }
}

/**
 * Create and switch to a new local branch.
 * @returns {Promise<void>}
 */
async function createBranch(git, branchName) {
  if (!branchName) throw new Error('createBranch requires a branchName');
  await git.checkoutLocalBranch(branchName);
}

/**
 * Write files (creating parent dirs), stage them, and commit.
 * @param {import('simple-git').SimpleGit} git
 * @param {string} dir Absolute path of the clone.
 * @param {Array<{ path: string, contents: string|Buffer }>} files Paths relative to `dir`.
 * @param {string} message Commit message.
 * @returns {Promise<string>} The new commit sha.
 */
async function writeAndCommit(git, dir, files, message) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('writeAndCommit requires a non-empty files array');
  }

  for (const file of files) {
    if (!file || !file.path) throw new Error('each file needs a { path, contents }');
    const abs = path.join(dir, file.path);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, file.contents == null ? '' : file.contents);
  }

  await git.add(files.map((f) => f.path));
  const res = await git.commit(message);
  // simple-git returns { commit: '<sha>' } (may be short); resolve to full sha.
  return (await git.revparse(['HEAD'])).trim() || res.commit;
}

/**
 * Push a branch to origin, authenticating via the in-memory token URL.
 * @returns {Promise<void>}
 */
async function push(git, branch) {
  if (!branch) throw new Error('push requires a branch name');
  const remote = authUrls.get(git) || 'origin';
  await safe(() => git.raw(['push', remote, `${branch}:refs/heads/${branch}`]));
}

/**
 * Revert a commit on a branch and push the revert.
 * Clones with full history for the branch (revert needs the commit's parent),
 * runs `git revert --no-edit <sha>`, then pushes.
 * @returns {Promise<string>} The revert commit sha.
 */
async function revertCommit({ owner, repo, token, sha, branch, author } = {}) {
  if (!sha || !branch) throw new Error('revertCommit requires { sha, branch }');

  const { git, dir } = await cloneRepo({
    owner,
    repo,
    token,
    author,
    branch,
    depth: null, // full history: revert needs the target commit and its parent
  });

  try {
    await git.raw(['revert', '--no-edit', sha]);
    const revertSha = (await git.revparse(['HEAD'])).trim();
    await push(git, branch);
    return revertSha;
  } finally {
    await cleanup(dir);
  }
}

/**
 * Recursively remove a temp dir. Safe to call more than once.
 * @returns {Promise<void>}
 */
async function cleanup(dir) {
  if (!dir) return;
  await fsp.rm(dir, { recursive: true, force: true });
}

/**
 * High-level helper: clone, run `fn({ git, dir })`, and ALWAYS clean up the temp
 * dir in a `finally` (even if `fn` throws). Returns whatever `fn` returns.
 */
async function withRepo(opts, fn) {
  const { git, dir } = await cloneRepo(opts);
  try {
    return await fn({ git, dir });
  } finally {
    await cleanup(dir);
  }
}

module.exports = {
  cloneRepo,
  createBranch,
  writeAndCommit,
  push,
  revertCommit,
  cleanup,
  withRepo,
  // exported for reuse/testing
  buildUrls,
  redact,
};
