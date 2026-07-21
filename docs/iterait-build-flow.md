# iterait Build Flow & Team Workflow

## Core Concept (1-Minute Version)

**iterait** = Git-based version control for cross-platform design components.

- **Designers/Devs** build components in Lovable, Claude, Cursor, Figma
- **They push to GitHub** (or agent pushes for them)
- **iterait reads the commit history** and shows versions
- **Users save changes as Actions** (reusable patterns)
- **Agent can apply Actions to other projects** (with smart adaptation)

That's it. Everything else flows from Git.

---

## The Three Core Systems

```
┌─────────────────────────────────────────────────────────────┐
│                        iterait Frontend                      │
│                                                              │
│  - Browse commit timeline                                   │
│  - See diffs between versions                               │
│  - Save/manage Actions                                      │
│  - Trigger Action application                               │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ reads                    │ triggers
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Agent (Node.js)                   │
│                  (DigitalOcean App Platform)                │
│                                                              │
│  - Git operations (clone, revert, commit)                   │
│  - GitHub API integration                                   │
│  - Claude calls for adaptation                              │
│  - Job queue (process requests async)                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ reads/writes
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub (Source of Truth)                   │
│                                                              │
│  - Commit history (= version history)                       │
│  - Actions storage (JSON + code files)                      │
│  - User projects (where agents push results)                │
└─────────────────────────────────────────────────────────────┘
```

---

## User Flow: Save an Action

**Scenario: I built a button in Lovable, want to save it as an Action**

```
1. User connects GitHub repo to iterait
   └─ Login with GitHub OAuth
   └─ Select repo where Lovable pushed code
   
2. iterait fetches commit history
   └─ Shows timeline: "Initial commit" → "Added button" → "Styled button"
   
3. User sees diff between commits
   └─ Commit #3: "Added rounded button"
   └─ Shows: File changes, CSS additions, Component structure
   
4. User clicks: "Save as Action"
   └─ Dialog: "Name this action" → "Lovable Button"
   └─ Description: "Rounded button with shadow, works in React"
   └─ Tags: [component, button, ui]
   
5. iterait creates Action
   └─ Reads commit range (commit #2 to #3)
   └─ Extracts code from those commits
   └─ Stores in GitHub:
       /actions/lovable-button/
       ├── action.json (metadata)
       └── index.jsx (code)
   
6. Action now appears in "My Actions" library
   └─ Can be applied to other projects
   └─ Can be reverted from this project
   └─ Part of user's design system
```

---

## User Flow: Apply an Action

**Scenario: I want to use that Lovable button in my Claude project**

```
1. User opens iterait, goes to Actions library
   └─ Sees: "Lovable Button" (saved last week)
   
2. User clicks: "Apply this action"
   └─ Dialog appears:
      - Select target project: "my-claude-app"
      - Select target path: "/src/components/"
      - Auto-detects framework: "React + Tailwind"
   
3. Backend agent receives request
   └─ Clones target repo
   └─ Reads Action code
   └─ Checks target repo's dependencies
   └─ Calls Claude API with prompt:
      "Here's a button from another project: [code]
       My project uses: React, Tailwind v3, custom theme
       Adapt this button to fit my project.
       Keep the same visual style.
       Return ONLY the code, no explanation."
   
4. Claude returns adapted code
   └─ Changes: Theme colors to match my app
   └─ Keeps: Border radius, shadow, interaction
   └─ Adds: Import for my theme system
   
5. Agent commits to target repo
   └─ Creates branch: "apply-action/lovable-button"
   └─ Commit message: "Apply Action: Lovable Button"
   └─ Pushes to GitHub
   
6. iterait shows result
   └─ "Applied! See commit: abc123"
   └─ Link to GitHub
   └─ Timeline updates in target project
   └─ User can revert with one click
```

---

## How the Architecture Actually Works

### Frontend (Vercel + React)

```
Pages:
  /dashboard
    - Connect GitHub repo
    - Shows user's projects
    
  /timeline/:owner/:repo
    - Commit history (timeline UI)
    - Side-by-side diffs
    - "Save as Action" button
    
  /actions
    - Library of saved Actions
    - Search/filter
    - Apply button for each
    
  /apply
    - Select target project
    - Preview changes
    - Confirm/Cancel
    - Shows status (in progress → complete)

State:
  - User auth (GitHub token)
  - Cached commits (fetched from backend)
  - Actions (fetched from backend)
  - Application status (polling backend)

API Calls (to backend):
  GET /api/repos/:owner/:repo/commits
  GET /api/repos/:owner/:repo/commit/:sha/diff
  GET /api/actions
  POST /api/actions (save new)
  POST /api/actions/:id/apply (trigger application)
  GET /api/jobs/:jobId (check status)
```

