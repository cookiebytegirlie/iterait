'use strict';

const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const TABLES = [
  'users',
  'projects',
  'actions',
  'jobs',
  'action_applications',
  'github_cache',
];

/**
 * Read schema.sql and execute it through the pool.
 * The DDL is idempotent (CREATE TABLE IF NOT EXISTS), so this is safe to
 * run repeatedly, including on every boot.
 */
async function runMigrations() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(sql);
  return TABLES;
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations()
    .then((tables) => {
      console.log(
        `Migrations complete. Tables ensured: ${tables.join(', ')}`
      );
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err.message);
      pool.end().finally(() => process.exit(1));
    });
}
