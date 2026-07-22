// Canned data returned by the API client when VITE_USE_MOCKS === 'true'.
// Lets the frontend run end-to-end before the backend agent exists.
// Shapes here are the contract the real backend should match — keep them in
// sync with docs/iterait-build-flow.md as endpoints go live.

// GitHub identity returned once the (mocked) OAuth flow "completes".
export const mockGithubUser = {
  login: 'sydneynguyyen',
  name: 'Sydney Nguyen',
  avatar: 'https://avatars.githubusercontent.com/u/123456',
}

const AVATARS = {
  'Sydney Nguyen': 'https://avatars.githubusercontent.com/u/123456',
  'Basmah Masood': 'https://avatars.githubusercontent.com/u/234567',
  'Shreya Hambir': 'https://avatars.githubusercontent.com/u/345678',
}

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => hoursAgo(d * 24)

// GitHub repos available to connect from the Dashboard's "Add Project" flow.
export const mockRepos = [
  {
    id: 'repo_1',
    name: 'my-lovable-app',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/my-lovable-app',
    description: 'Built in Lovable with React',
    commitCount: 2458,
    lastCommit: { message: 'Add button component', timestamp: hoursAgo(2), author: 'Sydney Nguyen' },
  },
  {
    id: 'repo_2',
    name: 'design-system-v2',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/design-system-v2',
    description: 'Design tokens and component library',
    commitCount: 143,
    lastCommit: { message: 'Update typography scale', timestamp: daysAgo(5), author: 'Shreya Hambir' },
  },
  {
    id: 'repo_3',
    name: 'claude-designer',
    owner: 'sydneynguyyen',
    url: 'https://github.com/sydneynguyyen/claude-designer',
    description: 'AI-powered design generator',
    commitCount: 8,
    lastCommit: { message: 'Initial setup', timestamp: daysAgo(14), author: 'Sydney Nguyen' },
  },
]

// Projects the user has connected on the Dashboard. owner/repo IS the
// identifier (matches Versions' /projects/:owner/:repo route) — no separate
// synthetic project id. Mutated in place by client.js's createProject mock.
export const mockProjects = [
  { name: 'Lovable App', repo: mockRepos[0], lastUpdated: hoursAgo(2) },
  { name: 'Design System', repo: mockRepos[1], lastUpdated: daysAgo(5) },
]

// --- Versions + Component Library + Design Systems -------------------------
// Versions are checkpoints on a project's timeline (one per meaningful
// commit). Each version has a rendered snapshot (the "interactive
// prototype") plus a list of components the detector found in it — each with
// a `selector` that resolves to the matching node inside snapshotHtml, so a
// future capture flow can hit-test/extract straight from the live preview.
// Saving a detected component copies its (already-extracted) `html` into
// mockLibrary, frozen at that version.

const pricingSnapshot = `<!DOCTYPE html><html><head><style>
:root{--brand:#1a1a1a;--brand-dark:#000;--radius:14px;--shadow:0 4px 14px rgba(0,0,0,.08);--bg:#f7f5f2;--ink:#1a1a1a;--muted:#6b6b6b}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,sans-serif;background:var(--bg);color:var(--ink)}
header.site-header{display:flex;justify-content:space-between;align-items:center;padding:16px 32px;border-bottom:1px solid #e8e4dd}
.logo{font-weight:700}
nav.main-nav a{margin-left:24px;color:var(--muted);text-decoration:none;font-size:14px}
section.hero{padding:56px 32px;text-align:center;background:linear-gradient(135deg,#ffd9c4,#c4d9ff)}
section.hero h1{font-size:34px;margin:0 0 8px}
section.plans{display:flex;gap:20px;justify-content:center;padding:36px 32px}
.pricing-card{background:#fff;border-radius:var(--radius);padding:24px;width:190px;box-shadow:var(--shadow);position:relative}
.pricing-card--pro{outline:2px solid var(--brand)}
.badge{position:absolute;top:-10px;right:16px;display:inline-flex;align-items:center;padding:4px 12px 4px 18px;border-radius:999px;background:var(--brand);color:#fff;font-size:11px;font-weight:600}
.badge::before{content:"";position:absolute;left:8px;width:6px;height:6px;border-radius:50%;background:#4ade80;animation:pulse 1.6s ease-in-out infinite}
.price{font-size:26px;font-weight:700;margin:8px 0}
#cta-primary{background:var(--brand);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;transition:background .15s}
#cta-primary:hover{background:var(--brand-dark)}
#cta-primary:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
form.signup-form{display:flex;gap:8px;justify-content:center;padding:0 32px 40px}
form.signup-form input{padding:10px 14px;border-radius:8px;border:1px solid #ddd;width:220px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (max-width:600px){section.plans{flex-direction:column;align-items:center}}
</style></head><body>
<header class="site-header"><span class="logo">Lovable App</span><nav class="main-nav"><a>Product</a><a>Pricing</a><a>Docs</a></nav></header>
<section class="hero"><h1>Simple, transparent pricing</h1><p>Pick a plan and ship today.</p></section>
<section class="plans">
<div class="pricing-card"><div class="price">$0</div>Starter<br/><button>Get started</button></div>
<div class="pricing-card pricing-card--pro"><span class="badge">Popular</span><div class="price">$29</div>Pro<br/><button id="cta-primary">Get started</button></div>
<div class="pricing-card"><div class="price">$99</div>Team<br/><button>Get started</button></div>
</section>
<form class="signup-form"><input placeholder="you@example.com"/><button>Subscribe</button></form>
</body></html>`

