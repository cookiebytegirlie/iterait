# LayerSync — Project Context

> **Purpose of this file:** Single source of truth for the LayerSync front-end build. If a chat session ends or context is lost, drop this file into a new chat to resume work seamlessly.

---

## Project Overview

**Name:** LayerSync

**Tagline:** "GitHub for designers — but visual, intuitive, and accessible to non-developers."

**What it is:** A unified version control and change management platform for designers. Aggregates design files across multiple platforms (Figma, Loveable, Glitch, Cursor, Claude, Replit) into one dashboard where designers can track versions, manage changes, and protect their work.

**Problem it solves:** Designers have no intuitive way to manage version history. Git is built for developers. Current tools either have no version control (Canva) or bury it in code (Adobe). LayerSync makes iteration history visual, actionable, and cross-platform.

**Product structure:**
- Standalone web app (the main dashboard) — **building this now**
- Plugin embeds for Figma, Loveable, Cursor, Glitch, Claude — **building later, after main app is locked**

---

## Workflow

1. Claude builds front-end HTML files based on the architecture below
2. User screenshots each screen, pushes to Figma
3. User makes detailed edits in Figma
4. User sends screenshots back to Claude
5. Claude makes smaller refinements based on screenshots
6. Repeat section-by-section

---

## Tech Stack

- **HTML + Tailwind CSS (via CDN)** — no build step, fast iteration
- **Light mode only**
- **Vanilla JS** for any interactivity (toggles, state changes)
- No frameworks, no React, no build tools — just open in browser, screenshot, done

---

## Design Direction

### Reference Screenshots (provided by user)
1. **Scribe app** — floating panel architecture, soft off-white bg, three-column layout, circular icon buttons, pastel theme swatches
2. **Floe app** — pastel folder cards (lavender/blue/peach), workflow card grid with thumbnails, sidebar with Favourites section, filter pills
3. **AI Chat panel** — frosted/translucent panels, rounded corners, soft gradient backgrounds, floating action buttons

### Design DNA (locked in)

**Vibe:** Notion-inspired warm minimalism. Soft, premium, designer-friendly. NOT cold/sterile, NOT colorful/busy.

**Background:** Warm off-white / very light neutral (`#F5F5F4` or `#FAFAF9` range)

**Panels:** White floating cards with soft shadows + rounded corners (12–16px radius)

**Borders:** Ultra-light gray, almost invisible

**Typography:** Clean sans-serif (Inter), tight letter-spacing on headings

**Color accents (pastels, used sparingly):**
- Lavender (Figma cards)
- Baby blue (Loveable cards)
- Peach (Cursor cards)
- Mint (Claude cards)
- Soft yellow (Replit cards)
- Pink (Glitch cards)

