#!/usr/bin/env node
// Standalone smoke test for services/github/read.js.
//
// Builds an Octokit from a personal access token (LOCAL TESTING ONLY — the real
// app uses per-user/installation tokens from a sibling task), runs listCommits
// and getCommitDiff against a target repo, prints the results, and asserts that
// the returned objects have EXACTLY the keys frozen in frontend/src/api/mocks.js.
//
// Env:
//   GITHUB_TEST_TOKEN  a GitHub personal access token (repo read scope)
//   GITHUB_TEST_REPO   "owner/repo" to read from
//
// Run:
//   GITHUB_TEST_TOKEN=ghp_xxx GITHUB_TEST_REPO=owner/repo \
//     node scripts/test-github-read.js

const { Octokit } = require('@octokit/rest');
const { listCommits, getCommitDiff } = require('../services/github/read');

// Exact key contracts from mocks.js (mockCommits[] and mockDiff).
const COMMIT_KEYS = ['sha', 'message', 'author', 'date', 'filesChanged'];
const DIFF_KEYS = ['sha', 'files'];
const DIFF_FILE_KEYS = ['path', 'status', 'additions', 'deletions', 'patch'];

function sameKeys(obj, expected) {
  if (obj == null || typeof obj !== 'object') return false;
  const actual = Object.keys(obj).sort();
  const want = [...expected].sort();
  return actual.length === want.length && actual.every((k, i) => k === want[i]);
}

function report(label, ok, extra) {
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${label}${extra ? ' — ' + extra : ''}`);
  return ok;
}

async function main() {
  const token = process.env.GITHUB_TEST_TOKEN;
  const repoSpec = process.env.GITHUB_TEST_REPO;

  if (!token || !repoSpec) {
    console.error('Missing env. Set both:');
    console.error('  GITHUB_TEST_TOKEN  a GitHub personal access token (repo read)');
    console.error('  GITHUB_TEST_REPO   "owner/repo"');
    console.error('\nExample:');
    console.error('  GITHUB_TEST_TOKEN=ghp_xxx GITHUB_TEST_REPO=owner/repo \\');
    console.error('    node scripts/test-github-read.js');
    process.exit(1);
  }

  const [owner, repo] = repoSpec.split('/');
  if (!owner || !repo) {
    console.error(`GITHUB_TEST_REPO must be "owner/repo", got: ${repoSpec}`);
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  console.log(`\nlistCommits(${owner}/${repo}) ...`);
  const commits = await listCommits(octokit, owner, repo);
  console.log(JSON.stringify(commits.slice(0, 3), null, 2));
  console.log(`(${commits.length} commits returned)\n`);

  let allOk = true;

  if (commits.length === 0) {
    allOk = report('commit shape', false, 'no commits returned to check') && allOk;
  } else {
    const badCommit = commits.find((c) => !sameKeys(c, COMMIT_KEYS));
    allOk = report(
      'commit shape',
      !badCommit,
      badCommit
        ? `expected keys [${COMMIT_KEYS.join(', ')}], got [${Object.keys(badCommit).join(', ')}]`
        : `all ${commits.length} match [${COMMIT_KEYS.join(', ')}]`
    ) && allOk;
  }

  // Diff-check the first commit.
  if (commits.length > 0) {
    const sha = commits[0].sha;
    console.log(`\ngetCommitDiff(${owner}/${repo}, ${sha}) ...`);
    const diff = await getCommitDiff(octokit, owner, repo, sha);
    console.log(JSON.stringify(diff, null, 2).slice(0, 1500));
    console.log('');

    allOk = report(
      'diff shape',
      sameKeys(diff, DIFF_KEYS),
      `expected [${DIFF_KEYS.join(', ')}], got [${Object.keys(diff).join(', ')}]`
    ) && allOk;

    if (Array.isArray(diff.files) && diff.files.length > 0) {
      const badFile = diff.files.find((f) => !sameKeys(f, DIFF_FILE_KEYS));
      allOk = report(
        'diff file shape',
        !badFile,
        badFile
          ? `expected [${DIFF_FILE_KEYS.join(', ')}], got [${Object.keys(badFile).join(', ')}]`
          : `all ${diff.files.length} files match [${DIFF_FILE_KEYS.join(', ')}]`
      ) && allOk;
    } else {
      report('diff file shape', true, 'no files in this commit to check (skipped)');
    }
  }

  console.log(`\n${allOk ? 'ALL SHAPES PASS' : 'SHAPE MISMATCH — see FAIL lines above'}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error('\nError running test:', err.message);
  process.exit(1);
});
