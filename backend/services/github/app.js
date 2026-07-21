'use strict';

// GitHub App authentication.
//
// The product authenticates as a GitHub App with per-repo installations and
// short-lived installation access tokens minted by @octokit/auth-app. This
// module exposes:
//   getAppOctokit()                     -> Octokit authed as the App (JWT)
//   getInstallationOctokit(id)          -> Octokit authed for an installation
//   getInstallationToken(id)            -> the raw installation token string
//   getInstallationForRepo(owner, repo) -> the installation id for a repo
//
// Env is validated LAZILY (when a function is actually called) so that simply
// requiring this module never throws — keeping it import-safe for tests.

const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

// Resolve the App private key from env. Accepts a raw PEM or a base64-encoded
// PEM (common when passing multi-line secrets through env vars / dashboards).
function resolvePrivateKey() {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw || !raw.trim()) {
    throw new Error('GITHUB_APP_PRIVATE_KEY is not set.');
  }

  const value = raw.trim();

  // Already a PEM.
  if (value.includes('BEGIN') && value.includes('PRIVATE KEY')) {
    // Normalize literal "\n" sequences (some env stores escape newlines).
    return value.replace(/\\n/g, '\n');
  }

  // Otherwise assume base64-encoded PEM and decode it.
  const decoded = Buffer.from(value, 'base64').toString('utf8');
  if (decoded.includes('BEGIN') && decoded.includes('PRIVATE KEY')) {
    return decoded;
  }

  throw new Error(
    'GITHUB_APP_PRIVATE_KEY is not a valid PEM (raw or base64-encoded).'
  );
}

// Gather and validate all required App credentials. Throws with a clear message.
function loadAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  const missing = [];
  if (!appId || !String(appId).trim()) missing.push('GITHUB_APP_ID');
  if (!clientId || !String(clientId).trim()) missing.push('GITHUB_APP_CLIENT_ID');
  if (!clientSecret || !String(clientSecret).trim()) {
    missing.push('GITHUB_APP_CLIENT_SECRET');
  }
  if (!process.env.GITHUB_APP_PRIVATE_KEY) missing.push('GITHUB_APP_PRIVATE_KEY');

  if (missing.length) {
    throw new Error(
      `Missing required GitHub App env: ${missing.join(', ')}.`
    );
  }

  return {
    appId: String(appId).trim(),
    privateKey: resolvePrivateKey(),
    clientId: String(clientId).trim(),
    clientSecret: String(clientSecret).trim(),
  };
}

// Octokit authenticated as the App itself (JWT) for app-level API calls
// such as looking up installations.
function getAppOctokit() {
  const cfg = loadAppConfig();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: cfg.appId,
      privateKey: cfg.privateKey,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
    },
  });
}

// Octokit scoped to a specific installation. auth-app mints and transparently
// refreshes the short-lived installation token as requests are made.
function getInstallationOctokit(installationId) {
  if (!installationId) {
    throw new Error('getInstallationOctokit() requires an installationId.');
  }
  const cfg = loadAppConfig();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: cfg.appId,
      privateKey: cfg.privateKey,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      installationId,
    },
  });
}

// The raw installation access token string. A sibling git service uses this to
// authenticate `git push` over HTTPS (x-access-token:<token>). The token is
// short-lived (~1h); callers should fetch it just-in-time and never persist it.
async function getInstallationToken(installationId) {
  if (!installationId) {
    throw new Error('getInstallationToken() requires an installationId.');
  }
  const cfg = loadAppConfig();
  const auth = createAppAuth({
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
  });
  const result = await auth({ type: 'installation', installationId });
  return result.token;
}

// Look up the installation id for a given repo via the app-level API.
async function getInstallationForRepo(owner, repo) {
  if (!owner || !repo) {
    throw new Error('getInstallationForRepo() requires owner and repo.');
  }
  const appOctokit = getAppOctokit();
  const { data } = await appOctokit.apps.getRepoInstallation({ owner, repo });
  return data.id;
}

module.exports = {
  getAppOctokit,
  getInstallationOctokit,
  getInstallationToken,
  getInstallationForRepo,
};
