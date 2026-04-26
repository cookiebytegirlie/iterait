const cheerio = require('cheerio');

// Semantic tags that are always worth extracting
const SEMANTIC_TAGS = ['header', 'nav', 'main', 'section', 'aside', 'article', 'footer', 'form'];

// Skip div if it looks like a trivial wrapper with no meaningful identity
const GENERIC_IDS = new Set(['app', 'root', 'wrap', 'wrapper', 'container', 'content', 'page', 'body']);

const MIN_CHUNK_LENGTH = 50; // ignore near-empty elements

function isUsefulDiv(el) {
  const id = el.attribs.id || '';
  const cls = el.attribs.class || '';

  // Has a non-generic id
  if (id && !GENERIC_IDS.has(id.toLowerCase())) return true;

  // Has a class that looks like a component name:
  // at least one class with a hyphen (BEM/component-style) or longer than 5 chars
  const classes = cls.split(/\s+/).filter(Boolean);
  return classes.some(c => c.includes('-') && c.length > 4);
}

function buildName(el) {
  const id  = el.attribs.id;
  const cls = (el.attribs.class || '').split(/\s+/).find(Boolean);
  if (id)  return `${el.name}#${id}`;
  if (cls) return `${el.name}.${cls}`;
  return el.name;
}

function buildSelector(el) {
  const id  = el.attribs.id;
  const cls = (el.attribs.class || '').split(/\s+/).find(Boolean);
  if (id)  return `#${id}`;
  if (cls) return `${el.name}.${cls}`;
  return el.name;
}

function extractComponents(rawHtml) {
  const $ = cheerio.load(rawHtml);
  const components = [];
  const seen = new Set(); // deduplicate by selector_hint

  function collect(el) {
    const chunk = $.html(el);
    if (!chunk || chunk.length < MIN_CHUNK_LENGTH) return;

    const name     = buildName(el);
    const selector = buildSelector(el);
    if (seen.has(selector)) return;
    seen.add(selector);

    components.push({ name, selector_hint: selector, html_chunk: chunk });
  }

  // 1. Semantic structural tags
  for (const tag of SEMANTIC_TAGS) {
    $(tag).each((_, el) => collect(el));
  }

  // 2. Divs with useful ids or component-style classes
  $('div').each((_, el) => {
    if (isUsefulDiv(el)) collect(el);
  });

  return components;
}

module.exports = { extractComponents };