const mobileSnapshot = `<!DOCTYPE html><html><head><style>
:root{--brand:#6c8cff;--brand-dark:#3f5fe0;--radius:12px;--shadow:0 8px 24px rgba(0,0,0,.4);--bg:#14151a;--surface:#1c1e26;--ink:#f2f2f2;--muted:#9a9ba5}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,sans-serif;background:var(--bg);color:var(--ink)}
header.site-header{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;border-bottom:1px solid #262832}
.menu-icon{width:20px;height:14px;position:relative}
.menu-icon span{position:absolute;left:0;right:0;height:2px;background:var(--ink)}
.menu-icon span:nth-child(1){top:0}.menu-icon span:nth-child(2){top:6px}.menu-icon span:nth-child(3){top:12px}
nav.nav-drawer{background:var(--surface);margin:12px 24px;border-radius:var(--radius);padding:8px 0;box-shadow:var(--shadow)}
nav.nav-drawer a{display:block;padding:10px 16px;color:#dcdcdc;text-decoration:none;font-size:14px}
section.hero{margin:12px 24px;padding:32px 24px;border-radius:var(--radius);background:linear-gradient(135deg,#2a2d5c,#1c1e26);text-align:center}
section.hero h1{font-size:22px;margin:0 0 6px}
.badge{position:relative;display:inline-flex;align-items:center;margin:0 24px 16px;padding:4px 12px 4px 18px;border-radius:999px;background:var(--brand);color:#fff;font-size:11px;font-weight:600}
.badge::before{content:"";position:absolute;left:8px;width:6px;height:6px;border-radius:50%;background:#4ade80;animation:pulse 1.6s ease-in-out infinite}
.cards{display:flex;gap:12px;padding:0 24px 16px}
.feature-card{background:var(--surface);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);flex:1}
.feature-card h3{margin:0 0 6px;font-size:15px}
.feature-card p{margin:0;font-size:13px;color:var(--muted)}
form.search-form{display:flex;gap:8px;padding:0 24px 16px}
#search-input{flex:1;padding:10px 12px;border-radius:8px;border:1px solid #333;background:var(--surface);color:var(--ink)}
#search-input:focus-visible{outline:2px solid var(--brand)}
form.search-form button{background:var(--brand);color:#fff;border:none;border-radius:8px;padding:0 16px;cursor:pointer;transition:background .15s}
form.search-form button:hover{background:var(--brand-dark)}
#confirm-dialog{margin:0 24px 16px;padding:18px;border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow)}
#confirm-dialog h3{margin:0 0 8px;font-size:15px}
#confirm-dialog p{margin:0 0 14px;font-size:13px;color:var(--muted)}
#confirm-dialog button{background:#e5484d;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:13px;cursor:pointer}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (max-width:600px){.cards{flex-direction:column}nav.nav-drawer a{padding:12px 16px}}
</style></head><body>
<header class="site-header"><span>Lovable App</span><div class="menu-icon"><span></span><span></span><span></span></div></header>
<nav class="nav-drawer"><a>Home</a><a>Features</a><a>Pricing</a><a>Sign in</a></nav>
<section class="hero"><h1>Real-time sync, everywhere</h1></section>
<span class="badge">Beta</span>
<div class="cards">
<div class="feature-card"><h3>Real-time sync</h3><p>Changes appear on every device instantly.</p></div>
<div class="feature-card"><h3>Offline mode</h3><p>Keep working without a connection.</p></div>
</div>
<form class="search-form"><input id="search-input" placeholder="Search..."/><button>Go</button></form>
<div id="confirm-dialog"><h3>Discard changes?</h3><p>This can't be undone.</p><button>Discard</button></div>
</body></html>`