**Platform brand colors:** Use REAL brand colors on platform badges (Figma's red/orange/blue, Claude's orange, Cursor's black, etc.) so designers get instant visual recognition. Pastel folder backgrounds are softer versions of these.

**Icons:** Thin-line, often in circular button containers with subtle shadows

**Pills/tags:** Rounded-full, light backgrounds, small text

**Buttons:**
- Primary: Dark (almost black), rounded-full or rounded-lg
- Secondary: White with thin border

**Spacing:** Generous — Notion-like breathing room, but with the Floe/Scribe floating-panel feel

---

## File Structure

```
/layer-sync
├── index.html                          ← Master nav: links to every screen
│
├── /shared
│   ├── design-tokens.html              ← Color palette, type scale, spacing reference
│   └── components.html                 ← Reusable component showcase
│
└── /pages
    ├── 01-home.html                    ← Workspace / Home
    ├── 02-file-view.html               ← Core screen: 3-panel file view
    ├── 03-file-view-comment.html       ← Variant: comment pin + thread state
    ├── 04-file-view-side-by-side.html  ← Variant: side-by-side canvas mode
    ├── 05-action-library.html          ← Grid of saved actions
    ├── 06-action-library-adjust.html   ← Adjust Action sub-panel state
    ├── 07-modal-diff-conflict.html     ← Action Diff + Conflict Detection modal
    ├── 08-modal-restore-version.html   ← Restore Version confirmation modal
    ├── 09-modal-share.html             ← Share + Collaborate modal
    ├── 10-notifications.html           ← Slide-in panel: activity feed
    └── 11-settings.html                ← Account, platform connections, prefs
```

**Total: 14 HTML files** (11 pages + index + 2 shared references)

**Plugin files (12, 13) — DEFERRED until main app is locked.**

---

## Screen Architecture (from user's spec)

### 1. Workspace / Home
- Recent Files grid/list
- View toggle: Grid / List / Compact
- **Connected platforms shown as Floe-style folder cards** (Figma, Loveable, Cursor, Claude, Replit, Glitch + "Connect new")
- File cards with **simulated design thumbnails** (CSS mockups, not gray placeholders)
- Floe-style sidebar with Favourites section
- Top bar: search + filter pills + view toggle
- **NO breadcrumb on Home** (Home is the top-level page)
- Breadcrumbs only appear when drilling into a file (e.g., "Home / Dashboard Redesign")

### 2. File View (core screen) — 3-panel layout
**Left — Version History Panel**
- Collapse/expand toggle
- Version list items: label, status badge, timestamp, change count, thumbnail
- Scrollable history

**Center — Version Canvas**
- Version title + timestamp header
- Change annotation counter badge (top-right of canvas, e.g., "6 changes annotated")
- Numbered callout pins (1–6) on canvas
- Change detail tooltip: Before/After, description, "Save to Actions" + "Save as chain" buttons
- Comment pins — drop comment anywhere on canvas (click → type → pin anchors)
- Comment thread: avatar + text + timestamp + reply
- Unresolved / Resolved toggle per comment
- Canvas view mode toggle (bottom bar): ⊞ Single | ⊟ Side-by-side

**Right — Save Action Chain Panel (slides in)**
- Chain name input
- Source version label
- Checklist of changes to include
- Action count badge

**Bottom Action Bar**
- Canvas view mode toggle: Single / Side-by-side
- Save action chain
- Restore this version

### 3. Action Library (dedicated screen)
- Grid view of all saved actions (generic, platform-agnostic)
- Action Card shows: name, parent file + parent vibe coding tool, change summary preview, Apply Action button, Adjust Action button (only here)
- Search + filter by: action type, source tool, date
- Adjust Action sub-panel: editable parameters, live preview, Apply confirm

### 4. Action Diff + Conflict Detection (modal, pre-apply)
- "What will change" preview
- Conflict flags + per-conflict resolution: Skip / Override / Merge
- Apply anyway / Cancel

### 5. Restore Version (confirmation modal)
- Source version summary
- Warning + Confirm restore / Cancel

### 6. Notifications (slide-in panel from right, ~400px wide)
- Activity feed: comments left on your files, suggestions, shares
- Per-item: file name, actor, timestamp, action type (comment / suggestion / share)
- Mark as read / Go to file

### 7. Share + Collaborate (modal, per file)
- Share link / invite by email
- Permission: View only / Can suggest / Can comment
- No live collab — async only
- Active collaborators list (who has access)

### 8. General Settings
- Account info
- Platform Connections — link/unlink vibe coding tools (Claude, Loveable, Cursor, Glitch, Replit, Figma)
- Notifications preferences
- Plugin download links

---

## Key UX Decisions (locked)

1. **Comments are first-class canvas objects** (not a sidebar feature)
2. **Annotation counter lives ON the canvas** (top-right), not in the sidebar
3. **View toggle is in the bottom bar** (Single / Side-by-side)
4. **Adjust Action is gated to the Library only** — keeps canvas modal focused and clean
5. **No live collaboration** — async only (comments, suggestions, shares)
6. **No breadcrumb on Home** — only when drilling into files

---

## Mock Content (for realistic screenshots)

**Connected Platforms (folder cards):**
- Figma · 12 files (lavender)
- Loveable · 7 files (baby blue)
- Cursor · 4 files (peach)
- Claude · 9 files (mint)
- Replit · 3 files (soft yellow)
- + Connect platform (empty card)

**Recent Files:**
- "Dashboard Redesign" — Loveable — 1 day ago
- "Marketing Site v2" — Figma — 2 days ago
- "Onboarding Flow" — Claude — 2 days ago
- "Pricing Page" — Cursor — 3 days ago
- "Mobile App Wireframes" — Figma — 6 days ago
- "Landing Page A/B Test" — Replit — 12 days ago

---

## Build Order

1. ✅ `PROJECT-CONTEXT.md` (this file)
2. ⏳ `shared/design-tokens.html` — locks palette/type/spacing
3. ⏳ `shared/components.html` — locks reusable UI elements
4. ⏳ `index.html` — master nav
5. ⏳ `01-home.html` — first real screen
6. ⏳ `02-file-view.html` — most complex screen
7. ⏳ `03-file-view-comment.html`
8. ⏳ `04-file-view-side-by-side.html`
9. ⏳ `05-action-library.html`
10. ⏳ `06-action-library-adjust.html`
11. ⏳ `07-modal-diff-conflict.html`
12. ⏳ `08-modal-restore-version.html`
13. ⏳ `09-modal-share.html`
14. ⏳ `10-notifications.html`
15. ⏳ `11-settings.html`

---

## Token Budget Estimate

- Total build: ~85,000–95,000 tokens of output
- With back-and-forth: ~100,000–110,000 tokens
- Realistic timeline: 5–7 working sessions across multiple days

---

## How to Resume in a New Chat

If this conversation ends or context is lost:

1. Start a new chat with Claude
2. Paste this entire `PROJECT-CONTEXT.md` file as the first message
3. Tell Claude: "We're building LayerSync front-end. Here's the project context. We last completed [X file]. Please continue with [Y file]."
4. Claude will pick up where we left off

---

## Decisions Log

| Date | Decision |
|------|----------|
| 2026-04-25 | Tailwind via CDN, light mode only |
| 2026-04-25 | Notion-inspired vibe, Scribe/Floe reference design |
| 2026-04-25 | Plugin design deferred until main app is locked |
| 2026-04-25 | Connected platforms shown as Floe-style folder cards on Home |
| 2026-04-25 | Real platform brand colors on badges, pastel versions for folder backgrounds |
| 2026-04-25 | File View states (default, comment, side-by-side) as separate files |
| 2026-04-25 | Modals shown over dimmed background context |
| 2026-04-25 | Notifications as slide-in right panel (~400px), not full screen |
| 2026-04-25 | Home view toggle (Grid/List/Compact) as one file with working JS toggle |

---

*Last updated: April 25, 2026*
