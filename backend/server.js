require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors    = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const versionsRouter = require('./routes/versions');
const actionsRouter  = require('./routes/actions');
const securityRouter = require('./routes/security');
const { authMiddleware } = require('./middleware/auth');

const app       = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'layersync-backend' });
});

app.use('/versions', versionsRouter);
app.use('/actions',  actionsRouter);
app.use('/security', securityRouter);

// ── AI routes ──────────────────────────────────────────────────────────────────

app.post('/api/generate-diff', authMiddleware, async (req, res) => {
  try {
    const { htmlBefore, htmlAfter } = req.body;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: `You are a design diff tool. Compare these two HTML files and identify what visually changed. Return a JSON array of changes. Each item must have: id (number), category (Visual | Layout | Typography | Color), title (short 3-5 word label), description (one sentence), beforeValue, afterValue, approximatePosition (y position 0-100). Return only valid JSON, no markdown.`,
      messages: [{ role: 'user', content: `Before:\n${htmlBefore?.slice(0, 3000)}\n\nAfter:\n${htmlAfter?.slice(0, 3000)}` }]
    });
    const text    = message.content[0].text;
    const changes = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ changes });
  } catch (err) {
    console.error('Diff generation failed:', err);
    res.status(500).json({ error: 'Failed to generate diff' });
  }
});

app.post('/api/generate-action-prompt', authMiddleware, async (req, res) => {
  try {
    const { action, tool } = req.body;
    const toolContext = {
      'Claude':      'Write a direct instruction in second person.',
      'Loveable':    'Write a conversational natural language request.',
      'Cursor':      'Write a precise technical instruction for an AI code editor.',
      'Replit':      'Write a clear coding instruction.',
      'Figma Make':  'Write a design-focused instruction.'
    };
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: `You are a design assistant. ${toolContext[tool] || toolContext['Claude']} No preamble. Just the prompt. Under 100 words.`,
      messages: [{ role: 'user', content: `Action: ${action.name}\nChanges: ${JSON.stringify(action.changes)}` }]
    });
    res.json({ prompt: message.content[0].text });
  } catch (err) {
    console.error('Action prompt generation failed:', err);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

app.post('/api/generate-chain-prompt', authMiddleware, async (req, res) => {
  try {
    const { chain, tool } = req.body;
    const toolContext = {
      'Claude':      'Write a direct instruction in second person.',
      'Loveable':    'Write a conversational natural language request.',
      'Cursor':      'Write a precise technical instruction.',
      'Replit':      'Write a clear coding instruction.',
      'Figma Make':  'Write a design-focused instruction.'
    };
    const changesText = (chain.changes || [])
      .map((c, i) => `${i + 1}. ${c.title}: ${c.description} (${c.beforeValue} → ${c.afterValue})`)
      .join('\n');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: `You are a design assistant. ${toolContext[tool] || toolContext['Claude']} Cover all changes in one cohesive instruction. No preamble. Under 150 words.`,
      messages: [{ role: 'user', content: `Chain: ${chain.name}\nChanges:\n${changesText}\n\nHTML before (truncated):\n${chain.htmlBefore?.slice(0, 2000)}\n\nHTML after (truncated):\n${chain.htmlAfter?.slice(0, 2000)}` }]
    });
    res.json({ prompt: message.content[0].text });
  } catch (err) {
    console.error('Chain prompt generation failed:', err);
    res.status(500).json({ error: 'Failed to generate chain prompt' });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`LayerSync backend running at http://localhost:${PORT}`);
});

module.exports = app;