### Backend (Node.js on DigitalOcean)

```
Responsibilities:
  - GitHub API gateway (handles auth, pagination)
  - Git operations (clone, checkout, revert, commit)
  - Claude API calls (with retry + error handling)
  - Job queue (Bull/BullMQ for async work)
  - Database (SQLite or Postgres for metadata)

Key Routes:
  
  // Fetch commits from GitHub
  GET /api/repos/:owner/:repo/commits
    → Calls GitHub API
    → Caches in DB
    → Returns to frontend
  
  // Get diff between two commits
  GET /api/repos/:owner/:repo/compare/:sha1...:sha2
    → Calls GitHub diff API
    → Parses changes
    → Returns structured diff
  
  // Save a new Action
  POST /api/actions
    Body: { name, description, repo, startSha, endSha, tags }
    → Clones repo
    → Extracts files between commits
    → Creates action.json + code files
    → Pushes to /actions/<name>/ in GitHub
    → Stores metadata in DB
    → Returns action ID
  
  // Apply Action to target project
  POST /api/actions/:actionId/apply
    Body: { targetRepo, targetPath, targetFramework }
    → Creates background job
    → Returns job ID
    → Background job:
        - Reads Action from GitHub
        - Analyzes target repo
        - Calls Claude for adaptation
        - Commits result
        - Updates job status
  
  // Check job status
  GET /api/jobs/:jobId
    → Returns: { status, progress, result, error }
    → Frontend polls this

Queue Jobs:
  - apply-action (most common)
  - revert-commit
  - analyze-changes (Claude summarizes)
  - detect-similar-actions (future)

Error Handling:
  - GitHub auth fails → return 401
  - Rate limit hit → retry with backoff
  - Claude API error → user sees "couldn't adapt, please try again"
  - Merge conflict on apply → return conflict details
```

### Database (SQLite for MVP)

```
Tables:

users
  id, github_id, github_token, email, created_at

actions
  id, user_id, name, description, repo_owner, repo_name, 
  start_sha, end_sha, code_file, metadata_json, created_at

projects
  id, user_id, repo_owner, repo_name, framework, created_at

jobs
  id, action_id, type, target_repo, status, progress, 
  result_json, error_message, created_at, completed_at

action_applications
  id, action_id, target_repo, commit_sha, applied_at
```

This is intentionally simple. Only track what's needed.

---

## Team Workflow & Responsibilities

### What Each Role Does

**Designers (Basmah, Shreya):**
- Use Lovable, Figma to create components/designs
- Push/commit to GitHub (manually or via Lovable export)
- Use iterait to save designs as Actions
- Test applying Actions to other projects
- Give feedback on UI/UX of iterait

**Sydney (Product/Design Lead):**
- Define which flows to ship first
- Design iterait interface (the UI designers see)
- Bridge designer feedback → dev work
- Test end-to-end workflows
- Portfolio story/case study

**Dev (Bui?):**
- Build backend on DigitalOcean
- Implement GitHub integration
- Set up Claude API calls + prompting
- Job queue + error handling
- Database schema
- API endpoints

**Collectively:**
- Define Action metadata format (action.json schema)
- Test component adaptation (does Claude do it well?)
- Decide scope for MVP vs. future

---

## How to Work Together: Weekly Rhythm

### Week 1-2: Foundation

**Dev:**
- Set up DigitalOcean + Node backend
- GitHub OAuth + token storage
- Basic GitHub API integration (fetch commits)
- SQLite schema
- One endpoint working: `GET /api/repos/:owner/:repo/commits`

**Design/Product:**
- Finalize UI for commit timeline
- Decide: what does a "version" look like?
- Create Figma wireframe for main flows
- Test: push dummy code to test repo, see if backend fetches it

**Blockers:** Nothing yet—this is parallel work

---

### Week 3-4: Save Actions

**Dev:**
- Endpoint: `POST /api/actions` (save Action from commit range)
- Create /actions/ folder structure in GitHub
- Commit Action files back to GitHub
- Handle errors (auth, file structure)

**Frontend:**
- Build UI: Timeline + "Save as Action" dialog
- Connect to backend endpoint
- Show success/error messages
- List saved Actions

**Designers:**
- Test: Can you save a button as an Action?
- Feedback: Is the UI clear?
- Create test component in Lovable, try to save

**Blockers:** Frontend needs dev API working

---

### Week 5-6: Apply Actions (Start Simple)

**Dev:**
- Endpoint: `POST /api/actions/:id/apply`
- Background job: read Action, clone target repo, commit
- Add Claude adaptation (simple prompt)
- Job status endpoint: `GET /api/jobs/:jobId`

**Frontend:**
- Build UI: "Apply this Action" dialog
- Select target repo + path
- Show status (in progress → done)
- Link to commit in GitHub

