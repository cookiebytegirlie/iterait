// SECURITY NOTE: Uploaded HTML is untrusted user content.
// Never execute or server-render it. The frontend must display versions inside
// a sandboxed <iframe sandbox=""> so that user-supplied scripts and event
// handlers cannot escape into the parent page.

const router    = require('express').Router();
const crypto    = require('crypto');
const multer    = require('multer');
const rateLimit = require('express-rate-limit');
const { authMiddleware }    = require('../middleware/auth');
const db                    = require('../db/database');
const { compareHtml }       = require('../utils/htmlCompare');
const { extractComponents } = require('../utils/extractComponents');
const { isPositiveInt, MAX } = require('../utils/validate');

router.use(authMiddleware);

// ── Multer — memory storage, 2 MB hard cap ──────────────────────────────────
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
});

// ── Rate limiters (per IP, in-memory) ──────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many uploads. Please wait before trying again.' },
});

const compareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many comparison requests. Please wait before trying again.' },
});

const restoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many restore requests. Please wait before trying again.' },
});

// ── POST /versions/upload ───────────────────────────────────────────────────
router.post('/upload', uploadLimiter, (req, res, next) => {
  // Run multer inline so we can intercept its own errors cleanly.
  upload.single('htmlFile')(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum upload size is ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
      });
    }
    if (err) return next(err);

    // ── Field validation ──────────────────────────────────────────────────
    const projectName  = (req.body.projectName  || '').trim();
    const fileName     = (req.body.fileName     || '').trim();
    const sourceTool   = (req.body.sourceTool   || '').trim() || null;
    const versionLabel = (req.body.versionLabel || '').trim() || null;

    if (!projectName) return res.status(400).json({ error: 'projectName is required' });
    if (!fileName)    return res.status(400).json({ error: 'fileName is required' });

    if (projectName.length > MAX.projectName)
      return res.status(400).json({ error: `projectName must be ${MAX.projectName} characters or fewer` });
    if (fileName.length > MAX.fileName)
      return res.status(400).json({ error: `fileName must be ${MAX.fileName} characters or fewer` });
    if (sourceTool && sourceTool.length > MAX.sourceTool)
      return res.status(400).json({ error: `sourceTool must be ${MAX.sourceTool} characters or fewer` });
    if (versionLabel && versionLabel.length > MAX.label)
      return res.status(400).json({ error: `versionLabel must be ${MAX.label} characters or fewer` });

    if (!fileName.toLowerCase().endsWith('.html'))
      return res.status(400).json({ error: 'fileName must end with .html' });

    // ── File validation ───────────────────────────────────────────────────
    if (!req.file) return res.status(400).json({ error: 'htmlFile is required' });
    if (req.file.size === 0) return res.status(400).json({ error: 'Uploaded file is empty' });

    const originalName = req.file.originalname || '';
    if (!originalName.toLowerCase().endsWith('.html'))
      return res.status(400).json({ error: 'Uploaded file must be an .html file' });

    // ── Content hash (integrity) ──────────────────────────────────────────
    const rawHtml     = req.file.buffer.toString('utf8');
    const contentHash = crypto.createHash('sha256').update(rawHtml).digest('hex');

    // ── Upsert project ────────────────────────────────────────────────────
    let project = db.prepare('SELECT * FROM projects WHERE name = ?').get(projectName);
    if (!project) {
      const result = db.prepare('INSERT INTO projects (name) VALUES (?)').run(projectName);
      project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    }

    // ── Upsert file within project ────────────────────────────────────────
    let file = db
      .prepare('SELECT * FROM files WHERE project_id = ? AND name = ?')
      .get(project.id, fileName);
    if (!file) {
      const result = db
        .prepare('INSERT INTO files (project_id, name, source_tool) VALUES (?, ?, ?)')
        .run(project.id, fileName, sourceTool);
      file = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);
    }

    // ── Increment version number ──────────────────────────────────────────
    const last = db
      .prepare('SELECT MAX(version_number) AS max FROM versions WHERE file_id = ?')
      .get(file.id);
    const nextVersion = (last?.max ?? 0) + 1;

    const versionResult = db
      .prepare('INSERT INTO versions (file_id, version_number, label, raw_html, content_hash) VALUES (?, ?, ?, ?, ?)')
      .run(file.id, nextVersion, versionLabel, rawHtml, contentHash);
    const version = db
      .prepare(`SELECT id, file_id, version_number, label, preview_image_url, content_hash, created_at
                FROM versions WHERE id = ?`)
      .get(versionResult.lastInsertRowid);

    db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'upload')").run(file.id);

    // ── Extract and store restorable components ───────────────────────────
    const insertComp = db.prepare(
      'INSERT INTO components (version_id, name, selector_hint, html_chunk) VALUES (?, ?, ?, ?)'
    );
    const saveComponents = db.transaction((vId, comps) => {
      for (const c of comps) insertComp.run(vId, c.name, c.selector_hint, c.html_chunk);
    });
    const extracted = extractComponents(rawHtml);
    saveComponents(version.id, extracted);

    return res.status(201).json({ project, file, version, componentsExtracted: extracted.length });
  });
});

