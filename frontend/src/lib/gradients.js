const COVER_CLASSES = ['bg-cover-1', 'bg-cover-2', 'bg-cover-3', 'bg-cover-4', 'bg-cover-5', 'bg-cover-6']

// Deterministic cover-gradient class for a card, keyed by any stable string
// (repo name, action id, ...) — same key always gets the same color, and a
// list of cards reads as a varied, colorful grid instead of all matching.
export function cardGradient(key) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  const index = Math.abs(hash) % COVER_CLASSES.length
  return COVER_CLASSES[index]
}

// Full literal class strings (not built via string concatenation) so
// Tailwind's content scanner can find and generate them.
const TAG_CLASSES = [
  'bg-lavender text-lavender-ink',
  'bg-babyblue text-babyblue-ink',
  'bg-peach text-peach-ink',
  'bg-mint text-mint-ink',
  'bg-butter text-butter-ink',
  'bg-blush text-blush-ink',
]

// Deterministic pastel bg/text class pair for a tag pill, keyed by any
// stable string (tag name, platform, ...).
export function tagTone(key) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return TAG_CLASSES[Math.abs(hash) % TAG_CLASSES.length]
}
