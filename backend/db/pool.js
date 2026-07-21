'use strict';

const { Pool } = require('pg');

/**
 * Decide whether SSL should be enabled for a given DATABASE_URL.
 * Managed Postgres (Railway/Neon/DO) requires SSL; local dev does not.
 * We disable SSL only when the host is localhost / 127.0.0.1.
 */
function shouldUseSsl(databaseUrl) {
  if (!databaseUrl) {
    // No URL yet: default to SSL-on so the eventual managed connection works.
    // (Constructing the pool must not throw; it fails on first connect instead.)
    return true;
  }
  try {
    const host = new URL(databaseUrl).hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return false;
    }
    return true;
  } catch (err) {
    // Unparseable URL: let the pool surface the error on first connect.
    return true;
  }
}

const connectionString = process.env.DATABASE_URL;

const poolConfig = { connectionString };
if (shouldUseSsl(connectionString)) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Constructing the Pool does NOT open a connection, so this is import-safe
// even when DATABASE_URL is unset — it only fails on first query/connect.
const pool = new Pool(poolConfig);

/**
 * Run a parameterized query against the pool.
 * @param {string} text
 * @param {Array} [params]
 */
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
