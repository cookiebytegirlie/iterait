const cheerio = require('cheerio');

// Tags compared by position when they have no id
const POSITIONAL_TAGS = ['h1', 'h2', 'h3', 'h4', 'button', 'a'];

// Element attributes worth surfacing as changes
const WATCHED_ATTRS = ['src', 'href', 'placeholder', 'alt', 'value', 'action'];

function truncate(str, len = 140) {
  if (!str) return '';
  const flat = str.replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
}

// Safe selector for arbitrary id strings
function byId($, id) {
  try {
    return $(`[id="${id}"]`);
  } catch {
    return $();
  }
}

function collectIds($) {
  const ids = new Set();
  $('[id]').each((_, el) => {
    const id = el.attribs && el.attribs.id;
    if (id) ids.add(id);
  });
  return ids;
}

function compareHtml(oldHtml, newHtml) {
  const $o = cheerio.load(oldHtml);
  const $n = cheerio.load(newHtml);
  const changes = [];

  // ── 1. <title> ──────────────────────────────────────────────────────────────
  const oldTitle = $o('title').text().trim();
  const newTitle = $n('title').text().trim();
  if (oldTitle !== newTitle) {
    changes.push({ type: 'title_change', old: oldTitle, new: newTitle });
  }

  // ── 2. ID-based structural diff ─────────────────────────────────────────────
  const oldIds = collectIds($o);
  const newIds = collectIds($n);

  for (const id of newIds) {
    if (!oldIds.has(id)) {
      const el = byId($n, id).get(0);
      if (!el) continue;
      changes.push({
        type: 'added',
        selector: `#${id}`,
        tag: el.name,
        preview: truncate($n.html(el)),
      });
    }
  }

  for (const id of oldIds) {
    if (!newIds.has(id)) {
      const el = byId($o, id).get(0);
      if (!el) continue;
      changes.push({
        type: 'removed',
        selector: `#${id}`,
        tag: el.name,
        preview: truncate($o.html(el)),
      });
    }
  }

  for (const id of oldIds) {
    if (!newIds.has(id)) continue;

    const $elO = byId($o, id);
    const $elN = byId($n, id);
    const selector = `#${id}`;
    const tag = ($elO.get(0) || {}).name || 'unknown';

    // Text content
    const oldText = $elO.text().trim();
    const newText = $elN.text().trim();
    if (oldText !== newText) {
      changes.push({
        type: 'text_change',
        selector,
        tag,
        old: truncate(oldText),
        new: truncate(newText),
      });
    }

    // class attribute
    const oldClass = ($elO.attr('class') || '').replace(/\s+/g, ' ').trim();
    const newClass = ($elN.attr('class') || '').replace(/\s+/g, ' ').trim();
    if (oldClass !== newClass) {
      changes.push({ type: 'class_change', selector, tag, old: oldClass, new: newClass });
    }

    // inline style
    const oldStyle = ($elO.attr('style') || '').trim();
    const newStyle = ($elN.attr('style') || '').trim();
    if (oldStyle !== newStyle) {
      changes.push({ type: 'style_change', selector, tag, old: oldStyle, new: newStyle });
    }

    // watched attributes
    for (const attr of WATCHED_ATTRS) {
      const oldVal = $elO.attr(attr) || '';
      const newVal = $elN.attr(attr) || '';
      if (oldVal !== newVal) {
        changes.push({ type: 'attr_change', selector, tag, attr, old: oldVal, new: newVal });
      }
    }
  }

  // ── 3. Positional comparison for tag types without ids ──────────────────────
  for (const tag of POSITIONAL_TAGS) {
    const oldEls = $o(tag).toArray().filter(el => !el.attribs.id);
    const newEls = $n(tag).toArray().filter(el => !el.attribs.id);
    const len = Math.min(oldEls.length, newEls.length);

    for (let i = 0; i < len; i++) {
      const oldText = $o(oldEls[i]).text().trim();
      const newText = $n(newEls[i]).text().trim();
      if (oldText !== newText) {
        changes.push({
          type: 'text_change',
          selector: `${tag}:nth-of-type(${i + 1})`,
          tag,
          old: truncate(oldText),
          new: truncate(newText),
        });
      }

      const oldClass = ($o(oldEls[i]).attr('class') || '').replace(/\s+/g, ' ').trim();
      const newClass = ($n(newEls[i]).attr('class') || '').replace(/\s+/g, ' ').trim();
      if (oldClass !== newClass) {
        changes.push({
          type: 'class_change',
          selector: `${tag}:nth-of-type(${i + 1})`,
          tag,
          old: oldClass,
          new: newClass,
        });
      }
    }
  }

  // ── 4. Stats ─────────────────────────────────────────────────────────────────
  const by_type = {};
  for (const c of changes) {
    by_type[c.type] = (by_type[c.type] || 0) + 1;
  }

  return {
    stats: { total: changes.length, by_type },
    changes,
  };
}

module.exports = { compareHtml };