const paletteSnapshot = `<!DOCTYPE html><html><head><style>
:root{--brand:#5b3ea6;--brand-dark:#432d7c;--accent:#2ec4b6;--radius:14px;--shadow:0 6px 18px rgba(91,62,166,.25);--bg:#f2effa;--ink:#2b2140;--muted:#8a7ba8}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,sans-serif;background:var(--bg);color:var(--ink)}
header.site-header{padding:16px 32px;background:var(--brand);color:#fff;display:flex;justify-content:space-between}
header.site-header nav a{margin-left:20px;color:#fff;text-decoration:none;font-size:14px;opacity:.9}
section.hero{padding:52px 32px;text-align:center;background:linear-gradient(135deg,var(--brand),var(--accent));color:#fff;border-radius:0 0 var(--radius) var(--radius)}
section.hero h1{font-size:30px;margin:0 0 10px}
form.newsletter-form{display:flex;gap:8px;justify-content:center;margin-top:18px}
form.newsletter-form input{padding:10px 14px;border-radius:8px;border:none;width:220px}
#btn-secondary{padding:10px 18px;border-radius:8px;border:none;background:var(--ink);color:#fff;cursor:pointer;transition:background .15s}
#btn-secondary:hover{background:var(--brand-dark)}
#btn-secondary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cards{display:flex;gap:16px;justify-content:center;padding:28px 32px}
.feature-card{background:#fff;border-radius:var(--radius);padding:18px;width:180px;box-shadow:var(--shadow);color:var(--muted);font-size:14px}
.tooltip{position:relative;display:inline-block;margin:16px 32px;padding:10px 14px;background:var(--ink);color:#fff;border-radius:8px;font-size:13px}
.status-badge{position:relative;display:inline-flex;align-items:center;margin:0 32px 24px;padding:4px 12px 4px 18px;border-radius:999px;background:var(--accent);color:#fff;font-size:12px;font-weight:600}
.status-badge::before{content:"";position:absolute;left:8px;width:6px;height:6px;border-radius:50%;background:#fff;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (max-width:600px){.cards{flex-direction:column;align-items:center}header.site-header nav{display:none}}
</style></head><body>
<header class="site-header"><span>Lovable App</span><nav><a>Product</a><a>Pricing</a></nav></header>
<section class="hero"><h1>Design that adapts with you</h1>
<form class="newsletter-form"><input placeholder="you@example.com"/><button id="btn-secondary">Subscribe</button></form>
</section>
<div class="cards">
<div class="feature-card">Real-time collaboration</div>
<div class="feature-card">Version history</div>
</div>
<span class="tooltip">New: dark mode ↑</span>
<span class="status-badge">● Live</span>
</body></html>`

