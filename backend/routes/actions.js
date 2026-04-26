const router    = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');
const { authMiddleware }     = require('../middleware/auth');
const db                     = require('../db/database');
const { isPositiveInt, MAX } = require('../utils/validate');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.use(authMiddleware);

// ── Rate limiters ───────────────────────────────────────────────────────────
const saveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many save requests. Please wait before trying again.' },
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'AI prompt generation rate limit reached. Please wait before trying again.' },
});

// ── POST /actions/save ──────────────────────────────────────────────────────
router.post('/save', saveLimiter, (req, res) => {
  const { fileId, sourceVersionId, selectedChanges } = req.body;
  let { name } = req.body;

  if (!fileId || !sourceVersionId || !name || !selectedChanges)
    return res.status(400).json({ error: 'Missing required fields: fileId, sourceVersionId, name, selectedChanges' });

  if (!isPositiveInt(fileId))
    return res.status(400).json({ error: 'fileId must be a positive integer' });
  if (!isPositiveInt(sourceVersionId))
    return res.status(400).json({ error: 'sourceVersionId must be a positive integer' });

  name = String(name).trim().slice(0, MAX.chainName);
  if (!name) return res.status(400).json({ error: 'name must not be empty' });

  const file = db.prepare('SELECT id FROM files WHERE id = ?').get(Number(fileId));
  if (!file) return res.status(404).json({ error: 'File not found' });

  const version = db.prepare('SELECT id FROM versions WHERE id = ?').get(Number(sourceVersionId));
  if (!version) return res.status(404).json({ error: 'Source version not found' });

  const changesJson = typeof selectedChanges === 'string'
    ? selectedChanges
    : JSON.stringify(selectedChanges);

  const result = db
    .prepare('INSERT INTO action_chains (file_id, source_version_id, name, selected_changes_json) VALUES (?, ?, ?, ?)')
    .run(Number(fileId), Number(sourceVersionId), name, changesJson);

  db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'action_save')").run(Number(fileId));

  const chain = db.prepare('SELECT * FROM action_chains WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(chain);
});

// ── GET /actions/all ────────────────────────────────────────────────────────
router.get('/all', (_req, res) => {
  const chains = db.prepare('SELECT * FROM action_chains ORDER BY created_at DESC').all();
  return res.json(chains);
});

// ── GET /actions/:id ────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  if (!isPositiveInt(req.params.id))
    return res.status(400).json({ error: 'id must be a positive integer' });

  const chain = db.prepare('SELECT * FROM action_chains WHERE id = ?').get(Number(req.params.id));
  if (!chain) return res.status(404).json({ error: 'Action chain not found' });
  return res.json(chain);
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildMockPrompt(chain, changes, targetTool) {
  const changeLines = Array.isArray(changes)
    ? changes.map((c, i) => `${i + 1}. ${typeof c === 'string' ? c : JSON.stringify(c)}`).join('\n')
    : JSON.stringify(changes);
  return (
    `Recreate the following UI changes using ${targetTool}:\n\n` +
    `Action chain: "${chain.name}"\n\n` +
    `Changes to apply:\n${changeLines}\n\n` +
    `Do not invent or modify anything outside of these described changes.`
  );
}

// ── POST /actions/:id/generate-prompt ───────────────────────────────────────
router.post('/:id/generate-prompt', generateLimiter, async (req, res) => {
  if (!isPositiveInt(req.params.id))
    return res.status(400).json({ error: 'id must be a positive integer' });

  let { targetTool } = req.body;
  if (!targetTool) return res.status(400).json({ error: 'targetTool is required' });
  targetTool = String(targetTool).trim().slice(0, MAX.targetTool);
  if (!targetTool) return res.status(400).json({ error: 'targetTool must not be empty' });

  const chain = db.prepare('SELECT * FROM action_chains WHERE id = ?').get(Number(req.params.id));
  if (!chain) return res.status(404).json({ error: 'Action chain not found' });

  let changes;
  try {
    changes = JSON.parse(chain.selected_changes_json);
  } catch {
    return res.status(500).json({ error: 'Stored changes could not be parsed' });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';

  let promptText;
  let status;

  if (!process.env.ANTHROPIC_API_KEY) {
    promptText = buildMockPrompt(chain, changes, targetTool);
    status = 'mock';
  } else {
    try {
      const changeLines = Array.isArray(changes)
        ? changes.map((c, i) => `${i + 1}. ${typeof c === 'string' ? c : JSON.stringify(c)}`).join('\n')
        : JSON.stringify(changes);

      const message = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text:
              'You are a prompt engineer for UI vibe-coding tools. ' +
              'Given a list of UI changes that were detected between two HTML versions, ' +
              'write a concise, actionable prompt a developer can paste directly into the target tool. ' +
              'The prompt must describe only the listed changes — never invent features, ' +
              'never reference or restore old code, and never produce code yourself.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content:
              `Target tool: ${targetTool}\n` +
              `Action chain name: "${chain.name}"\n\n` +
              `Detected UI changes:\n${changeLines}\n\n` +
              `Write a prompt for ${targetTool} that will recreate exactly these changes.`,
          },
        ],
      });

      promptText = message.content.find(b => b.type === 'text')?.text ?? buildMockPrompt(chain, changes, targetTool);
      status = 'generated';
    } catch {
      // Do not expose provider errors, stack traces, or secrets to the client.
      promptText = buildMockPrompt(chain, changes, targetTool);
      status = 'fallback';
    }
  }

  const genResult = db
    .prepare('INSERT INTO prompt_generations (action_chain_id, target_tool, prompt_text) VALUES (?, ?, ?)')
    .run(chain.id, targetTool, promptText);

  db.prepare("INSERT INTO access_log (file_id, event_type) VALUES (?, 'prompt_generate')").run(chain.file_id);

  const saved = db.prepare('SELECT * FROM prompt_generations WHERE id = ?').get(genResult.lastInsertRowid);

  return res.json({
    actionChainId: chain.id,
    targetTool,
    promptText: saved.prompt_text,
    status,
  });
});

module.exports = router;
