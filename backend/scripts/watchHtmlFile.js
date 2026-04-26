// iterait local watcher — standalone Node script.
// Watches one local HTML file and creates a new version in iterait whenever
// the file content actually changes on disk.
//
// Quickstart:
//   node scripts/watchHtmlFile.js --file ./index.html --project "My App" --name index.html
//
// With a config file:
//   node scripts/watchHtmlFile.js --config watcher.config.json
//
// CLI args always override config file values.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DEFAULT_BACKEND_URL = process.env.LAYERSYNC_BACKEND_URL || 'http://localhost:4000';
const DEFAULT_SOURCE_TOOL = 'claude-code';
const DEBOUNCE_MS = 700;

// ── CLI parsing ───────────────────────────────────────────────────────────────

function printUsage() {
  console.log(`
Usage:
  node scripts/watchHtmlFile.js --file /path/to/file.html --project "Name" --name file.html [options]
  node scripts/watchHtmlFile.js --config watcher.config.json [overrides]

Required (CLI or config):
  --file       Absolute or relative path to the HTML file to watch
  --project    iterait project name
  --name       File name stored in iterait (must end with .html)

Optional:
  --source     Source tool (default: ${DEFAULT_SOURCE_TOOL})
  --backend    Backend base URL (default: ${DEFAULT_BACKEND_URL})
  --token      JWT — overrides WATCHER_JWT / JWT_TOKEN env vars
  --label      Version label sent on each upload
  --config     Path to a JSON config file (see watcher.config.example.json)
  --help       Show this message
`.trim());
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const k = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) { args[k] = true; continue; }
    args[k] = next;
    i++;
  }
  return args;
}

function loadConfigFile(configPath) {
  const abs = path.resolve(configPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Config file not found: ${abs}`);
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    throw new Error(`Could not parse config file: ${e.message}`);
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function requireString(value, fieldName) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function buildConfig(rawArgs) {
  // Load config file first, then CLI args override
  let merged = { ...rawArgs };
  if (rawArgs.config) {
    const fromFile = loadConfigFile(rawArgs.config);
    merged = { ...fromFile, ...rawArgs }; // CLI wins
  }

  const filePath    = path.resolve(requireString(merged.file,    '--file (or "file" in config)'));
  const projectName = requireString(merged.project, '--project (or "project" in config)');
  const fileName    = requireString(merged.name,    '--name (or "name" in config)');
  const sourceTool  = (merged.source  || DEFAULT_SOURCE_TOOL).trim();
  const backendUrl  = (merged.backend || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');
  const versionLabel = merged.label ? String(merged.label).trim() : '';
  const token       = (merged.token || process.env.WATCHER_JWT || process.env.JWT_TOKEN || '').trim();

  if (!fileName.toLowerCase().endsWith('.html')) {
    throw new Error('name / --name must end with .html');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`--file must point to a file, not a directory: ${filePath}`);
  }
  if (path.extname(filePath).toLowerCase() !== '.html') {
    throw new Error(`Watched file must be an .html file: ${filePath}`);
  }
  if (!token) {
    throw new Error(
      'A JWT is required.\n' +
      '  Option 1: node scripts/generateToken.js  → copy token into backend/.env as WATCHER_JWT\n' +
      '  Option 2: pass --token <jwt> on the command line'
    );
  }

  return { filePath, projectName, fileName, sourceTool, backendUrl, versionLabel, token };
}

// ── Upload ────────────────────────────────────────────────────────────────────

async function uploadVersion(config, reason) {
  const rawHtml = fs.readFileSync(config.filePath, 'utf8');

  if (!rawHtml.trim()) {
    console.warn(`[watcher] Skipping empty file after ${reason}.`);
    return null;
  }

  const form = new FormData();
  form.append('projectName',  config.projectName);
  form.append('fileName',     config.fileName);
  form.append('sourceTool',   config.sourceTool);
  if (config.versionLabel) form.append('versionLabel', config.versionLabel);
  form.append('htmlFile', new Blob([rawHtml], { type: 'text/html' }), config.fileName);

  const response = await fetch(`${config.backendUrl}/versions/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}` },
    body: form,
  });

  let payload = null;
  try { payload = await response.json(); } catch (_) {}

  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  return { rawHtml, payload };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const cliArgs = parseArgs(process.argv.slice(2));

  if (cliArgs.help) { printUsage(); process.exit(0); }

  let config;
  try {
    config = buildConfig(cliArgs);
  } catch (err) {
    console.error(`\n[watcher] Configuration error: ${err.message}\n`);
    printUsage();
    process.exit(1);
  }

  // ── Startup banner ────────────────────────────────────────────────────────
  console.log('');
  console.log('  iterait watcher');
  console.log('  ───────────────────────────────────────');
  console.log(`  File:    ${config.filePath}`);
  console.log(`  Project: ${config.projectName}`);
  console.log(`  Name:    ${config.fileName}`);
  console.log(`  Tool:    ${config.sourceTool}`);
  console.log(`  Backend: ${config.backendUrl}`);
  console.log('  ───────────────────────────────────────');
  console.log('');

  // ── Initial upload ────────────────────────────────────────────────────────
  let lastHash = null;
  try {
    const result = await uploadVersion(config, 'initial import');
    if (result) {
      lastHash = crypto.createHash('sha256').update(result.rawHtml).digest('hex');
      const vNum = result.payload?.version?.version_number;
      const nComp = result.payload?.componentsExtracted;
      console.log(
        `[watcher] ✓ Initial upload complete — version ${vNum}` +
        (typeof nComp === 'number' ? `, ${nComp} components` : '')
      );
    }
  } catch (err) {
    console.error(`[watcher] ✗ Initial upload failed: ${err.message}`);
    // Don't exit — keep watching. Maybe the backend is momentarily unavailable.
  }

  // ── File watcher ──────────────────────────────────────────────────────────
  let debounceId  = null;
  let isUploading = false;
  let queueNext   = false;

  const scheduleUpload = (reason) => {
    if (debounceId) clearTimeout(debounceId);

    debounceId = setTimeout(async () => {
      if (isUploading) { queueNext = true; return; }

      // ── Content-hash dedup ────────────────────────────────────────────────
      let currentContent;
      try {
        currentContent = fs.readFileSync(config.filePath, 'utf8');
      } catch (err) {
        console.warn(`[watcher] Could not read file: ${err.message}`);
        return;
      }

      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      if (currentHash === lastHash) {
        console.log(`[watcher] — Content unchanged after ${reason}, skipping upload.`);
        return;
      }

      isUploading = true;
      try {
        const result = await uploadVersion(config, reason);
        if (result) {
          lastHash = currentHash;
          const vNum  = result.payload?.version?.version_number;
          const nComp = result.payload?.componentsExtracted;
          console.log(
            `[watcher] ✓ ${config.fileName} (${reason}) → version ${vNum}` +
            (typeof nComp === 'number' ? `, ${nComp} components` : '')
          );
        }
      } catch (err) {
        console.error(`[watcher] ✗ Upload failed after ${reason}: ${err.message}`);
      } finally {
        isUploading = false;
        if (queueNext) { queueNext = false; scheduleUpload('queued change'); }
      }
    }, DEBOUNCE_MS);
  };

  fs.watch(config.filePath, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      scheduleUpload(`file ${eventType}`);
    }
  });

  console.log(`[watcher] Watching for changes — Ctrl+C to stop.\n`);
}

main().catch((err) => {
  console.error(`[watcher] Fatal: ${err.message}`);
  process.exit(1);
});
