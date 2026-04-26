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
      system: `You are a design diff tool. Compare these two HTML files and identify ALL visual differences. Be thorough — check every CSS property including colors, font sizes, font weights, padding, margin, border-radius, box-shadow, background colors, border colors, button styles, layout changes, added or removed elements, spacing changes, and any other visual differences.

Return a JSON array of changes. Each item must have:
- id (number starting at 1)
- category (Visual | Layout | Typography | Color)
- title (short 3-5 word label)
- description (one sentence describing exactly what changed)
- beforeValue (the old value e.g. "#000000" or "8px")
- afterValue (the new value e.g. "#1a56db" or "16px")
- approximatePosition (y position as percentage 0-100 of where on the page this change appears)

Find at least 4-6 changes if they exist. Look carefully at every element. Return only valid JSON array, no markdown, no explanation, no code blocks.`,
      messages: [{ role: 'user', content: `Before HTML:\n${htmlBefore?.slice(0,8000)}\n\nAfter HTML:\n${htmlAfter?.slice(0,8000)}` }]
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