const focusStatesSnapshot = `<!DOCTYPE html><html><head><style>
:root{--brand:#222;--radius:6px;--shadow:0 2px 6px rgba(0,0,0,.06);--bg:#fff;--muted:#666;--focus:#6c8cff}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,sans-serif;background:var(--bg);color:var(--brand)}
nav.top-nav{display:flex;justify-content:space-between;padding:16px 28px;border-bottom:1px solid #eee}
nav.top-nav a{color:var(--brand);text-decoration:none;font-size:14px}
section.hero{padding:36px 28px}
section.hero h1{font-size:24px;margin:0 0 6px}
#btn-ghost{background:transparent;border:1px solid var(--brand);color:var(--brand);padding:8px 16px;border-radius:var(--radius);margin:0 28px 20px;cursor:pointer;transition:background .15s}
#btn-ghost:hover{background:#f2f2f2}
#btn-ghost:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.badge{position:relative;display:inline-flex;align-items:center;margin:0 28px 20px;padding:4px 12px 4px 18px;border-radius:999px;background:var(--brand);color:#fff;font-size:11px;font-weight:600}
.badge::before{content:"";position:absolute;left:8px;width:6px;height:6px;border-radius:50%;background:#4ade80;animation:pulse 1.6s ease-in-out infinite}
.cards{display:flex;gap:16px;padding:0 28px 24px}
.simple-card{border:1px solid #eee;border-radius:10px;padding:18px;width:200px;box-shadow:var(--shadow)}
.simple-card p{font-size:13px;color:var(--muted);margin:4px 0 0}
form.contact-form{display:flex;gap:10px;padding:0 28px 24px}
#focus-input{padding:9px 12px;border:1px solid #ccc;border-radius:var(--radius);width:220px}
#focus-input:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(108,140,255,.35);border-color:var(--focus)}
form.contact-form button{padding:9px 16px;border-radius:var(--radius);border:none;background:var(--brand);color:#fff;cursor:pointer}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@media (max-width:600px){.cards{flex-direction:column}nav.top-nav{flex-direction:column;gap:8px}}
</style></head><body>
<nav class="top-nav"><span>Lovable App</span><a>Home</a></nav>
<section class="hero"><h1>Every input, polished</h1></section>
<button id="btn-ghost">Learn more</button>
<span class="badge">Beta</span>
<div class="cards">
<div class="simple-card"><strong>Simple card</strong><p>No shadows yet.</p></div>
<div class="simple-card"><strong>Another card</strong><p>Still catching up.</p></div>
</div>
<form class="contact-form"><input id="focus-input" placeholder="Focus me"/><button>Send</button></form>
</body></html>`

const initialLayoutSnapshot = `<!DOCTYPE html><html><head><style>
:root{--brand:#555;--radius:4px;--shadow:0 1px 2px rgba(0,0,0,.04);--bg:#fafafa;--muted:#777}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,sans-serif;background:var(--bg);color:#333}
nav.nav-skeleton{display:flex;gap:16px;padding:14px 24px;border-bottom:1px solid #ddd;color:var(--muted)}
nav.nav-skeleton a{color:var(--muted);text-decoration:none}
section.hero{padding:32px 24px}
section.hero h1{font-size:22px;margin:0 0 6px;font-weight:600}
.cards{display:flex;gap:16px;padding:0 24px 20px}
.base-card{border:1px solid #ddd;border-radius:var(--radius);padding:16px;width:220px;background:#fff;box-shadow:var(--shadow)}
#btn-default{background:#ddd;color:#333;border:none;padding:8px 14px;border-radius:var(--radius);margin:0 24px 20px;cursor:pointer;transition:background .15s}
#btn-default:hover{background:#ccc}
#btn-default:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
form.basic-form{display:flex;gap:8px;padding:0 24px 20px}
form.basic-form input{padding:8px 10px;border:1px solid #ccc;border-radius:var(--radius)}
form.basic-form button{padding:8px 14px;border:1px solid #ccc;border-radius:var(--radius);background:#fff}
.label-badge{position:relative;display:inline-flex;align-items:center;margin:0 24px 20px;padding:3px 10px 3px 16px;border:1px solid #999;border-radius:var(--radius);font-size:11px;color:var(--muted)}
.label-badge::before{content:"";position:absolute;left:6px;width:5px;height:5px;border-radius:50%;background:#999;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@media (max-width:600px){.cards{flex-direction:column}nav.nav-skeleton{flex-wrap:wrap}}
</style></head><body>
<nav class="nav-skeleton"><span>Lovable App</span><a>Home</a><a>About</a></nav>
<section class="hero"><h1>Placeholder headline</h1></section>
<div class="cards">
<div class="base-card">Placeholder card content</div>
<div class="base-card">Another placeholder</div>
</div>
<button id="btn-default">Click me</button>
<span class="label-badge">draft</span>
<form class="basic-form"><input placeholder="Type here"/><button>Go</button></form>
</body></html>`

