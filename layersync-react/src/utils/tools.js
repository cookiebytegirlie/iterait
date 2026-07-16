// Canonical badge colors for source tools (the platform a file/version came
// from). Used by Home, Recents, and the Companion so a tool reads as the same
// color everywhere. Keys are the proper-case tool names stored on records.
//
// Note: ActionLibrary keeps its own PTAG map — that's a different concept
// (lowercase "platform" ids with display labels, rendered as a picker), not a
// source-tool badge.
export const TOOL_BADGE = {
  'Claude Code': { bg: '#FFF3E8', fg: '#C05E28' },
  'Claude':      { bg: '#FFE4C2', fg: '#8A4A00' },
  'Loveable':    { bg: '#FFD6E7', fg: '#9D1A56' },
  'Cursor':      { bg: '#C8F0EA', fg: '#1A8272' },
  'Replit':      { bg: '#E0F0FF', fg: '#1550E1' },
  'Figma Make':  { bg: '#E8D5FF', fg: '#5B1D9D' },
  'Other':       { bg: '#F0F0F0', fg: '#555' },
}

// Look up a tool's badge colors, falling back to the neutral "Other" swatch.
export function toolBadge(name) {
  return TOOL_BADGE[name] || TOOL_BADGE['Other']
}
