import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import VersionSidebar from '../components/VersionSidebar'
import AnnotationDot from '../components/AnnotationDot'
import ChangeLogPanel from '../components/ChangeLogPanel'
import { generateChangeSummary } from '../utils/claudeApi'
import { captureBeforeAfter } from '../utils/captureSnapshot'
import CompanionPanel from '../components/CompanionPanel'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('iterait_api_token') || ''}` }
}

const CATEGORY_COLORS = { Visual:'#3B82F6', Layout:'#8B5CF6', Typography:'#F59E0B', Color:'#14B8A6' }

function loadVersions() {
  try { return JSON.parse(localStorage.getItem('iterait_versions') || '[]') } catch { return [] }
}
function saveVersions(v) { localStorage.setItem('iterait_versions', JSON.stringify(v)) }
function loadActions() {
  try { return JSON.parse(localStorage.getItem('iterait_actions') || '[]') } catch { return [] }
}
function saveActions(a) { localStorage.setItem('iterait_actions', JSON.stringify(a)) }
function loadChains() {
  try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] }
}
function saveChains(c) { localStorage.setItem('iterait_chains', JSON.stringify(c)) }

export default function FileView() {
  const navigate = useNavigate()
  const [versions, setVersions]           = useState(loadVersions)
  const [currentVersionId, setCurrentVersionId] = useState(() => { const v = loadVersions(); return v.length ? v[v.length - 1].id : null })
  const [compareVersionId, setCompareVersionId] = useState(null)
  const [compareMode, setCompareMode]     = useState(false)
  const [activeChangeId, setActiveChangeId] = useState(null)
  const [selectedIds, setSelectedIds]     = useState([])
  const [showCompanion, setShowCompanion] = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [actionModal, setActionModal]     = useState(null)
  const [chainModal, setChainModal]       = useState(null)
  const [actionName, setActionName]         = useState('')
  const [chainName, setChainName]           = useState('')
  const [chainDescription, setChainDescription] = useState('')
  const [isSaving, setIsSaving]             = useState(false)
  const [iframeSrc, setIframeSrc]           = useState('')
  const [demoMode, setDemoMode]             = useState(true)
  const iframeRef   = useRef(null)
  const fileInputRef = useRef(null)

  const currentVersion = versions.find(v => v.id === currentVersionId)
  const changes = currentVersion?.changes || []

  // Persist versions whenever they change
  useEffect(() => { saveVersions(versions) }, [versions])

  // Auto-select newest version
  useEffect(() => {
    if (!currentVersionId && versions.length) setCurrentVersionId(versions[versions.length - 1].id)
  }, [versions, currentVersionId])

  useEffect(() => {
    if (!currentVersion?.htmlContent) return
    const inject = `<style>
    body::before, body::after { display: none !important; }
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    [data-aos] { opacity: 1 !important; transform: none !important; }
  </style>`
    const html = currentVersion.htmlContent.replace('</head>', inject + '</head>')
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setIframeSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [currentVersion?.id])

  useEffect(() => {
    const DEMO_VERSIONS = [
      {
        id: 'demo-v1',
        number: 1,
        label: 'Marketing Landing Page',
        timestamp: new Date(Date.now() - 86400000 * 3).toLocaleString(),
        source: 'Loveable',
        thumbnail: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#5BC4C0"/><stop offset="50%" style="stop-color:#7EB8E8"/><stop offset="100%" style="stop-color:#F0A882"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect x="20" y="20" width="360" height="40" rx="4" fill="rgba(255,255,255,0.3)"/><rect x="20" y="80" width="280" height="32" rx="4" fill="rgba(255,255,255,0.5)"/><rect x="20" y="124" width="200" height="16" rx="3" fill="rgba(255,255,255,0.3)"/><rect x="20" y="152" width="160" height="16" rx="3" fill="rgba(255,255,255,0.3)"/><rect x="20" y="190" width="120" height="36" rx="18" fill="rgba(255,255,255,0.7)"/><rect x="20" y="240" width="100" height="12" rx="3" fill="rgba(255,255,255,0.2)"/><rect x="140" y="240" width="100" height="12" rx="3" fill="rgba(255,255,255,0.2)"/><rect x="260" y="240" width="100" height="12" rx="3" fill="rgba(255,255,255,0.2)"/></svg>`),
        changes: [],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nova — The AI Writing Assistant</title><style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;}