export const mockVersions = {
  'sydneynguyyen/my-lovable-app': [
    {
      id: 'ver_5',
      versionNumber: 5,
      label: 'Pricing page polish',
      commitSha: 'abc123d',
      commitMessage: 'Add button component',
      author: 'Sydney Nguyen',
      avatar: AVATARS['Sydney Nguyen'],
      createdAt: hoursAgo(2),
      componentsCount: 5,
      snapshotHtml: pricingSnapshot,
      components: [
        { id: 'cmp_v5_button', name: 'Primary CTA button', type: 'button', saved: false, selector: '#cta-primary', html: '<button style="background:#1a1a1a;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;font-family:sans-serif;cursor:pointer">Get started</button>' },
        { id: 'cmp_v5_card', name: 'Pricing card', type: 'card', saved: false, selector: '.pricing-card--pro', html: '<div style="font-family:sans-serif;background:#fff;border-radius:14px;padding:24px;width:200px;box-shadow:0 4px 12px rgba(0,0,0,.08)"><div style="font-size:28px;font-weight:700;margin:8px 0">$29</div>Pro plan</div>' },
        { id: 'cmp_v5_badge', name: 'Popular badge', type: 'badge', saved: false, selector: '.badge', html: '<span style="font-family:sans-serif;background:#1a1a1a;color:#fff;font-size:11px;padding:3px 10px;border-radius:999px">Popular</span>' },
        { id: 'cmp_v5_nav', name: 'Top nav bar', type: 'nav', saved: true, selector: '.main-nav', html: '<nav style="font-family:sans-serif;display:flex;gap:24px;padding:16px 32px;border-bottom:1px solid #e8e4dd"><span style="font-weight:700">Lovable App</span><a style="color:#4a4a4a;text-decoration:none;font-size:14px">Product</a><a style="color:#4a4a4a;text-decoration:none;font-size:14px">Pricing</a></nav>' },
        { id: 'cmp_v5_hero', name: 'Hero banner', type: 'hero', saved: false, selector: '.hero', html: '<section style="font-family:sans-serif;padding:64px 32px;text-align:center;background:linear-gradient(135deg,#ffd9c4,#c4d9ff);border-radius:12px"><h1 style="font-size:32px;margin:0 0 8px">Simple, transparent pricing</h1><p>Pick a plan and ship today.</p></section>' },
      ],
    },
    {
      id: 'ver_4',
      versionNumber: 4,
      label: 'Mobile nav fixes',
      commitSha: 'def456g',
      commitMessage: 'Fix responsive layout on mobile',
      author: 'Basmah Masood',
      avatar: AVATARS['Basmah Masood'],
      createdAt: daysAgo(1),
      componentsCount: 4,
      snapshotHtml: mobileSnapshot,
      components: [
        { id: 'cmp_v4_nav', name: 'Mobile nav drawer', type: 'nav', saved: false, selector: '.nav-drawer', html: '<div style="font-family:sans-serif;background:#1c1e26;color:#dcdcdc;border-radius:12px;padding:16px;width:200px"><a style="display:block;padding:10px 0;border-bottom:1px solid #262832;font-size:14px;color:#dcdcdc;text-decoration:none">Home</a><a style="display:block;padding:10px 0;font-size:14px;color:#dcdcdc;text-decoration:none">Pricing</a></div>' },
        { id: 'cmp_v4_card', name: 'Feature card', type: 'card', saved: false, selector: '.feature-card', html: '<div style="font-family:sans-serif;background:#1c1e26;color:#f2f2f2;border-radius:12px;padding:18px;width:220px"><h3 style="margin:0 0 6px;font-size:15px">Real-time sync</h3><p style="margin:0;font-size:13px;color:#9a9ba5">Changes appear on every device instantly.</p></div>' },
        { id: 'cmp_v4_modal', name: 'Confirm dialog', type: 'modal', saved: false, selector: '#confirm-dialog', html: '<div style="font-family:sans-serif;background:#1c1e26;color:#f2f2f2;border-radius:12px;padding:20px;width:240px;box-shadow:0 8px 24px rgba(0,0,0,.4)"><h3 style="margin:0 0 8px;font-size:15px">Discard changes?</h3><p style="margin:0 0 16px;font-size:13px;color:#9a9ba5">This can\'t be undone.</p><button style="background:#e5484d;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:13px">Discard</button></div>' },
        { id: 'cmp_v4_input', name: 'Search input', type: 'input', saved: true, selector: '#search-input', html: '<input placeholder="Search..." style="font-family:sans-serif;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#1c1e26;color:#f2f2f2;width:200px"/>' },
      ],
    },
    {
      id: 'ver_3',
      versionNumber: 3,
      label: 'Color palette refresh',
      commitSha: 'ghi789j',
      commitMessage: 'Update color palette',
      author: 'Shreya Hambir',
      avatar: AVATARS['Shreya Hambir'],
      createdAt: daysAgo(3),
      componentsCount: 5,
      snapshotHtml: paletteSnapshot,
      components: [
        { id: 'cmp_v3_badge', name: 'Status badge', type: 'badge', saved: false, selector: '.status-badge', html: '<span style="font-family:sans-serif;display:inline-block;padding:4px 12px;border-radius:999px;background:#2ec4b6;color:#fff;font-size:12px;font-weight:600">● Live</span>' },
        { id: 'cmp_v3_button', name: 'Secondary button', type: 'button', saved: false, selector: '#btn-secondary', html: '<button style="font-family:sans-serif;padding:10px 16px;border-radius:8px;border:none;background:#2b2140;color:#fff">Subscribe</button>' },
        { id: 'cmp_v3_popup', name: 'Tooltip popup', type: 'popup', saved: false, selector: '.tooltip', html: '<span style="font-family:sans-serif;display:inline-block;padding:10px 14px;background:#2b2140;color:#fff;border-radius:8px;font-size:13px">New: dark mode ↑</span>' },
        { id: 'cmp_v3_form', name: 'Newsletter signup form', type: 'form', saved: false, selector: '.newsletter-form', html: '<form style="font-family:sans-serif;display:flex;gap:8px"><input placeholder="you@example.com" style="padding:10px 14px;border-radius:8px;border:1px solid #ccc;width:220px"/><button style="padding:10px 16px;border-radius:8px;border:none;background:#2b2140;color:#fff">Subscribe</button></form>' },
        { id: 'cmp_v3_hero', name: 'Landing hero', type: 'hero', saved: true, selector: '.hero', html: '<section style="font-family:sans-serif;padding:56px 32px;text-align:center;background:linear-gradient(135deg,#5b3ea6,#2ec4b6);color:#fff;border-radius:12px"><h1 style="font-size:28px;margin:0">Design that adapts with you</h1></section>' },
      ],
    },
    {
      id: 'ver_2',
      versionNumber: 2,
      label: 'Input focus states',
      commitSha: 'jkl012m',
      commitMessage: 'Add hover + focus states to inputs',
      author: 'Sydney Nguyen',
      avatar: AVATARS['Sydney Nguyen'],
      createdAt: daysAgo(4),
      componentsCount: 4,
      snapshotHtml: focusStatesSnapshot,
      components: [
        { id: 'cmp_v2_input', name: 'Text input with focus ring', type: 'input', saved: false, selector: '#focus-input', html: '<input placeholder="Focus me" style="font-family:sans-serif;padding:9px 12px;border:1px solid #ccc;border-radius:6px;width:200px"/>' },
        { id: 'cmp_v2_button', name: 'Ghost button', type: 'button', saved: false, selector: '#btn-ghost', html: '<button style="font-family:sans-serif;background:transparent;border:1px solid #222;color:#222;padding:8px 16px;border-radius:6px">Learn more</button>' },
        { id: 'cmp_v2_card', name: 'Simple card', type: 'card', saved: false, selector: '.simple-card', html: '<div style="font-family:sans-serif;border:1px solid #eee;border-radius:10px;padding:18px;width:220px"><strong>Simple card</strong><p style="font-size:13px;color:#666;margin:4px 0 0">No shadows yet.</p></div>' },
        { id: 'cmp_v2_nav', name: 'Basic top nav', type: 'nav', saved: false, selector: '.top-nav', html: '<nav style="font-family:sans-serif;display:flex;justify-content:space-between;padding:16px 28px;border-bottom:1px solid #eee"><span>Lovable App</span><a style="color:#222;text-decoration:none">Home</a></nav>' },
      ],
    },
    {
      id: 'ver_1',
      versionNumber: 1,
      label: 'Initial layout',
      commitSha: 'mno345p',
      commitMessage: 'Extract shared card shadow token',
      author: 'Basmah Masood',
      avatar: AVATARS['Basmah Masood'],
      createdAt: daysAgo(5),
      componentsCount: 4,
      snapshotHtml: initialLayoutSnapshot,
      components: [
        { id: 'cmp_v1_card', name: 'Base card', type: 'card', saved: false, selector: '.base-card', html: '<div style="font-family:sans-serif;border:1px solid #ddd;border-radius:4px;padding:16px;width:220px;background:#fff">Placeholder card content</div>' },
        { id: 'cmp_v1_button', name: 'Default button', type: 'button', saved: false, selector: '#btn-default', html: '<button style="font-family:sans-serif;background:#ddd;color:#333;border:none;padding:8px 14px;border-radius:4px">Click me</button>' },
        { id: 'cmp_v1_nav', name: 'Nav skeleton', type: 'nav', saved: false, selector: '.nav-skeleton', html: '<nav style="font-family:sans-serif;display:flex;gap:16px;padding:14px 24px;border-bottom:1px solid #ddd;color:#555"><span>Lovable App</span><a style="color:#555;text-decoration:none">Home</a><a style="color:#555;text-decoration:none">About</a></nav>' },
        { id: 'cmp_v1_badge', name: 'Label badge', type: 'badge', saved: false, selector: '.label-badge', html: '<span style="font-family:sans-serif;display:inline-block;padding:3px 10px;border:1px solid #999;border-radius:4px;font-size:11px;color:#555">draft</span>' },
      ],
    },
  ],
}

