'use strict';

// Standalone smoke test for services/git/gitOps.js — needs NO credentials.
//
// It shallow (+ sparse, if a path is given) clones a small PUBLIC repo, lists the
// checked-out files, creates a branch, writes + commits a dummy file, prints the
// last log line, then cleans up. A push is attempted ONLY when both
// GITHUB_TEST_PUSH_REPO ("owner/repo") and GITHUB_TEST_TOKEN are set.
//
// Usage:
//   node scripts/test-git-ops.js
//   node scripts/test-git-ops.js <owner/repo> [sparsePath]
//
// Optional env for the push leg:
//   GITHUB_TEST_PUSH_REPO=owner/repo   (a throwaway repo you own)
//   GITHUB_TEST_TOKEN=<token with push access>

const fsp = require('fs/promises');
const path = require('path');
const gitOps = require('../services/git/gitOps');

function log(...args) {
  console.log('[test-git-ops]', ...args);
}

async function listFiles(dir) {
  const out = [];
  async function walk(rel) {
    const entries = await fsp.readdir(path.join(dir, rel), { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '.git') continue;
      const childRel = path.join(rel, e.name);
      if (e.isDirectory()) await walk(childRel);
      else out.push(childRel);
    }
  }
  await walk('.');
  return out.sort();
}

async function main() {
  const target = process.argv[2] || 'octocat/Hello-World';
  const sparsePath = process.argv[3] || undefined;
  const [owner, repo] = target.split('/');
  if (!owner || !repo) throw new Error(`invalid <owner/repo>: "${target}"`);

  log(`cloning public repo ${owner}/${repo}${sparsePath ? ` (sparse: ${sparsePath})` : ''} ...`);
  const { git, dir } = await gitOps.cloneRepo({ owner, repo, sparsePath });
  log(`cloned into temp dir: ${dir}`);

  try {
    const files = await listFiles(dir);
    log(`checked-out files (${files.length}):`);
    for (const f of files) log(`  - ${f}`);

    const branch = `iterait-test-${Date.now()}`;
    log(`creating branch: ${branch}`);
    await gitOps.createBranch(git, branch);

    const dummy = {
      path: 'iterait-test-file.txt',
      contents: `iterait git-ops smoke test @ ${new Date().toISOString()}\n`,
    };
    log(`writing + committing dummy file: ${dummy.path}`);
    const sha = await gitOps.writeAndCommit(git, dir, [dummy], 'test: iterait git-ops smoke test');
    log(`commit sha: ${sha}`);

    const oneline = (await git.raw(['log', '--oneline', '-1'])).trim();
    log(`git log --oneline -1: ${oneline}`);

    const pushRepo = process.env.GITHUB_TEST_PUSH_REPO;
    const pushToken = process.env.GITHUB_TEST_TOKEN;
    if (pushRepo && pushToken) {
      const [pOwner, pRepo] = pushRepo.split('/');
      log(`GITHUB_TEST_PUSH_REPO set — re-cloning ${pushRepo} to test a real push ...`);
      const pushed = await gitOps.withRepo(
        { owner: pOwner, repo: pRepo, token: pushToken },
        async ({ git: pGit, dir: pDir }) => {
          const pBranch = `iterait-test-${Date.now()}`;
          await gitOps.createBranch(pGit, pBranch);
          await gitOps.writeAndCommit(pGit, pDir, [dummy], 'test: iterait push smoke test');
          await gitOps.push(pGit, pBranch);
          return pBranch;
        }
      );
      log(`pushed test branch: ${pushed}`);
    } else {
      log('skipping push (set GITHUB_TEST_PUSH_REPO and GITHUB_TEST_TOKEN to enable it)');
    }

    log('SUCCESS');
  } finally {
    log('cleaning up temp dir ...');
    await gitOps.cleanup(dir);
    log('done');
  }
}

main().catch((err) => {
  console.error('[test-git-ops] FAILED:', err && err.message ? err.message : err);
  process.exit(1);
});