**Designers:**
- Test: Apply saved button to another project
- Feedback: Did adaptation work? Manual or good?
- Try multiple platforms (Lovable → Claude)

**Blockers:** Claude adaptation quality will be the constraint

---

### Week 7-8: Polish MVP

**Dev:**
- Error handling (merge conflicts, API limits, auth failures)
- Revert endpoint: `POST /api/repos/:owner/:repo/revert/:sha`
- Search/filter Actions

**Frontend:**
- Show revert button for applied Actions
- Better error messages
- Loading states
- Mobile responsiveness

**Product:**
- Define MVP scope (what ships, what's future)
- Start portfolio case study
- Record demo video

---

## Example: Complete Flow for Team

**Scenario: Basmah builds button in Lovable, Shreya applies it to Claude project**

### Step 1: Basmah pushes button to GitHub

```
Basmah in Lovable:
  - Designs rounded button with shadow
  - Exports as React component
  - Commits to lovable-components repo with message: "Add rounded button"
  
GitHub receives commit #5:
  - File: src/components/Button.jsx
  - Diff: +45 lines (new component)
```

### Step 2: iterait detects commit

```
Backend polls GitHub every 5 min (or webhook):
  - Sees new commit
  - Stores in DB
  - Frontend refreshes: "New version available"
```

### Step 3: Basmah opens iterait

```
Basmah goes to iterait.com/timeline/basmah/lovable-components
  - Sees timeline: Old commits → new commit #5
  - Clicks on commit #5
  - Sidebar shows diff:
    - File: Button.jsx (new)
    - Lines added: className styling, component exports
  
Basmah clicks: "Save as Action"
  - Dialog: Name: "Rounded Button"
  - Description: "Simple button with shadow and hover state"
  - Tags: [component, button, ui, lovable]
  - Clicks: "Save"
  
Backend:
  - Clones lovable-components repo
  - Extracts Button.jsx from commit #5
  - Creates /actions/rounded-button/:
    ├── action.json
    └── index.jsx
  - Commits to Actions repo
  - DB: stores action.id, metadata
  
iterait UI:
  - Shows: "Action saved! View in library"
  - Links to: /actions/rounded-button
```

### Step 4: Shreya applies to her project

```
Shreya goes to iterait.com/actions
  - Sees: "Rounded Button" (shared by Basmah)
  - Clicks: "Apply this Action"
  
Dialog appears:
  - Target project: "My Claude Designer App"
  - Target path: "src/components/"
  - Detected framework: "React + Tailwind"
  - "Apply" button
  
She clicks "Apply"
  - Frontend shows: "Applying... this may take a minute"
  - Polling /api/jobs/job-123
  
Backend (background job):
  - Clones her repo: "my-claude-app"
  - Reads Action: src/components/Button.jsx (from Lovable)
  - Checks her dependencies: React, Tailwind v3, custom theme
  - Prompts Claude:
    "Here's a button component: [Lovable button code]
     My project uses: React, Tailwind v3, custom theme colors
     Adapt this button for my project.
     Use my theme colors instead of hardcoded ones.
     Keep the same visual style and behavior.
     Return ONLY the code, no explanation."
  - Claude returns:
    "export default function Button(...) { 
       // Uses theme.colors instead of hardcoded #123
     }"
  - Agent commits to Shreya's repo:
    - Branch: "apply-action/rounded-button"
    - Message: "Apply Action: Rounded Button (from Basmah)"
    - Files: src/components/Button.jsx
  - Job completes
  
Frontend shows:
  - "Success! Applied to commit abc123"
  - Link: "View in GitHub"
  - "Undo this application"
  
Shreya's repo now has:
  - New branch: apply-action/rounded-button
  - New commit: "Apply Action: Rounded Button"
  - New file: src/components/Button.jsx (adapted)
```

### Step 5: Shreya reverts

```
Shreya clicks: "Undo this application" in iterait

Backend:
  - git revert <commit-abc123>
  - Commits: "Revert: Apply Action: Rounded Button"
  
Repository timeline now shows:
  - Commit: "Apply Action: Rounded Button"
  - Commit: "Revert: Apply Action: Rounded Button"
  
iterait shows:
  - Action marked as: "No longer applied to this project"
  - User can apply again if they want
```

That's the whole flow.

---

## Team Communication

### What to Agree On ASAP

1. **Action metadata format** (action.json schema)
   - What fields are required?
   - What's optional?
   - Where does code live?

2. **Target framework detection**
   - How do we know if a project is React vs. Svelte vs. Vue?
   - Fall back to manual selection?

3. **Claude prompt for adaptation**
   - What does good adaptation look like?
   - Test 5 examples before committing to approach

4. **Error messages**
   - When adaptation fails, what does user see?
   - Should they see Claude's response? Or just "didn't work"?

5. **MVP scope cutoff**
   - Revert: must-have or nice-to-have?
   - Multi-file Actions: v1 or v2?
   - Search/filter: MVP or later?

### Weekly Sync Format

```
Monday: Planning
  - What's each person building this week?
  - Any blockers from last week?
  - Do we still agree on approach?

Thursday: Demo
  - Dev: Show API + backend status
  - Design: Show UI updates
  - Test flow end-to-end (if possible)
  - Feedback: What's not working?

Friday: Retro + Planning
  - What worked, what didn't?
  - Adjust plan for next week
```

---

## Definition of Done (MVP)

### Dev Done When:

```
✅ Backend running on DigitalOcean
✅ GitHub OAuth works (user can auth)
✅ Can fetch commits from any repo
✅ Can show diff between commits
✅ Can save Action to GitHub
✅ Can apply Action to another repo (with Claude adaptation)
✅ Can revert applied Action
✅ Error handling for common failures
✅ Job queue processes without crashes
✅ API is documented (simple README)
```

### Frontend Done When:

```
✅ User can connect GitHub repo
✅ Timeline shows commits
✅ Can click commit to see diff
✅ Can save as Action (form works)
✅ Actions library displays saved Actions
✅ Can apply Action (select target, see status)
✅ Can revert application
✅ Error messages are clear
✅ Loading states are visible
✅ Mobile responsive
```

### Team Done When:

```
✅ End-to-end flow works (Lovable → iterait → Claude)
✅ Team has recorded demo
✅ Portfolio case study written
✅ Documentation for future dev work
✅ Tested with 3+ real component examples
✅ No major bugs blocking core flow
```

---

## What NOT to Build Yet

- Real-time sync (web sockets) — polling works
- Design ↔ Code conversion — too hard, code → code only for now
- Collaboration/sharing — v2
- Action templates library — v2
- Auto-detect reusable Actions — v2
- Multi-language support — v2
- Self-hosted version — v2

---

## Tools & Stack (What Dev Needs)

```
Backend:
  - Node.js 18+
  - Express.js
  - simple-git (for Git operations)
  - @anthropic-ai/sdk (Claude API)
  - octokit/rest (GitHub API)
  - bullmq (job queue)
  - sqlite3 or pg
  - dotenv (env variables)

Hosting:
  - DigitalOcean App Platform ($12/month)
  - GitHub (free)

Frontend:
  - React (already set up)
  - Vite (already set up)
  - Tailwind (already set up)
  - React Router (navigate between pages)

Secrets (Env Vars):
  - CLAUDE_API_KEY
  - GITHUB_OAUTH_CLIENT_ID
  - GITHUB_OAUTH_CLIENT_SECRET
  - DATABASE_URL
  - GITHUB_TOKEN (for agent to push)
```

---

## Questions for Team to Answer

Before diving in, align on:

1. **Who owns the Actions repo?** (where Actions are stored)
   - Sydney's account? Team org? Separate GitHub org?

2. **Privacy:** Are saved Actions public or private?
   - Can anyone apply shared Actions?
   - Or only team members?

3. **GitHub OAuth scope:**
   - Read-only (safe, limited)
   - Read + write (needed to apply Actions)
   - What if user declines write access?

4. **Claude model:**
   - Use Claude Sonnet 4? (cheaper, faster)
   - Use Claude Opus 4? (smarter, slower, more expensive)
   - Estimate: $0.01-0.05 per adaptation, so cost shouldn't be blocker

5. **Failure mode:** If Claude adaptation fails, then what?
   - Show error + let user modify manually?
   - Fall back to direct copy?
   - Show Claude's reasoning?

6. **Undo scope:**
   - Can users undo each applied Action independently?
   - Or only revert commits?
   - Need to think about this

7. **Testing:** How do we test this without breaking real repos?
   - Use private test repos for each person?
   - Create throwaway "test-app-1" repos?

---

## Success Metrics (For Later)

Once MVP ships:

```
Technical:
  - API uptime > 99%
  - Application completes in < 30 seconds
  - Claude adaptation success rate > 90%

User:
  - User can save an Action in < 2 minutes
  - User can apply Action to new project in < 5 minutes
  - User feels confident reverting if something's wrong

Portfolio:
  - Case study clearly explains what iterait solves
  - Demo video shows end-to-end flow
  - Interviews: "This shows design-to-code fluency"
```

---

## This Is Enough to Start

You don't need to nail everything. Start building, answer questions as they come up, adjust weekly.

The key insight: **Git is doing the heavy lifting. You're just building a better UI on top of it.**

Everything else (Actions, adaptation, cross-platform) flows from that foundation.