// ── GET /versions/files ─────────────────────────────────────────────────────
router.get('/files', (_req, res) => {
  const files = db.prepare(`
    SELECT f.*, p.name AS project_name
    FROM files f
    JOIN projects p ON p.id = f.project_id
    ORDER BY f.created_at DESC
  `).all();
  return res.json(files);
});

// ── GET /versions/files/:fileId/versions ────────────────────────────────────
router.get('/files/:fileId/versions', (req, res) => {
  if (!isPositiveInt(req.params.fileId))
    return res.status(400).json({ error: 'fileId must be a positive integer' });

  const fileId = Number(req.params.fileId);

  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const versions = db.prepare(`
    SELECT id, file_id, version_number, label, preview_image_url, content_hash, created_at
    FROM versions
    WHERE file_id = ?
    ORDER BY version_number DESC
  `).all(fileId);

  return res.json(versions);
});

// ── POST /versions/compare ──────────────────────────────────────────────────
router.post('/compare', compareLimiter, (req, res) => {
  const { versionAId, versionBId } = req.body;

  if (!versionAId || !versionBId)
    return res.status(400).json({ error: 'versionAId and versionBId are required' });
  if (!isPositiveInt(versionAId) || !isPositiveInt(versionBId))
    return res.status(400).json({ error: 'versionAId and versionBId must be positive integers' });

  const versionA = db.prepare('SELECT * FROM versions WHERE id = ?').get(Number(versionAId));
  const versionB = db.prepare('SELECT * FROM versions WHERE id = ?').get(Number(versionBId));

  if (!versionA) return res.status(404).json({ error: `Version ${versionAId} not found` });
  if (!versionB) return res.status(404).json({ error: `Version ${versionBId} not found` });

  const result = compareHtml(versionA.raw_html, versionB.raw_html);
  const summaryJson = JSON.stringify(result);

  const changeSet = db.prepare(`
    INSERT INTO change_sets (old_version_id, new_version_id, summary_json)
    VALUES (?, ?, ?)
  `).run(versionA.id, versionB.id, summaryJson);

  db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'compare')").run(versionB.file_id);

  return res.json({
    changeSetId: changeSet.lastInsertRowid,
    versionA: { id: versionA.id, version_number: versionA.version_number, label: versionA.label },
    versionB: { id: versionB.id, version_number: versionB.version_number, label: versionB.label },
    ...result,
  });
});

// ── GET /versions/:versionId/components ────────────────────────────────────
router.get('/:versionId/components', (req, res) => {
  if (!isPositiveInt(req.params.versionId))
    return res.status(400).json({ error: 'versionId must be a positive integer' });

  const versionId = Number(req.params.versionId);

  const version = db.prepare('SELECT id FROM versions WHERE id = ?').get(versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  const components = db.prepare(`
    SELECT id, version_id, name, selector_hint,
           SUBSTR(html_chunk, 1, 120) AS preview,
           created_at
    FROM components
    WHERE version_id = ?
    ORDER BY id ASC
  `).all(versionId);

  return res.json(components);
});

// ── POST /versions/components/:componentId/restore-partial ──────────────────
router.post('/components/:componentId/restore-partial', restoreLimiter, (req, res) => {
  if (!isPositiveInt(req.params.componentId))
    return res.status(400).json({ error: 'componentId must be a positive integer' });

  const componentId = Number(req.params.componentId);

  const component = db.prepare('SELECT * FROM components WHERE id = ?').get(componentId);
  if (!component) return res.status(404).json({ error: 'Component not found' });

  const version = db.prepare('SELECT id, file_id FROM versions WHERE id = ?').get(component.version_id);
  db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'restore_partial')")
    .run(version.file_id);

  return res.json({
    componentId:   component.id,
    versionId:     component.version_id,
    name:          component.name,
    selector_hint: component.selector_hint,
    html_chunk:    component.html_chunk,
  });
});

// ── POST /versions/:versionId/restore-full ──────────────────────────────────
router.post('/:versionId/restore-full', restoreLimiter, (req, res) => {
  if (!isPositiveInt(req.params.versionId))
    return res.status(400).json({ error: 'versionId must be a positive integer' });

  const versionId = Number(req.params.versionId);

  const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'restore_full')").run(version.file_id);

  return res.json({ versionId: version.id, raw_html: version.raw_html });
});

module.exports = router;
