'use strict';

// Standalone smoke test for the GitHub App auth wiring.
//
// Prereqs (set once the GitHub App is registered and installed on a repo):
//   GITHUB_APP_ID
//   GITHUB_APP_PRIVATE_KEY        (raw PEM or base64-encoded PEM)
//   GITHUB_APP_CLIENT_ID
//   GITHUB_APP_CLIENT_SECRET
//   GITHUB_TEST_INSTALLATION_ID   (the installation to test against)
//
// Run:
//   node scripts/test-github-app.js
//
// It mints an installation-scoped Octokit and calls
// GET /installation/repositories, printing how many repos it can access.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { getInstallationOctokit } = require('../services/github/app');

async function main() {
  const installationId = process.env.GITHUB_TEST_INSTALLATION_ID;

  const missing = [];
  if (!process.env.GITHUB_APP_ID) missing.push('GITHUB_APP_ID');
  if (!process.env.GITHUB_APP_PRIVATE_KEY) missing.push('GITHUB_APP_PRIVATE_KEY');
  if (!process.env.GITHUB_APP_CLIENT_ID) missing.push('GITHUB_APP_CLIENT_ID');
  if (!process.env.GITHUB_APP_CLIENT_SECRET) missing.push('GITHUB_APP_CLIENT_SECRET');
  if (!installationId) missing.push('GITHUB_TEST_INSTALLATION_ID');

  if (missing.length) {
    console.error('Cannot run: missing env var(s):');
    for (const name of missing) console.error(`  - ${name}`);
    console.error('\nSet these in backend/.env (or the shell) once the GitHub');
    console.error('App is registered and installed on a repo, then re-run:');
    console.error('  node scripts/test-github-app.js');
    process.exit(1);
  }

  console.log(`Authenticating as installation ${installationId}...`);
  const octokit = getInstallationOctokit(Number(installationId));

  // Paginate to count every accessible repo for this installation.
  const repos = await octokit.paginate('GET /installation/repositories', {
    per_page: 100,
  });

  console.log(`\nSuccess. Installation ${installationId} can access ${repos.length} repo(s):`);
  for (const r of repos) {
    console.log(`  - ${r.full_name}`);
  }
}

main().catch((err) => {
  console.error('\nGitHub App test failed:');
  console.error(`  ${err.message}`);
  if (err.status) console.error(`  HTTP status: ${err.status}`);
  process.exit(1);
});