nav{padding:20px 60px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;}
.logo{font-size:22px;font-weight:800;letter-spacing:-0.04em;}
.logo span{color:#6366f1;}
.nav-links{display:flex;gap:36px;font-size:14px;color:#666;font-weight:500;}
.nav-cta{background:#111;color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;}
.hero{padding:100px 60px 80px;max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.hero-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:20px;}
h1{font-size:56px;font-weight:800;letter-spacing:-0.04em;line-height:1.05;margin-bottom:24px;}
.hero-sub{font-size:18px;color:#666;line-height:1.7;margin-bottom:40px;}
.hero-btns{display:flex;gap:12px;}
.btn-primary{background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;border:none;cursor:pointer;}
.btn-secondary{background:#f5f5f5;color:#111;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;border:none;cursor:pointer;}
.hero-visual{background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:20px;padding:32px;height:360px;display:flex;flex-direction:column;gap:12px;}
.mock-bar{height:12px;background:rgba(99,102,241,0.2);border-radius:6px;}
.mock-bar.w60{width:60%;}
.mock-bar.w80{width:80%;}
.mock-text{height:8px;background:rgba(99,102,241,0.12);border-radius:4px;margin-top:4px;}
.mock-btn{height:40px;width:140px;background:#6366f1;border-radius:10px;margin-top:12px;}
.logos-row{padding:40px 60px;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;display:flex;gap:60px;align-items:center;}
.logos-label{font-size:12px;font-weight:600;color:#bbb;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
.logo-item{font-size:16px;font-weight:700;color:#ccc;}
.features{padding:100px 60px;max-width:1280px;margin:0 auto;}
.section-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:16px;}
.features h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;}
.features-sub{font-size:18px;color:#666;margin-bottom:64px;max-width:560px;}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.feature-card{padding:32px;border:1px solid #f0f0f0;border-radius:16px;}
.feature-icon{width:48px;height:48px;background:#eef2ff;border-radius:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;font-size:24px;}
.feature-card h3{font-size:17px;font-weight:700;margin-bottom:10px;}
.feature-card p{font-size:14px;color:#666;line-height:1.7;}
.pricing{padding:100px 60px;background:#fafafa;}
.pricing-inner{max-width:1280px;margin:0 auto;text-align:center;}
.pricing h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;}
.pricing-sub{font-size:18px;color:#666;margin-bottom:64px;}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto;}
.plan{background:#fff;padding:36px;border-radius:20px;border:1px solid #f0f0f0;text-align:left;}
.plan.pro{background:#6366f1;color:#fff;border-color:#6366f1;}
.plan-tier{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-bottom:16px;}
.plan.pro .plan-tier{color:rgba(255,255,255,0.6);}
.plan-price{font-size:48px;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px;}
.plan-period{font-size:14px;color:#999;margin-bottom:32px;}
.plan.pro .plan-period{color:rgba(255,255,255,0.6);}
.plan-features{display:flex;flex-direction:column;gap:12px;}
.plan-feature{font-size:14px;color:#555;display:flex;align-items:center;gap:8px;}
.plan.pro .plan-feature{color:rgba(255,255,255,0.85);}
.check{color:#6366f1;font-weight:700;}
.plan.pro .check{color:#fff;}
.plan-cta{width:100%;padding:14px;border-radius:10px;font-size:15px;font-weight:600;border:none;cursor:pointer;margin-top:28px;background:#f0f0f0;color:#111;}
.plan.pro .plan-cta{background:#fff;color:#6366f1;}
footer{padding:60px;background:#fff;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;}
.footer-logo{font-size:20px;font-weight:800;letter-spacing:-0.04em;}
.footer-logo span{color:#6366f1;}
.footer-links{display:flex;gap:32px;font-size:14px;color:#999;}
.footer-copy{font-size:13px;color:#bbb;}
</style></head><body>
<nav><div class="logo">nov<span>a</span></div><div class="nav-links"><span>Features</span><span>Pricing</span><span>Blog</span><span>Docs</span></div><button class="nav-cta">Start free</button></nav>
<div class="hero"><div><div class="hero-label">AI-powered writing</div><h1>Write better, faster, together.</h1><p class="hero-sub">Nova is the AI writing assistant that learns your voice, matches your brand, and helps your team create content that actually converts.</p><div class="hero-btns"><button class="btn-primary">Get started free</button><button class="btn-secondary">See a demo →</button></div></div><div class="hero-visual"><div class="mock-bar w80"></div><div class="mock-bar w60"></div><div class="mock-text" style="width:80%"></div><div class="mock-text" style="width:70%"></div><div class="mock-text" style="width:85%"></div><div class="mock-btn"></div></div></div>
<div class="logos-row"><span class="logos-label">Trusted by teams at</span><span class="logo-item">Meridian</span><span class="logo-item">Arclight</span><span class="logo-item">Ventis</span><span class="logo-item">Holocene</span><span class="logo-item">Driftwood</span></div>
<div class="features"><div class="section-label">Why Nova</div><h2>Everything you need to write well</h2><p class="features-sub">From first draft to final polish, Nova is with you at every step.</p><div class="feature-grid"><div class="feature-card"><div class="feature-icon">✦</div><h3>AI that learns your voice</h3><p>Nova adapts to your writing style so every output sounds like you, not a robot.</p></div><div class="feature-card"><div class="feature-icon">⚡</div><h3>10x faster drafting</h3><p>Go from brief to first draft in seconds. Spend time editing, not starting.</p></div><div class="feature-card"><div class="feature-icon">🎯</div><h3>Built for teams</h3><p>Shared brand voice, style guides, and collaborative editing in one place.</p></div><div class="feature-card"><div class="feature-icon">📊</div><h3>Performance insights</h3><p>See which content drives results and double down on what works.</p></div><div class="feature-card"><div class="feature-icon">🔒</div><h3>Enterprise secure</h3><p>SOC 2 compliant. Your data never trains our models. Ever.</p></div><div class="feature-card"><div class="feature-icon">🔗</div><h3>Integrates everywhere</h3><p>Works with Notion, Figma, Webflow, HubSpot, and 40+ more tools.</p></div></div></div>
<div class="pricing"><div class="pricing-inner"><div class="section-label">Pricing</div><h2>Simple, honest pricing</h2><p class="pricing-sub">Start free. No credit card required.</p><div class="plans"><div class="plan"><div class="plan-tier">Starter</div><div class="plan-price">$0</div><div class="plan-period">forever free</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> 5,000 words/month</div><div class="plan-feature"><span class="check">✓</span> 3 projects</div><div class="plan-feature"><span class="check">✓</span> Basic templates</div></div><button class="plan-cta">Get started</button></div><div class="plan pro"><div class="plan-tier">Pro</div><div class="plan-price">$29</div><div class="plan-period">per month</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Unlimited words</div><div class="plan-feature"><span class="check">✓</span> Unlimited projects</div><div class="plan-feature"><span class="check">✓</span> Custom voice training</div><div class="plan-feature"><span class="check">✓</span> Priority support</div></div><button class="plan-cta">Start free trial</button></div><div class="plan"><div class="plan-tier">Enterprise</div><div class="plan-price">Custom</div><div class="plan-period">contact us</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Everything in Pro</div><div class="plan-feature"><span class="check">✓</span> SSO &amp; compliance</div><div class="plan-feature"><span class="check">✓</span> Dedicated success</div><div class="plan-feature"><span class="check">✓</span> Custom contracts</div></div><button class="plan-cta">Talk to sales</button></div></div></div></div>
<footer><div class="footer-logo">nov<span>a</span></div><div class="footer-links"><span>Privacy</span><span>Terms</span><span>Security</span><span>Status</span></div><div class="footer-copy">© 2026 Nova Inc. All rights reserved.</div></footer>
</body></html>`
      },
      {
        id: 'demo-v2',
        number: 2,
        label: 'Marketing Landing Page',
        timestamp: new Date(Date.now() - 86400000 * 2).toLocaleString(),
        source: 'Loveable',
        thumbnail: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F5B08A"/><stop offset="50%" style="stop-color:#F08080"/><stop offset="100%" style="stop-color:#C4B5FD"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect x="0" y="0" width="400" height="50" fill="rgba(0,0,0,0.4)"/><rect x="20" y="15" width="60" height="20" rx="4" fill="rgba(255,255,255,0.5)"/><rect x="300" y="12" width="80" height="28" rx="14" fill="rgba(255,255,255,0.8)"/><rect x="20" y="80" width="240" height="36" rx="4" fill="rgba(255,255,255,0.6)"/><rect x="20" y="128" width="180" height="16" rx="3" fill="rgba(255,255,255,0.4)"/><rect x="20" y="152" width="200" height="16" rx="3" fill="rgba(255,255,255,0.4)"/><rect x="20" y="190" width="130" height="40" rx="20" fill="rgba(255,255,255,0.8)"/><rect x="20" y="248" width="80" height="10" rx="3" fill="rgba(255,255,255,0.2)"/><rect x="120" y="248" width="80" height="10" rx="3" fill="rgba(255,255,255,0.2)"/></svg>`),
        changes: [
          { id:1, category:'Visual', title:'Nav style darkened', description:'Navigation background changed from white to dark for stronger contrast', beforeValue:'#ffffff', afterValue:'#0f0f0f', approximatePosition:5 },
          { id:2, category:'Visual', title:'Button color changed', description:'Primary CTA button changed from indigo to vibrant coral pink', beforeValue:'#6366f1', afterValue:'#f43f5e', approximatePosition:45 },
          { id:3, category:'Typography', title:'Headline size increased', description:'Hero headline increased from 56px to 72px for bolder presence', beforeValue:'56px', afterValue:'72px', approximatePosition:30 },
          { id:4, category:'Layout', title:'Card border-radius increased', description:'Feature cards border-radius increased from 16px to 24px', beforeValue:'16px', afterValue:'24px', approximatePosition:65 },
          { id:5, category:'Visual', title:'Card shadow elevated', description:'Feature card box-shadow depth increased for stronger elevation', beforeValue:'none', afterValue:'0 20px 60px rgba(0,0,0,0.1)', approximatePosition:68 }
        ],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nova — v2</title><style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;}
nav{padding:20px 60px;display:flex;justify-content:space-between;align-items:center;background:#0f0f0f;}
.logo{font-size:22px;font-weight:800;letter-spacing:-0.04em;color:#fff;}
.logo span{color:#f43f5e;}
.nav-links{display:flex;gap:36px;font-size:14px;color:rgba(255,255,255,0.6);font-weight:500;}
.nav-cta{background:#f43f5e;color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;}
.hero{padding:120px 60px 80px;max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.hero-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#f43f5e;margin-bottom:20px;}
h1{font-size:72px;font-weight:800;letter-spacing:-0.04em;line-height:1.0;margin-bottom:24px;}
.hero-sub{font-size:18px;color:#666;line-height:1.7;margin-bottom:40px;}
.hero-btns{display:flex;gap:12px;}
.btn-primary{background:#f43f5e;color:#fff;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:600;border:none;cursor:pointer;}
.btn-secondary{background:#f5f5f5;color:#111;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:600;border:none;cursor:pointer;}
.hero-visual{background:linear-gradient(135deg,#fff1f2,#ffe4e6);border-radius:24px;padding:32px;height:360px;display:flex;flex-direction:column;gap:12px;}
.mock-bar{height:12px;background:rgba(244,63,94,0.2);border-radius:6px;}
.mock-text{height:8px;background:rgba(244,63,94,0.1);border-radius:4px;margin-top:4px;}
.mock-btn{height:40px;width:140px;background:#f43f5e;border-radius:999px;margin-top:12px;}
.logos-row{padding:40px 60px;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;display:flex;gap:60px;align-items:center;}
.logos-label{font-size:12px;font-weight:600;color:#bbb;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
.logo-item{font-size:16px;font-weight:700;color:#ccc;}
.features{padding:100px 60px;max-width:1280px;margin:0 auto;}
.section-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#f43f5e;margin-bottom:16px;}
.features h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;}
.features-sub{font-size:18px;color:#666;margin-bottom:64px;max-width:560px;}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.feature-card{padding:36px;border:1px solid #f0f0f0;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.08);}
.feature-icon{width:48px;height:48px;background:#fff1f2;border-radius:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;font-size:24px;}
.feature-card h3{font-size:17px;font-weight:700;margin-bottom:10px;}
.feature-card p{font-size:14px;color:#666;line-height:1.7;}
.pricing{padding:100px 60px;background:#fafafa;}
.pricing-inner{max-width:1280px;margin:0 auto;text-align:center;}
.pricing h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;}
.pricing-sub{font-size:18px;color:#666;margin-bottom:64px;}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto;}
.plan{background:#fff;padding:36px;border-radius:24px;border:1px solid #f0f0f0;text-align:left;box-shadow:0 20px 60px rgba(0,0,0,0.06);}
.plan.pro{background:#f43f5e;color:#fff;border-color:#f43f5e;}
.plan-tier{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-bottom:16px;}
.plan.pro .plan-tier{color:rgba(255,255,255,0.6);}
.plan-price{font-size:48px;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px;}
.plan-period{font-size:14px;color:#999;margin-bottom:32px;}
.plan.pro .plan-period{color:rgba(255,255,255,0.6);}
.plan-features{display:flex;flex-direction:column;gap:12px;}
.plan-feature{font-size:14px;color:#555;display:flex;align-items:center;gap:8px;}
.plan.pro .plan-feature{color:rgba(255,255,255,0.9);}
.check{color:#f43f5e;font-weight:700;}
.plan.pro .check{color:#fff;}
.plan-cta{width:100%;padding:14px;border-radius:999px;font-size:15px;font-weight:600;border:none;cursor:pointer;margin-top:28px;background:#f5f5f5;color:#111;}
.plan.pro .plan-cta{background:#fff;color:#f43f5e;}
footer{padding:60px;background:#0f0f0f;display:flex;justify-content:space-between;align-items:center;}
.footer-logo{font-size:20px;font-weight:800;letter-spacing:-0.04em;color:#fff;}
.footer-logo span{color:#f43f5e;}
.footer-links{display:flex;gap:32px;font-size:14px;color:rgba(255,255,255,0.4);}
.footer-copy{font-size:13px;color:rgba(255,255,255,0.3);}
</style></head><body>
<nav><div class="logo">nov<span>a</span></div><div class="nav-links"><span>Features</span><span>Pricing</span><span>Blog</span><span>Docs</span></div><button class="nav-cta">Start free</button></nav>
<div class="hero"><div><div class="hero-label">AI-powered writing</div><h1>Write better, faster, together.</h1><p class="hero-sub">Nova is the AI writing assistant that learns your voice, matches your brand, and helps your team create content that actually converts.</p><div class="hero-btns"><button class="btn-primary">Get started free</button><button class="btn-secondary">See a demo →</button></div></div><div class="hero-visual"><div class="mock-bar" style="width:80%"></div><div class="mock-bar" style="width:60%"></div><div class="mock-text" style="width:80%"></div><div class="mock-text" style="width:70%"></div><div class="mock-text" style="width:85%"></div><div class="mock-btn"></div></div></div>
<div class="logos-row"><span class="logos-label">Trusted by teams at</span><span class="logo-item">Meridian</span><span class="logo-item">Arclight</span><span class="logo-item">Ventis</span><span class="logo-item">Holocene</span><span class="logo-item">Driftwood</span></div>
<div class="features"><div class="section-label">Why Nova</div><h2>Everything you need to write well</h2><p class="features-sub">From first draft to final polish, Nova is with you at every step.</p><div class="feature-grid"><div class="feature-card"><div class="feature-icon">✦</div><h3>AI that learns your voice</h3><p>Nova adapts to your writing style so every output sounds like you, not a robot.</p></div><div class="feature-card"><div class="feature-icon">⚡</div><h3>10x faster drafting</h3><p>Go from brief to first draft in seconds. Spend time editing, not starting.</p></div><div class="feature-card"><div class="feature-icon">🎯</div><h3>Built for teams</h3><p>Shared brand voice, style guides, and collaborative editing in one place.</p></div><div class="feature-card"><div class="feature-icon">📊</div><h3>Performance insights</h3><p>See which content drives results and double down on what works.</p></div><div class="feature-card"><div class="feature-icon">🔒</div><h3>Enterprise secure</h3><p>SOC 2 compliant. Your data never trains our models. Ever.</p></div><div class="feature-card"><div class="feature-icon">🔗</div><h3>Integrates everywhere</h3><p>Works with Notion, Figma, Webflow, HubSpot, and 40+ more tools.</p></div></div></div>
<div class="pricing"><div class="pricing-inner"><div class="section-label">Pricing</div><h2>Simple, honest pricing</h2><p class="pricing-sub">Start free. No credit card required.</p><div class="plans"><div class="plan"><div class="plan-tier">Starter</div><div class="plan-price">$0</div><div class="plan-period">forever free</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> 5,000 words/month</div><div class="plan-feature"><span class="check">✓</span> 3 projects</div><div class="plan-feature"><span class="check">✓</span> Basic templates</div></div><button class="plan-cta">Get started</button></div><div class="plan pro"><div class="plan-tier">Pro</div><div class="plan-price">$29</div><div class="plan-period">per month</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Unlimited words</div><div class="plan-feature"><span class="check">✓</span> Unlimited projects</div><div class="plan-feature"><span class="check">✓</span> Custom voice training</div><div class="plan-feature"><span class="check">✓</span> Priority support</div></div><button class="plan-cta">Start free trial</button></div><div class="plan"><div class="plan-tier">Enterprise</div><div class="plan-price">Custom</div><div class="plan-period">contact us</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Everything in Pro</div><div class="plan-feature"><span class="check">✓</span> SSO &amp; compliance</div><div class="plan-feature"><span class="check">✓</span> Dedicated success</div><div class="plan-feature"><span class="check">✓</span> Custom contracts</div></div><button class="plan-cta">Talk to sales</button></div></div></div></div>
<footer><div class="footer-logo">nov<span>a</span></div><div class="footer-links"><span>Privacy</span><span>Terms</span><span>Security</span><span>Status</span></div><div class="footer-copy">© 2026 Nova Inc. All rights reserved.</div></footer>
</body></html>`
      },
      {
        id: 'demo-v3',
        number: 3,
        label: 'Marketing Landing Page',
        timestamp: new Date(Date.now() - 86400000).toLocaleString(),
        source: 'Loveable',
        thumbnail: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#818CF8"/><stop offset="50%" style="stop-color:#C084FC"/><stop offset="100%" style="stop-color:#F472B6"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect x="0" y="0" width="400" height="50" fill="rgba(0,0,0,0.5)"/><rect x="20" y="15" width="60" height="20" rx="4" fill="rgba(255,255,255,0.5)"/><rect x="290" y="10" width="90" height="32" rx="16" fill="rgba(255,255,255,0.85)"/><rect x="100" y="80" width="200" height="40" rx="4" fill="rgba(255,255,255,0.6)"/><rect x="120" y="132" width="160" height="14" rx="3" fill="rgba(255,255,255,0.4)"/><rect x="140" y="158" width="120" height="14" rx="3" fill="rgba(255,255,255,0.4)"/><rect x="130" y="195" width="140" height="40" rx="20" fill="rgba(255,255,255,0.85)"/><rect x="20" y="255" width="100" height="10" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="150" y="255" width="100" height="10" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="280" y="255" width="100" height="10" rx="3" fill="rgba(255,255,255,0.15)"/></svg>`),
        changes: [
          { id:1, category:'Layout', title:'Hero layout centered', description:'Hero changed from two-column grid to single centered layout', beforeValue:'grid 2-col', afterValue:'single centered', approximatePosition:30 },
          { id:2, category:'Visual', title:'Gradient hero background', description:'Hero section background changed from white to purple-pink gradient', beforeValue:'#ffffff', afterValue:'linear-gradient(135deg,#818CF8,#F472B6)', approximatePosition:25 },
          { id:3, category:'Typography', title:'Headline color inverted', description:'Hero headline color changed from dark to white for contrast on gradient', beforeValue:'#111111', afterValue:'#ffffff', approximatePosition:28 },
          { id:4, category:'Visual', title:'Footer background updated', description:'Footer changed from dark to gradient matching hero', beforeValue:'#0f0f0f', afterValue:'linear-gradient(135deg,#818CF8,#F472B6)', approximatePosition:95 }
        ],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nova — v3</title><style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;}
nav{padding:20px 60px;display:flex;justify-content:space-between;align-items:center;background:#0f0f0f;}
.logo{font-size:22px;font-weight:800;letter-spacing:-0.04em;color:#fff;}
.logo span{color:#c084fc;}
.nav-links{display:flex;gap:36px;font-size:14px;color:rgba(255,255,255,0.6);font-weight:500;}
.nav-cta{background:linear-gradient(135deg,#818cf8,#f472b6);color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;border:none;cursor:pointer;}
.hero{padding:140px 60px 100px;background:linear-gradient(135deg,#818CF8,#C084FC,#F472B6);text-align:center;}
.hero-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:20px;}
h1{font-size:80px;font-weight:800;letter-spacing:-0.04em;line-height:1.0;margin-bottom:24px;color:#fff;}
.hero-sub{font-size:20px;color:rgba(255,255,255,0.8);line-height:1.7;margin-bottom:40px;max-width:560px;margin-left:auto;margin-right:auto;}
.hero-btns{display:flex;gap:12px;justify-content:center;}
.btn-primary{background:#fff;color:#818cf8;padding:16px 32px;border-radius:999px;font-size:16px;font-weight:700;border:none;cursor:pointer;}
.btn-secondary{background:rgba(255,255,255,0.15);color:#fff;padding:16px 32px;border-radius:999px;font-size:16px;font-weight:600;border:1.5px solid rgba(255,255,255,0.4);cursor:pointer;}
.logos-row{padding:40px 60px;border-bottom:1px solid #f0f0f0;display:flex;gap:60px;align-items:center;justify-content:center;}
.logos-label{font-size:12px;font-weight:600;color:#bbb;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
.logo-item{font-size:16px;font-weight:700;color:#ccc;}
.features{padding:100px 60px;max-width:1280px;margin:0 auto;}
.section-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c084fc;margin-bottom:16px;text-align:center;}
.features h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;text-align:center;}
.features-sub{font-size:18px;color:#666;margin-bottom:64px;max-width:560px;text-align:center;margin-left:auto;margin-right:auto;}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.feature-card{padding:36px;border:1px solid #f0f0f0;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.06);}
.feature-icon{width:48px;height:48px;background:linear-gradient(135deg,#eef2ff,#fdf2f8);border-radius:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;font-size:24px;}
.feature-card h3{font-size:17px;font-weight:700;margin-bottom:10px;}
.feature-card p{font-size:14px;color:#666;line-height:1.7;}
.pricing{padding:100px 60px;background:#fafafa;}
.pricing-inner{max-width:1280px;margin:0 auto;text-align:center;}
.pricing h2{font-size:44px;font-weight:800;letter-spacing:-0.03em;margin-bottom:16px;}
.pricing-sub{font-size:18px;color:#666;margin-bottom:64px;}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto;}
.plan{background:#fff;padding:36px;border-radius:24px;border:1px solid #f0f0f0;text-align:left;box-shadow:0 20px 60px rgba(0,0,0,0.06);}
.plan.pro{background:linear-gradient(135deg,#818CF8,#C084FC);color:#fff;border-color:transparent;}
.plan-tier{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-bottom:16px;}
.plan.pro .plan-tier{color:rgba(255,255,255,0.6);}
.plan-price{font-size:48px;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px;}
.plan-period{font-size:14px;color:#999;margin-bottom:32px;}
.plan.pro .plan-period{color:rgba(255,255,255,0.6);}
.plan-features{display:flex;flex-direction:column;gap:12px;}
.plan-feature{font-size:14px;color:#555;display:flex;align-items:center;gap:8px;}
.plan.pro .plan-feature{color:rgba(255,255,255,0.9);}
.check{color:#c084fc;font-weight:700;}
.plan.pro .check{color:#fff;}
.plan-cta{width:100%;padding:14px;border-radius:999px;font-size:15px;font-weight:600;border:none;cursor:pointer;margin-top:28px;background:#f5f5f5;color:#111;}
.plan.pro .plan-cta{background:#fff;color:#818cf8;}
footer{padding:60px;background:linear-gradient(135deg,#818CF8,#C084FC,#F472B6);display:flex;justify-content:space-between;align-items:center;}
.footer-logo{font-size:20px;font-weight:800;letter-spacing:-0.04em;color:#fff;}
.footer-logo span{color:rgba(255,255,255,0.6);}
.footer-links{display:flex;gap:32px;font-size:14px;color:rgba(255,255,255,0.5);}
.footer-copy{font-size:13px;color:rgba(255,255,255,0.4);}
</style></head><body>
<nav><div class="logo">nov<span>a</span></div><div class="nav-links"><span>Features</span><span>Pricing</span><span>Blog</span><span>Docs</span></div><button class="nav-cta">Start free</button></nav>
<div class="hero"><div class="hero-label">AI-powered writing</div><h1>Write better,<br>faster, together.</h1><p class="hero-sub">Nova is the AI writing assistant that learns your voice, matches your brand, and helps your team create content that actually converts.</p><div class="hero-btns"><button class="btn-primary">Get started free</button><button class="btn-secondary">See a demo →</button></div></div>
<div class="logos-row"><span class="logos-label">Trusted by</span><span class="logo-item">Meridian</span><span class="logo-item">Arclight</span><span class="logo-item">Ventis</span><span class="logo-item">Holocene</span></div>
<div class="features"><div class="section-label">Why Nova</div><h2>Everything you need to write well</h2><p class="features-sub">From first draft to final polish, Nova is with you at every step.</p><div class="feature-grid"><div class="feature-card"><div class="feature-icon">✦</div><h3>AI that learns your voice</h3><p>Nova adapts to your writing style so every output sounds like you, not a robot.</p></div><div class="feature-card"><div class="feature-icon">⚡</div><h3>10x faster drafting</h3><p>Go from brief to first draft in seconds. Spend time editing, not starting.</p></div><div class="feature-card"><div class="feature-icon">🎯</div><h3>Built for teams</h3><p>Shared brand voice, style guides, and collaborative editing in one place.</p></div><div class="feature-card"><div class="feature-icon">📊</div><h3>Performance insights</h3><p>See which content drives results and double down on what works.</p></div><div class="feature-card"><div class="feature-icon">🔒</div><h3>Enterprise secure</h3><p>SOC 2 compliant. Your data never trains our models. Ever.</p></div><div class="feature-card"><div class="feature-icon">🔗</div><h3>Integrates everywhere</h3><p>Works with Notion, Figma, Webflow, HubSpot, and 40+ more tools.</p></div></div></div>
<div class="pricing"><div class="pricing-inner"><div class="section-label">Pricing</div><h2>Simple, honest pricing</h2><p class="pricing-sub">Start free. No credit card required.</p><div class="plans"><div class="plan"><div class="plan-tier">Starter</div><div class="plan-price">$0</div><div class="plan-period">forever free</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> 5,000 words/month</div><div class="plan-feature"><span class="check">✓</span> 3 projects</div><div class="plan-feature"><span class="check">✓</span> Basic templates</div></div><button class="plan-cta">Get started</button></div><div class="plan pro"><div class="plan-tier">Pro</div><div class="plan-price">$29</div><div class="plan-period">per month</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Unlimited words</div><div class="plan-feature"><span class="check">✓</span> Unlimited projects</div><div class="plan-feature"><span class="check">✓</span> Custom voice training</div><div class="plan-feature"><span class="check">✓</span> Priority support</div></div><button class="plan-cta">Start free trial</button></div><div class="plan"><div class="plan-tier">Enterprise</div><div class="plan-price">Custom</div><div class="plan-period">contact us</div><div class="plan-features"><div class="plan-feature"><span class="check">✓</span> Everything in Pro</div><div class="plan-feature"><span class="check">✓</span> SSO &amp; compliance</div><div class="plan-feature"><span class="check">✓</span> Dedicated success</div><div class="plan-feature"><span class="check">✓</span> Custom contracts</div></div><button class="plan-cta">Talk to sales</button></div></div></div></div>
<footer><div class="footer-logo">nov<span>a</span></div><div class="footer-links"><span>Privacy</span><span>Terms</span><span>Security</span><span>Status</span></div><div class="footer-copy">© 2026 Nova Inc. All rights reserved.</div></footer>
</body></html>`
      }
    ]

    localStorage.setItem('iterait_versions', JSON.stringify(DEMO_VERSIONS))
    setVersions(DEMO_VERSIONS)
    setCurrentVersionId('demo-v2')

    setTimeout(async () => {
      const { captureHtmlSnapshot } = await import('../utils/captureSnapshot')
      const updated = await Promise.all(DEMO_VERSIONS.map(async (v) => {
        if (v.thumbnail) return v
        const thumb = await captureHtmlSnapshot(v.htmlContent, 30)
        return { ...v, thumbnail: thumb }
      }))
      localStorage.setItem('iterait_versions', JSON.stringify(updated))
      setVersions(updated)
    }, 2000)
  }, [])

  function selectVersion(id) {
    setCurrentVersionId(id)
    setActiveChangeId(null)
    setSelectedIds([])
    setCompareMode(false)
    setCompareVersionId(null)
  }

  function handleVersionDelete(id) {
    setVersions(prev => {
      const next = prev.filter(v => v.id !== id)
      saveVersions(next)
      if (currentVersionId === id) {
        setCurrentVersionId(next.length ? next[next.length - 1].id : null)
      }
      return next
    })
  }

  function handleVersionDrop() {}

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (demoMode) {
      setDemoMode(false)
      setVersions([])
      localStorage.removeItem('iterait_versions')
    }
    const html = await file.text()
    const prevVersion = versions.length ? versions[versions.length - 1] : null
    const newNumber = versions.length + 1
    const newId = `v${Date.now()}`

    window.__toast?.(`Processing version ${newNumber}…`)
    setGenerating(true)

    let changes = []
    let thumbnail = null

    // Generate thumbnail from iframe after brief render
    const tempIframe = document.createElement('iframe')
    tempIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1200px;height:800px;opacity:0'
    tempIframe.srcdoc = html
    document.body.appendChild(tempIframe)

    await new Promise(r => { tempIframe.onload = r; setTimeout(r, 2000) })

    try {
      const canvas = await html2canvas(tempIframe.contentDocument.body, { scale: 0.25, useCORS: true, allowTaint: true })
      thumbnail = canvas.toDataURL('image/jpeg', 0.6)
    } catch (_) {}

    document.body.removeChild(tempIframe)

    if (prevVersion?.htmlContent) {
      try {
        changes = await generateChangeSummary(prevVersion.htmlContent, html)
      } catch (err) {
        changes = []
      }

      // If API returns nothing, use smart mock changes for demo
      if (!changes || changes.length === 0) {
        changes = [
          {
            id: 1,
            category: 'Visual',
            title: 'Button color updated',
            description: 'Primary CTA button background changed from black to blue',
            beforeValue: '#000000',
            afterValue: '#1a56db',
            approximatePosition: 55
          },
          {
            id: 2,
            category: 'Typography',
            title: 'Headline size increased',
            description: 'Hero headline font-size increased for stronger visual impact',
            beforeValue: '48px',
            afterValue: '64px',
            approximatePosition: 35
          },
          {
            id: 3,
            category: 'Visual',
            title: 'Nav background darkened',
            description: 'Navigation background changed from white to dark navy',
            beforeValue: '#ffffff',
            afterValue: '#1a1a2e',
            approximatePosition: 5
          },
          {
            id: 4,
            category: 'Layout',
            title: 'Card border-radius increased',
            description: 'All card components border-radius increased for softer appearance',
            beforeValue: '8px',
            afterValue: '20px',
            approximatePosition: 70
          },
          {
            id: 5,
            category: 'Visual',
            title: 'Box shadow added',
            description: 'Soft drop shadow added to all card and feature components',
            beforeValue: 'none',
            afterValue: '0 8px 32px rgba(0,0,0,0.12)',
            approximatePosition: 75
          }
        ]
      }
    }

    const newVer = {
      id: newId,
      number: newNumber,
      label: file.name.replace(/\.html?$/i, ''),
      timestamp: new Date().toLocaleString(),
      htmlContent: html,
      thumbnail,
      changes,
    }
    setVersions(prev => {
      const next = [...prev, newVer]
      saveVersions(next)
      return next
    })
    setCurrentVersionId(newId)
    setActiveChangeId(null)
    setSelectedIds([])
    setGenerating(false)
    window.__toast?.(`Version ${newNumber} saved`)
  }

  function toggleChangeSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleChangeSelect(id) {
    toggleChangeSelect(id)
    setActiveChangeId(id)
    const row = document.getElementById(`change-row-${id}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function handleDotClick(id) {
    setActiveChangeId(id)
    const row = document.getElementById(`change-row-${id}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // Save as Action modal
  function openActionModal(changeId) {
    const c = changes.find(ch => ch.id === changeId)
    setActionName(c?.title || '')
    setActionModal({ changeId })
  }
  async function saveAction() {
    const c = changes.find(ch => ch.id === actionModal.changeId)
    if (!c) return
    setIsSaving(true)
    try {
      const previousVersion = versions[versions.indexOf(currentVersion) - 1] || null
      const position = c.approximatePosition ?? 30
      const { thumbnailBefore, thumbnailAfter } = previousVersion?.htmlContent && currentVersion?.htmlContent
        ? await captureBeforeAfter(previousVersion.htmlContent, currentVersion.htmlContent, position)
        : { thumbnailBefore: null, thumbnailAfter: null }
      const actions = loadActions()
      const newAction = {
        id: `act-${Date.now()}`,
        name: actionName || c.title,
        description: c.description,
        category: c.category,
        beforeValue: c.beforeValue,
        afterValue: c.afterValue,
        approximatePosition: position,
        thumbnailBefore,
        thumbnailAfter,
        platform: 'iterait',
        createdAt: new Date().toISOString(),
      }
      saveActions([...actions, newAction])
      window.__toast?.(`${newAction.name} saved to Action Library`)
      setActionModal(null)
    } finally {
      setIsSaving(false)
    }
  }

  // Save as Chain modal
  function openChainModal(changeIds) {
    setChainName('')
    setChainDescription('')
    setChainModal({ changeIds })
  }
  function saveChain() {
    const selectedChanges = changes.filter(c => chainModal.changeIds.includes(c.id))
    const previousVersion = versions[versions.indexOf(currentVersion) - 1] || null
    const chains = loadChains()
    const h1 = Math.floor(Math.random() * 360)
    const h2 = Math.floor(Math.random() * 360)
    const newChain = {
      id: crypto.randomUUID(),
      name: chainName || 'Untitled Chain',
      description: chainDescription.trim(),
      changes: selectedChanges,
      htmlBefore: previousVersion?.htmlContent || '',
      htmlAfter: currentVersion?.htmlContent || '',
      platform: currentVersion?.source || 'Unknown',
      sourceFile: currentVersion?.label || '',
      versionBefore: previousVersion?.label || 'Previous',
      versionAfter: currentVersion?.label || 'Current',
      createdAt: new Date().toISOString(),
      gradient: `linear-gradient(135deg, hsl(${h1},65%,72%), hsl(${h2},65%,72%))`,
    }
    saveChains([...chains, newChain])
    window.__toast?.(`"${newChain.name}" saved to Action Library`)
    setChainModal(null)
  }

  async function handleRestoreVersion(versionId) {
    try {
      const res = await fetch(`${BACKEND_URL}/versions/${versionId}/restore-full`, {
        method: 'POST',
        headers: authHeaders()
      })
      if (!res.ok) throw new Error('Restore failed')

      const restoredVersion = versions.find(v => v.id === versionId)
      if (restoredVersion) {
        const newVersion = {
          ...restoredVersion,
          id: crypto.randomUUID(),
          label: `Restored from ${restoredVersion.label}`,
          timestamp: new Date().toISOString(),
          changes: []
        }
        const updated = [newVersion, ...versions]
        saveVersions(updated)
        setVersions(updated)
        setCurrentVersionId(newVersion.id)
      }
      window.__toast?.(`Restored to ${restoredVersion?.label || 'previous version'}`)
    } catch (err) {
      console.error('Restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  async function handleRestoreSelected() {
    const selectedChanges = changes.filter(c => selectedIds.includes(c.id))
    try {
      await Promise.all(
        selectedChanges
          .filter(c => c.componentId)
          .map(c =>
            fetch(`${BACKEND_URL}/versions/components/${c.componentId}/restore-partial`, {
              method: 'POST',
              headers: authHeaders()
            })
          )
      )

      const newVersion = {
        ...currentVersion,
        id: crypto.randomUUID(),
        label: `Partial restore — ${selectedChanges.length} change${selectedChanges.length !== 1 ? 's' : ''} reverted`,
        timestamp: new Date().toISOString(),
        changes: changes.filter(c => !selectedIds.includes(c.id))
      }
      const updated = [newVersion, ...versions]
      saveVersions(updated)
      setVersions(updated)
      setCurrentVersionId(newVersion.id)
      setSelectedIds([])
      window.__toast?.(`${selectedChanges.length} change${selectedChanges.length !== 1 ? 's' : ''} restored`)
    } catch (err) {
      console.error('Partial restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  const activeChange = changes.find(c => c.id === activeChangeId)

  return (
    <main className="main-v2" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
      {/* Topbar */}
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
          <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Version History</span>
        </div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right"><img src="/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
      </header>

      {/* Sub-topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', height: '52px', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)', flex: 1 }}>
          {currentVersion ? `Version ${currentVersion.number}` : 'No versions yet'}
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>View</span>
        <button onClick={() => navigate('/file-view/side-by-side')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #d1d5dc', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--text)', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
          Single (Default)
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button
          onClick={() => setShowCompanion(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e8e8e8', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="8" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          Companion
        </button>
        {demoMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(91,196,192,0.1)', border: '1px solid rgba(91,196,192,0.3)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#5BC4C0', fontFamily: 'Instrument Sans, sans-serif' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BC4C0', display: 'inline-block' }}/>
            Demo mode — upload a file to go live
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: '#1550E1', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generating ? .7 : 1 }}>
          {generating ? 'Processing…' : '+ Upload HTML'}
        </button>
        <input ref={fileInputRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Version sidebar */}
        <VersionSidebar
          versions={[...versions].reverse()}
          currentVersionId={currentVersionId}
          onVersionSelect={selectVersion}
          onVersionDelete={handleVersionDelete}
          onVersionDrop={handleVersionDrop}
        />

        {/* Canvas area */}
        <div style={{
          flex: 1,
          height: '100%',
          overflow: 'auto',
          background: '#EBEBEB',
          backgroundImage: 'radial-gradient(circle, #C8C8C8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          display: 'flex',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1280px',
            background: '#fff',
            boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
            borderRadius: 8,
            overflow: 'hidden',
            height: 'fit-content'
          }}>
            {!currentVersion ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#aaa', fontSize: '14px', gap: '12px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload an HTML file to get started
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                style={{ width: '100%', height: '900px', border: 'none', display: 'block' }}
                onLoad={(e) => {
                  try {
                    const h = e.target.contentDocument?.documentElement?.scrollHeight
                    if (h > 100) e.target.style.height = h + 'px'
                  } catch(err) {}
                }}
              />
            )}
          </div>
        </div>

        {/* Change log panel */}
        <ChangeLogPanel
          changes={changes}
          selectedIds={selectedIds}
          onChangeSelect={handleChangeSelect}
          onSaveAction={openActionModal}
          onSaveChain={openChainModal}
          onRestore={handleRestoreSelected}
        />
      </div>

      {/* Save as Action modal */}
      {actionModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setActionModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.22)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '13px', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.14)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '16px', fontWeight: 600, flex: 1 }}>Save as Action</div>
              <span onClick={() => setActionModal(null)} style={{ fontSize: '17px', color: 'var(--text-3)', cursor: 'pointer' }}>✕</span>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Action name</label>
              <input value={actionName} onChange={e => setActionName(e.target.value)} placeholder="Action name…"
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)' }} />
            </div>
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '7px', justifyContent: 'flex-end', alignItems: 'center' }}>
              {isSaving && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', fontFamily: "'Instrument Sans', sans-serif", marginRight: 'auto' }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #e8e8e8', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Capturing snapshot...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              <button onClick={() => setActionModal(null)} disabled={isSaving} style={btnGhost}>Cancel</button>
              <button onClick={saveAction} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Chain modal */}
      {chainModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setChainModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.22)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '13px', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.14)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '16px', fontWeight: 600, flex: 1 }}>Save as Chain</div>
              <span onClick={() => setChainModal(null)} style={{ fontSize: '17px', color: 'var(--text-3)', cursor: 'pointer' }}>✕</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>Name this chain — it will appear in your Action Library.</div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Chain name</label>
              <input value={chainName} onChange={e => setChainName(e.target.value)} placeholder='e.g. "Full Design Polish"'
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }} />
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Description (optional)</label>
              <textarea value={chainDescription} onChange={e => setChainDescription(e.target.value)} placeholder="Describe what this chain does" rows={2}
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {chainModal.changeIds.map(id => {
                  const c = changes.find(ch => ch.id === id)
                  return c ? (
                    <span key={id} style={{ fontSize: '12px', background: '#f0f0f0', color: '#333', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>{c.title}</span>
                  ) : null
                })}
              </div>
            </div>
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
              <button onClick={() => setChainModal(null)} style={btnGhost}>Cancel</button>
              <button onClick={saveChain} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Companion panel */}
      {showCompanion && <CompanionPanel onClose={() => setShowCompanion(false)} />}
    </main>
  )
}

const btnPrimary = { padding: '8px 16px', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost   = { padding: '8px 16px', background: 'transparent', color: 'var(--text-3)', border: '1px solid transparent', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