// Saved component library (frozen copies of detected components). Seeded
// across every type so Library filters have something to show. Each row is
// the full round-trip shape saveComponent() produces: the extracted
// html+css (captured separately, per extractComponent.js — these seeded
// rows predate that split and so carry inline-styled html with empty css),
// capturedWidth, and provenance (sourceProject/sourceVersionId/
// sourceSelector). lineageId is null for a lineage's first-saved variant;
// later variants point their lineageId at that first variant's id, and
// variantNumber counts up from 1 within a lineage — see client.js's
// lineageKeyOf. lib_1 and lib_3 each seed a small lineage so Library/
// ComponentDetail's "N versions" affordance has something to show.
export const mockLibrary = [
  { id: 'lib_1', name: 'Primary CTA button', type: 'button', html: mockVersions['sydneynguyyen/my-lovable-app'][0].components[0].html, css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '#cta-primary', lineageId: null, variantNumber: 1, createdAt: daysAgo(2), designSystemIds: ['ds_marketing'] },
  { id: 'lib_11', name: 'Primary CTA button', type: 'button', html: '<button style="background:#000;color:#fff;border:none;padding:12px 20px;border-radius:12px;font-size:14px;font-family:sans-serif;cursor:pointer">Get started</button>', css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '#cta-primary', lineageId: 'lib_1', variantNumber: 2, createdAt: hoursAgo(2), designSystemIds: ['ds_marketing'] },
  { id: 'lib_2', name: 'Top nav bar', type: 'nav', html: mockVersions['sydneynguyyen/my-lovable-app'][0].components[3].html, css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '.main-nav', lineageId: null, variantNumber: 1, createdAt: hoursAgo(2), designSystemIds: ['ds_marketing', 'ds_app'] },
  { id: 'lib_3', name: 'Pricing card', type: 'card', html: mockVersions['sydneynguyyen/my-lovable-app'][0].components[1].html, css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '.pricing-card--pro', lineageId: null, variantNumber: 1, createdAt: daysAgo(2), designSystemIds: ['ds_marketing'] },
  { id: 'lib_12', name: 'Pricing card', type: 'card', html: '<div style="font-family:sans-serif;background:#fff;border-radius:14px;padding:24px;width:200px;box-shadow:0 4px 12px rgba(0,0,0,.08);border:1px solid #eee"><div style="font-size:28px;font-weight:700;margin:8px 0">$29</div>Pro plan — annual</div>', css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '.pricing-card--pro', lineageId: 'lib_3', variantNumber: 2, createdAt: daysAgo(1), designSystemIds: ['ds_marketing'] },
  { id: 'lib_13', name: 'Pricing card', type: 'card', html: '<div style="font-family:sans-serif;background:#1a1a1a;color:#fff;border-radius:14px;padding:24px;width:200px;box-shadow:0 4px 12px rgba(0,0,0,.25)"><div style="font-size:28px;font-weight:700;margin:8px 0">$29</div>Pro plan — dark</div>', css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '.pricing-card--pro', lineageId: 'lib_3', variantNumber: 3, createdAt: hoursAgo(6), designSystemIds: ['ds_marketing'] },
  { id: 'lib_4', name: 'Popular badge', type: 'badge', html: mockVersions['sydneynguyyen/my-lovable-app'][0].components[2].html, css: '', capturedWidth: 1440, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_5', sourceSelector: '.badge', lineageId: null, variantNumber: 1, createdAt: daysAgo(2), designSystemIds: ['ds_marketing'] },
  { id: 'lib_5', name: 'Search input', type: 'input', html: mockVersions['sydneynguyyen/my-lovable-app'][1].components[3].html, css: '', capturedWidth: 375, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_4', sourceSelector: '#search-input', lineageId: null, variantNumber: 1, createdAt: daysAgo(1), designSystemIds: ['ds_app'] },
  { id: 'lib_6', name: 'Confirm dialog', type: 'modal', html: mockVersions['sydneynguyyen/my-lovable-app'][1].components[2].html, css: '', capturedWidth: 375, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_4', sourceSelector: '#confirm-dialog', lineageId: null, variantNumber: 1, createdAt: daysAgo(1), designSystemIds: ['ds_app'] },
  { id: 'lib_7', name: 'Newsletter signup form', type: 'form', html: mockVersions['sydneynguyyen/my-lovable-app'][2].components[3].html, css: '', capturedWidth: 1280, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_3', sourceSelector: '.newsletter-form', lineageId: null, variantNumber: 1, createdAt: daysAgo(3), designSystemIds: [] },
  { id: 'lib_8', name: 'Landing hero', type: 'hero', html: mockVersions['sydneynguyyen/my-lovable-app'][2].components[4].html, css: '', capturedWidth: 1280, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_3', sourceSelector: '.hero', lineageId: null, variantNumber: 1, createdAt: daysAgo(3), designSystemIds: ['ds_marketing'] },
  { id: 'lib_9', name: 'Tooltip popup', type: 'popup', html: mockVersions['sydneynguyyen/my-lovable-app'][2].components[2].html, css: '', capturedWidth: 1280, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_3', sourceSelector: '.tooltip', lineageId: null, variantNumber: 1, createdAt: daysAgo(3), designSystemIds: [] },
  { id: 'lib_10', name: 'Ghost button', type: 'button', html: mockVersions['sydneynguyyen/my-lovable-app'][3].components[1].html, css: '', capturedWidth: 1280, sourceProject: 'sydneynguyyen/my-lovable-app', sourceVersionId: 'ver_2', sourceSelector: '#btn-ghost', lineageId: null, variantNumber: 1, createdAt: daysAgo(4), designSystemIds: ['ds_app'] },
]

// Design systems group saved library components into reusable sets (e.g. for
// export or handoff). componentIds reference mockLibrary ids.
export const mockDesignSystems = [
  { id: 'ds_marketing', name: 'Marketing UI', description: 'Landing page and pricing components', componentIds: ['lib_1', 'lib_2', 'lib_3', 'lib_4', 'lib_8'], createdAt: daysAgo(6) },
  { id: 'ds_app', name: 'App Shell', description: 'Core navigation and form components for the logged-in app', componentIds: ['lib_2', 'lib_5', 'lib_6', 'lib_10'], createdAt: daysAgo(4) },
]
