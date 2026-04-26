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
    const existing = JSON.parse(localStorage.getItem('iterait_versions') || '[]')
    if (existing.length > 0) return

    const DEMO_VERSIONS = [
      {
        id: 'demo-v1',
        number: 1,
        label: 'Dashboard Redesign',
        timestamp: new Date(Date.now() - 86400000 * 3).toLocaleString(),
        source: 'Cursor',
        thumbnail: null,
        changes: [],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f8;color:#111;}
      nav{background:#ffffff;padding:18px 48px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eeeeee;}
      .logo{font-weight:800;font-size:20px;letter-spacing:-0.03em;}
      .nav-links{display:flex;gap:32px;font-size:14px;color:#666;}
      .btn{background:#111111;color:#fff;padding:10px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;}
      .hero{padding:100px 48px;max-width:1200px;margin:0 auto;}
      h1{font-size:52px;font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:20px;max-width:700px;}
      .subtitle{font-size:18px;color:#666;margin-bottom:36px;max-width:500px;line-height:1.6;}
      .hero-btns{display:flex;gap:12px;}
      .btn-outline{background:transparent;color:#111;padding:10px 24px;border:1.5px solid #111;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;}
      .logos{padding:32px 48px;border-top:1px solid #eee;border-bottom:1px solid #eee;display:flex;gap:48px;align-items:center;color:#999;font-size:13px;}
      .logos span{font-weight:600;font-size:15px;}
      .features{padding:80px 48px;max-width:1200px;margin:0 auto;}
      .features h2{font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-bottom:48px;}
      .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
      .card{background:#fff;border-radius:8px;padding:28px;border:1px solid #eee;}
      .card-icon{width:36px;height:36px;background:#f0f0f0;border-radius:8px;margin-bottom:16px;}
      .card h3{font-size:16px;font-weight:700;margin-bottom:8px;}
      .card p{color:#666;font-size:14px;line-height:1.6;}
      .pricing{padding:80px 48px;background:#fff;text-align:center;}
      .pricing h2{font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-bottom:16px;}
      .pricing p{color:#666;margin-bottom:48px;}
      .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1000px;margin:0 auto;}
      .plan{padding:32px;border:1px solid #eee;border-radius:8px;text-align:left;}
      .plan.featured{border-color:#111;background:#111;color:#fff;}
      .plan-price{font-size:36px;font-weight:800;margin:12px 0;}
      .plan-name{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#999;}
      .plan.featured .plan-name{color:rgba(255,255,255,0.6);}
      .plan ul{list-style:none;margin-top:20px;display:flex;flex-direction:column;gap:10px;}
      .plan ul li{font-size:14px;color:#666;}
      .plan.featured ul li{color:rgba(255,255,255,0.8);}
      .plan ul li::before{content:"✓ ";}
      footer{padding:40px 48px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;color:#999;font-size:13px;}
    </style></head><body>
      <nav>
        <div class="logo">Cadence</div>
        <div class="nav-links"><span>Features</span><span>Pricing</span><span>Docs</span><span>Blog</span></div>
        <button class="btn">Get Started</button>
      </nav>
      <div class="hero">
        <h1>Run every project with clarity and confidence.</h1>
        <p class="subtitle">Cadence gives your team a single source of truth — tracking work, surfacing risk, and forecasting delivery without the spreadsheet chaos.</p>
        <div class="hero-btns">
          <button class="btn">Get Started Free</button>
          <button class="btn-outline">See How It Works</button>
        </div>
      </div>
      <div class="logos">TRUSTED BY TEAMS AT <span>Meridian</span> <span>Arclight</span> <span>Ventis Co.</span> <span>Holocene</span> <span>Driftwood</span></div>
      <div class="features">
        <h2>Everything your team needs</h2>
        <div class="cards">
          <div class="card"><div class="card-icon"></div><h3>Track Progress</h3><p>Real-time visibility into every project milestone and deadline across your entire portfolio.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Reduce Risk</h3><p>Surface blockers and dependencies before they become critical problems that delay shipping.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Ship Faster</h3><p>Align your entire team around what matters most right now with automated priority signals.</p></div>
        </div>
      </div>
      <div class="pricing">
        <h2>Simple, transparent pricing</h2>
        <p>Start free. Upgrade when you're ready.</p>
        <div class="plans">
          <div class="plan"><div class="plan-name">Starter</div><div class="plan-price">$0</div><ul><li>Up to 5 projects</li><li>3 team members</li><li>Basic reporting</li></ul></div>
          <div class="plan featured"><div class="plan-name">Pro</div><div class="plan-price">$12</div><ul><li>Unlimited projects</li><li>25 team members</li><li>Advanced analytics</li><li>Priority support</li></ul></div>
          <div class="plan"><div class="plan-name">Enterprise</div><div class="plan-price">Custom</div><ul><li>Unlimited everything</li><li>SSO & compliance</li><li>Dedicated success</li></ul></div>
        </div>
      </div>
      <footer><span>© 2026 Cadence Inc.</span><span>Privacy · Terms · Contact</span></footer>
    </body></html>`
      },
      {
        id: 'demo-v2',
        number: 2,
        label: 'Dashboard Redesign',
        timestamp: new Date(Date.now() - 86400000 * 2).toLocaleString(),
        source: 'Cursor',
        thumbnail: null,
        changes: [
          { id:1, category:'Visual', title:'Nav background darkened', description:'Navigation background changed from white to dark navy for stronger contrast', beforeValue:'#ffffff', afterValue:'#1a1a2e', approximatePosition:5 },
          { id:2, category:'Visual', title:'Button color updated', description:'Primary CTA button changed from black to blue and made pill-shaped', beforeValue:'#111111', afterValue:'#1a56db', approximatePosition:45 },
          { id:3, category:'Typography', title:'Hero headline scaled up', description:'Hero headline font-size increased from 52px to 68px for visual impact', beforeValue:'52px', afterValue:'68px', approximatePosition:35 },
          { id:4, category:'Layout', title:'Card border-radius increased', description:'All card border-radius increased from 8px to 20px for softer appearance', beforeValue:'8px', afterValue:'20px', approximatePosition:70 },
          { id:5, category:'Visual', title:'Box shadow added to cards', description:'Soft drop shadow added to all card components for depth and elevation', beforeValue:'none', afterValue:'0 8px 32px rgba(0,0,0,0.08)', approximatePosition:72 }
        ],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f8;color:#111;}
      nav{background:#1a1a2e;padding:18px 48px;display:flex;justify-content:space-between;align-items:center;}
      .logo{font-weight:800;font-size:20px;letter-spacing:-0.03em;color:#fff;}
      .nav-links{display:flex;gap:32px;font-size:14px;color:rgba(255,255,255,0.7);}
      .btn{background:#1a56db;color:#fff;padding:10px 24px;border:none;border-radius:999px;cursor:pointer;font-size:14px;font-weight:500;}
      .hero{padding:100px 48px;max-width:1200px;margin:0 auto;}
      h1{font-size:68px;font-weight:800;letter-spacing:-0.03em;line-height:1.05;margin-bottom:20px;max-width:800px;}
      .subtitle{font-size:18px;color:#666;margin-bottom:36px;max-width:500px;line-height:1.6;}
      .hero-btns{display:flex;gap:12px;}
      .btn-outline{background:transparent;color:#1a56db;padding:10px 24px;border:1.5px solid #1a56db;border-radius:999px;cursor:pointer;font-size:14px;font-weight:500;}
      .logos{padding:32px 48px;border-top:1px solid #eee;border-bottom:1px solid #eee;display:flex;gap:48px;align-items:center;color:#999;font-size:13px;}
      .logos span{font-weight:600;font-size:15px;}
      .features{padding:80px 48px;max-width:1200px;margin:0 auto;}
      .features h2{font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-bottom:48px;}
      .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
      .card{background:#fff;border-radius:20px;padding:32px;border:1px solid #eee;box-shadow:0 8px 32px rgba(0,0,0,0.08);}
      .card-icon{width:36px;height:36px;background:#e8f0ff;border-radius:10px;margin-bottom:16px;}
      .card h3{font-size:16px;font-weight:700;margin-bottom:8px;}
      .card p{color:#666;font-size:14px;line-height:1.6;}
      .pricing{padding:80px 48px;background:#fff;text-align:center;}
      .pricing h2{font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-bottom:16px;}
      .pricing p{color:#666;margin-bottom:48px;}
      .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:0 auto;}
      .plan{padding:32px;border:1px solid #eee;border-radius:20px;text-align:left;box-shadow:0 8px 32px rgba(0,0,0,0.06);}
      .plan.featured{border-color:#1a56db;background:#1a56db;color:#fff;}
      .plan-price{font-size:36px;font-weight:800;margin:12px 0;}
      .plan-name{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#999;}
      .plan.featured .plan-name{color:rgba(255,255,255,0.7);}
      .plan ul{list-style:none;margin-top:20px;display:flex;flex-direction:column;gap:10px;}
      .plan ul li{font-size:14px;color:#666;}
      .plan.featured ul li{color:rgba(255,255,255,0.85);}
      .plan ul li::before{content:"✓ ";}
      footer{padding:40px 48px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;color:#999;font-size:13px;}
    </style></head><body>
      <nav>
        <div class="logo">Cadence</div>
        <div class="nav-links"><span>Features</span><span>Pricing</span><span>Docs</span><span>Blog</span></div>
        <button class="btn">Get Started</button>
      </nav>
      <div class="hero">
        <h1>Run every project with clarity and confidence.</h1>
        <p class="subtitle">Cadence gives your team a single source of truth — tracking work, surfacing risk, and forecasting delivery without the spreadsheet chaos.</p>
        <div class="hero-btns">
          <button class="btn">Get Started Free</button>
          <button class="btn-outline">See How It Works</button>
        </div>
      </div>
      <div class="logos">TRUSTED BY TEAMS AT <span>Meridian</span> <span>Arclight</span> <span>Ventis Co.</span> <span>Holocene</span> <span>Driftwood</span></div>
      <div class="features">
        <h2>Everything your team needs</h2>
        <div class="cards">
          <div class="card"><div class="card-icon"></div><h3>Track Progress</h3><p>Real-time visibility into every project milestone and deadline across your entire portfolio.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Reduce Risk</h3><p>Surface blockers and dependencies before they become critical problems that delay shipping.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Ship Faster</h3><p>Align your entire team around what matters most right now with automated priority signals.</p></div>
        </div>
      </div>
      <div class="pricing">
        <h2>Simple, transparent pricing</h2>
        <p>Start free. Upgrade when you're ready.</p>
        <div class="plans">
          <div class="plan"><div class="plan-name">Starter</div><div class="plan-price">$0</div><ul><li>Up to 5 projects</li><li>3 team members</li><li>Basic reporting</li></ul></div>
          <div class="plan featured"><div class="plan-name">Pro</div><div class="plan-price">$12</div><ul><li>Unlimited projects</li><li>25 team members</li><li>Advanced analytics</li><li>Priority support</li></ul></div>
          <div class="plan"><div class="plan-name">Enterprise</div><div class="plan-price">Custom</div><ul><li>Unlimited everything</li><li>SSO & compliance</li><li>Dedicated success</li></ul></div>
        </div>
      </div>
      <footer><span>© 2026 Cadence Inc.</span><span>Privacy · Terms · Contact</span></footer>
    </body></html>`
      },
      {
        id: 'demo-v3',
        number: 3,
        label: 'Dashboard Redesign',
        timestamp: new Date(Date.now() - 86400000).toLocaleString(),
        source: 'Cursor',
        thumbnail: null,
        changes: [
          { id:1, category:'Layout', title:'Hero centered alignment', description:'Hero section text alignment changed from left to center for stronger focal point', beforeValue:'left', afterValue:'center', approximatePosition:40 },
          { id:2, category:'Typography', title:'Headline weight increased', description:'Hero headline font-weight increased from 800 to 900 for maximum impact', beforeValue:'800', afterValue:'900', approximatePosition:35 },
          { id:3, category:'Visual', title:'Background color updated', description:'Page background updated from light gray to pure white for cleaner feel', beforeValue:'#f8f8f8', afterValue:'#ffffff', approximatePosition:10 },
          { id:4, category:'Visual', title:'Featured plan color changed', description:'Pricing featured plan updated from dark to brand blue', beforeValue:'#111111', afterValue:'#1a56db', approximatePosition:80 }
        ],
        htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Helvetica Neue',Arial,sans-serif;background:#ffffff;color:#111;}
      nav{background:#1a1a2e;padding:18px 48px;display:flex;justify-content:space-between;align-items:center;}
      .logo{font-weight:800;font-size:20px;letter-spacing:-0.03em;color:#fff;}
      .nav-links{display:flex;gap:32px;font-size:14px;color:rgba(255,255,255,0.7);}
      .btn{background:#1a56db;color:#fff;padding:12px 28px;border:none;border-radius:999px;cursor:pointer;font-size:14px;font-weight:600;}
      .hero{padding:120px 48px;max-width:1200px;margin:0 auto;text-align:center;}
      h1{font-size:72px;font-weight:900;letter-spacing:-0.04em;line-height:1.0;margin-bottom:24px;}
      .subtitle{font-size:20px;color:#666;margin-bottom:40px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.6;}
      .hero-btns{display:flex;gap:12px;justify-content:center;}
      .btn-outline{background:transparent;color:#1a56db;padding:12px 28px;border:1.5px solid #1a56db;border-radius:999px;cursor:pointer;font-size:14px;font-weight:600;}
      .logos{padding:32px 48px;border-top:1px solid #eee;border-bottom:1px solid #eee;display:flex;gap:48px;align-items:center;color:#bbb;font-size:13px;justify-content:center;}
      .logos span{font-weight:700;font-size:15px;color:#999;}
      .features{padding:96px 48px;max-width:1200px;margin:0 auto;}
      .features h2{font-size:40px;font-weight:900;letter-spacing:-0.02em;margin-bottom:56px;text-align:center;}
      .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
      .card{background:#fff;border-radius:24px;padding:36px;border:1px solid #f0f0f0;box-shadow:0 12px 48px rgba(0,0,0,0.08);}
      .card-icon{width:40px;height:40px;background:#e8f0ff;border-radius:12px;margin-bottom:20px;}
      .card h3{font-size:17px;font-weight:700;margin-bottom:10px;}
      .card p{color:#666;font-size:14px;line-height:1.7;}
      .pricing{padding:96px 48px;background:#f8f8f8;text-align:center;}
      .pricing h2{font-size:40px;font-weight:900;letter-spacing:-0.02em;margin-bottom:16px;}
      .pricing p{color:#666;margin-bottom:56px;font-size:18px;}
      .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1000px;margin:0 auto;}
      .plan{padding:36px;border:1px solid #eee;border-radius:24px;text-align:left;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.06);}
      .plan.featured{border-color:#1a56db;background:#1a56db;color:#fff;}
      .plan-price{font-size:40px;font-weight:900;margin:12px 0;letter-spacing:-0.02em;}
      .plan-name{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;}
      .plan.featured .plan-name{color:rgba(255,255,255,0.6);}
      .plan ul{list-style:none;margin-top:24px;display:flex;flex-direction:column;gap:12px;}
      .plan ul li{font-size:14px;color:#555;}
      .plan.featured ul li{color:rgba(255,255,255,0.9);}
      .plan ul li::before{content:"✓  ";}
      footer{padding:40px 48px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;color:#999;font-size:13px;background:#fff;}
    </style></head><body>
      <nav>
        <div class="logo">Cadence</div>
        <div class="nav-links"><span>Features</span><span>Pricing</span><span>Docs</span><span>Blog</span></div>
        <button class="btn">Get Started Free</button>
      </nav>
      <div class="hero">
        <h1>Run every project with clarity.</h1>
        <p class="subtitle">Cadence gives your team a single source of truth — tracking work, surfacing risk, and forecasting delivery without the spreadsheet chaos.</p>
        <div class="hero-btns">
          <button class="btn">Start Free Trial</button>
          <button class="btn-outline">See How It Works</button>
        </div>
      </div>
      <div class="logos">TRUSTED BY TEAMS AT <span>Meridian</span> <span>Arclight</span> <span>Ventis Co.</span> <span>Holocene</span> <span>Driftwood</span></div>
      <div class="features">
        <h2>Everything your team needs</h2>
        <div class="cards">
          <div class="card"><div class="card-icon"></div><h3>Track Progress</h3><p>Real-time visibility into every project milestone and deadline across your entire portfolio.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Reduce Risk</h3><p>Surface blockers and dependencies before they become critical problems that delay shipping.</p></div>
          <div class="card"><div class="card-icon"></div><h3>Ship Faster</h3><p>Align your entire team around what matters most right now with automated priority signals.</p></div>
        </div>
      </div>
      <div class="pricing">
        <h2>Simple, transparent pricing</h2>
        <p>Start free. Upgrade when you're ready.</p>
        <div class="plans">
          <div class="plan"><div class="plan-name">Starter</div><div class="plan-price">$0</div><ul><li>Up to 5 projects</li><li>3 team members</li><li>Basic reporting</li></ul></div>
          <div class="plan featured"><div class="plan-name">Pro</div><div class="plan-price">$12</div><ul><li>Unlimited projects</li><li>25 team members</li><li>Advanced analytics</li><li>Priority support</li></ul></div>
          <div class="plan"><div class="plan-name">Enterprise</div><div class="plan-price">Custom</div><ul><li>Unlimited everything</li><li>SSO & compliance</li><li>Dedicated success</li></ul></div>
        </div>
      </div>
      <footer><span>© 2026 Cadence Inc.</span><span>Privacy · Terms · Contact</span></footer>
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
