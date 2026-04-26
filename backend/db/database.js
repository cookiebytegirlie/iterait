const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'layersync.db'));

db.pragma('foreign_keys = ON');

// All CREATE TABLE statements are safe to run on existing databases.
// New tables are created fresh; existing tables are left untouched here
// and migrated column-by-column below.
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name       TEXT NOT NULL,
    source_tool TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS versions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id           INTEGER NOT NULL,
    version_number    INTEGER NOT NULL,
    label             TEXT,
    raw_html          TEXT NOT NULL,
    preview_image_url TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS components (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id    INTEGER NOT NULL,
    name          TEXT,
    selector_hint TEXT,
    html_chunk    TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS change_sets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    old_version_id INTEGER,
    new_version_id INTEGER NOT NULL,
    summary_json   TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (old_version_id) REFERENCES versions(id) ON DELETE SET NULL,
    FOREIGN KEY (new_version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS action_chains (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id               INTEGER NOT NULL,
    source_version_id     INTEGER NOT NULL,
    name                  TEXT NOT NULL,
    selected_changes_json TEXT NOT NULL,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id)           REFERENCES files(id)    ON DELETE CASCADE,
    FOREIGN KEY (source_version_id) REFERENCES versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prompt_generations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    action_chain_id INTEGER NOT NULL,
    target_tool     TEXT NOT NULL,
    prompt_text     TEXT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_chain_id) REFERENCES action_chains(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS access_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id    INTEGER,
    event_type TEXT NOT NULL,
    timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  );
`);

// Column-level migrations for tables that existed before the pivot.
// ALTER TABLE ADD COLUMN is always safe — SQLite ignores nothing, fails only
// if the column already exists, which the guard below prevents.
function addCol(table, column, definition) {
  const exists = db.pragma(`table_info(${table})`).some(c => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// files: old schema had platform/thumbnail_url/figma_file_key instead of project_id/source_tool
addCol('files', 'project_id',  'INTEGER');
addCol('files', 'source_tool', 'TEXT');

// versions: old schema had description/timestamp instead of label/raw_html/preview_image_url
addCol('versions', 'label',             'TEXT');
addCol('versions', 'raw_html',          "TEXT NOT NULL DEFAULT ''");
addCol('versions', 'preview_image_url', 'TEXT');
addCol('versions', 'content_hash',      'TEXT');

module.exports = db;
