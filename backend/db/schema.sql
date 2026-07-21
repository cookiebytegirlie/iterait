-- iterait backend schema (idempotent).
-- Run on boot via db/migrate.js. Adapted for the GitHub App auth decision.

CREATE TABLE IF NOT EXISTS users (
  id                     BIGSERIAL PRIMARY KEY,
  github_id              BIGINT UNIQUE,
  github_login           TEXT,
  email                  TEXT,
  avatar_url             TEXT,
  github_installation_id BIGINT,          -- GitHub App installation id
  github_token_enc       TEXT,            -- optional now that tokens are short-lived
  token_scopes           TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name  TEXT NOT NULL,
  framework  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, repo_owner, repo_name)
);

CREATE TABLE IF NOT EXISTS actions (
  id          TEXT PRIMARY KEY,                 -- 'act-…'
  user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  description TEXT,
  repo_owner  TEXT,
  repo_name   TEXT,
  start_sha   TEXT,
  end_sha     TEXT,
  tags        JSONB NOT NULL DEFAULT '[]',
  action_json JSONB,
  code_files  JSONB,                            -- [{ path, contents }]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT PRIMARY KEY,            -- 'job-…'
  user_id          BIGINT REFERENCES users(id) ON DELETE CASCADE,
  action_id        TEXT REFERENCES actions(id) ON DELETE SET NULL,
  type             TEXT,
  status           TEXT NOT NULL DEFAULT 'queued',
  progress         INT NOT NULL DEFAULT 0,
  target_repo      TEXT,
  target_path      TEXT,
  target_framework TEXT,
  result_json      JSONB,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);

CREATE TABLE IF NOT EXISTS action_applications (
  id          BIGSERIAL PRIMARY KEY,
  action_id   TEXT REFERENCES actions(id) ON DELETE CASCADE,
  user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
  target_repo TEXT,
  branch      TEXT,
  commit_sha  TEXT,
  job_id      TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  reverted_at TIMESTAMPTZ,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cache of GitHub commits/diffs to stay under rate limits and cut latency.
CREATE TABLE IF NOT EXISTS github_cache (
  cache_key TEXT PRIMARY KEY,
  value     JSONB,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
