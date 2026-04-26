import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateActionPrompt } from '../utils/claudeApi'

const IMG = [
  'https://www.figma.com/api/mcp/asset/b980d44e-ed43-45a3-b081-90b789dfbbb4',
  'https://www.figma.com/api/mcp/asset/384cbdf3-8a9a-451d-906b-8755866a2562',
  'https://www.figma.com/api/mcp/asset/90b9ac27-3e84-49ff-aaa3-3ae58739a9c7',
  'https://www.figma.com/api/mcp/asset/6a0b4ec8-6722-47c2-9bd6-ecbfcc1f5c81',
  'https://www.figma.com/api/mcp/asset/bb358d8d-e36a-4191-8465-176c8a57afce',
  'https://www.figma.com/api/mcp/asset/67b6dcc3-396a-4164-8d28-2c14c982d846',
  'https://www.figma.com/api/mcp/asset/f7eb8fb7-0373-48ef-9251-fd86225e1606',
  'https://www.figma.com/api/mcp/asset/4e34e580-2f6f-4c9e-8f2a-facaf2ca43b2',
]

const GRAD_CSS = [
  'linear-gradient(135deg, #FF8C61 0%, #F5C2A2 45%, #C4B5F4 100%)',
  'linear-gradient(135deg, #81E6D9 0%, #93C5FD 50%, #F9A8D4 100%)',
  'linear-gradient(135deg, #FDE68A 0%, #FDBA74 50%, #FB7185 100%)',
  'linear-gradient(135deg, #C4B5F4 0%, #93C5FD 55%, #6EE7B7 100%)',
  'linear-gradient(135deg, #FDA4AF 0%, #FDBA74 50%, #FDE68A 100%)',
  'linear-gradient(135deg, #5EEAD4 0%, #A78BFA 50%, #FB7185 100%)',
  'linear-gradient(135deg, #C084FC 0%, #F472B6 55%, #FB923C 100%)',
  'linear-gradient(135deg, #86EFAC 0%, #34D399 50%, #67E8F9 100%)',
]

function thumbStyle(g) {
  return { backgroundImage: `url('${IMG[g]}'), ${GRAD_CSS[g]}`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

const PTAG = {
  cursor:   { label: 'Cursor',    bg: '#C8F0EA', fg: '#2A9D8F' },
  loveable: { label: 'Loveable',  bg: '#FFD6E7', fg: '#9D1A56' },
  claude:   { label: 'Claude',    bg: '#FFE4C2', fg: '#8A4A00' },
  figma:    { label: 'Figma Make',bg: '#E8D5FF', fg: '#5B1D9D' },
  stitch:   { label: 'Stitch',    bg: '#C8F5D8', fg: '#1A6640' },
}

const TC = { visual: '#6366f1', layout: '#10b981', color: '#f59e0b', typography: '#8b5cf6' }
const TI = { visual: '◈', layout: '⊞', color: '◉', typography: 'T' }

const INIT_ACTIONS = [
  { id:1, name:'Elevated Card System', date:'Apr 20', g:0, plat:'loveable', built:'cursor',
    types:['visual','layout'],
    desc:'Improves visual hierarchy by adding soft shadows, increasing spacing, and refining typography across card-based components.',
    changes:{ visual:['Adds soft shadow (Elevation Level 2)','Updates primary font scale (+1 step)','Improves color contrast for text'], layout:['Increases spacing system (8px → 12px)','Adds padding to cards and containers'], components:['Cards','Buttons','Section headers'] },
    compat:'Adapts spacing and shadow tokens to match your current platform. Minor adjustments may occur in typography scaling.',
    used:12, plats:3, last:'2 days ago', created:'Apr 20, 2026' },
  { id:2, name:'Typography Scale', date:'Apr 18', g:1, plat:'claude', built:'claude',
    types:['typography'],
    desc:'Applies a modular 1.25× type scale from a given base size, updating all heading and body sizes for consistent visual rhythm.',
    changes:{ visual:['Increases heading contrast','Tightens letter-spacing on headings'], layout:['Adjusts line-height system-wide (1.4 → 1.6)'], components:['h1–h6 headings','Body copy','Labels & captions'] },
    compat:'Font family mappings may vary. Claude will attempt to match your existing font stack before applying scale changes.',
    used:8, plats:4, last:'5 days ago', created:'Apr 18, 2026' },
  { id:3, name:'Colour Harmonize', date:'Apr 17', g:2, plat:'figma', built:'figma',
    types:['color'],
    desc:'Shifts the entire colour palette 8° cooler on the hue wheel and regenerates all tint/shade tokens for a cohesive system.',
    changes:{ visual:['Rotates hue +8° across all brand colors','Regenerates 50–900 shade scales'], layout:[], components:['Design tokens','Primary button','Background surfaces'] },
    compat:'Token names will be preserved. Works best when your project uses CSS custom properties or a design token file.',
    used:5, plats:2, last:'1 week ago', created:'Apr 17, 2026' },
  { id:4, name:'Dark Mode Tokens', date:'Apr 15', g:3, plat:'stitch', built:'stitch',
    types:['color'],
    desc:'Generates a complete dark mode stylesheet by inverting luminosity values and desaturating colors by 15% for eye comfort.',
    changes:{ visual:['Inverts luminosity on all surface colors','Desaturates accent colors by 15%'], layout:['Adjusts shadow opacity for dark contexts'], components:['All surface components','Text colors','Icon fills'] },
    compat:'Wraps output in a prefers-color-scheme media query. Platform-specific class names will be adapted automatically.',
    used:19, plats:3, last:'Yesterday', created:'Apr 15, 2026' },
  { id:5, name:'Hover Micro-interactions', date:'Apr 14', g:4, plat:'figma', built:'cursor',
    types:['visual'],
    desc:'Adds subtle scale + shadow lift transitions to all interactive elements for a polished, responsive feel.',
    changes:{ visual:['Adds transform: scale(1.02) on hover','Adds box-shadow transition on lift'], layout:['Sets transition: all 0.2s ease globally'], components:['Buttons','Cards','Nav links','Form inputs'] },
    compat:'CSS transitions are universally supported. Minor differences may occur in Stitch due to its animation system.',
    used:23, plats:5, last:'Today', created:'Apr 14, 2026' },
  { id:6, name:'Grid Snap & Align', date:'Apr 12', g:5, plat:'claude', built:'claude',
    types:['layout'],
    desc:'Enforces an 8px base grid across all spacing, padding, and margin values to keep layouts consistent and pixel-perfect.',
    changes:{ visual:[], layout:['Audits all spacing values','Rounds to nearest 8px multiple','Flags non-conforming values'], components:['All containers','Grid systems','Form layouts'] },
    compat:'Compatible with all platforms. Non-conforming values are flagged for review before being auto-corrected.',
    used:7, plats:3, last:'3 days ago', created:'Apr 12, 2026' },
  { id:7, name:'Shadow Polish', date:'Apr 10', g:6, plat:'loveable', built:'loveable',
    types:['visual'],
    desc:'Applies a consistent 2-layer shadow system to all card and panel components, creating a clear depth hierarchy.',
    changes:{ visual:['Adds rest + hover shadow layers','Adjusts shadow color to match brand hue'], layout:[], components:['Cards','Modals','Dropdowns','Panels'] },
    compat:'Shadow syntax is adapted per platform. Loveable uses Tailwind, Claude uses raw CSS, Cursor injects via style attrs.',
    used:15, plats:4, last:'4 days ago', created:'Apr 10, 2026' },
  { id:8, name:'Button Hierarchy', date:'Apr 8', g:7, plat:'cursor', built:'cursor',
    types:['visual','typography'],
    desc:'Establishes a clear primary / secondary / ghost button hierarchy with consistent sizing, weight, and color roles.',
    changes:{ visual:['Primary: filled accent','Secondary: outlined with border','Ghost: transparent background'], layout:['Standardizes padding (8px 16px)','Sets min-width for icon buttons'], components:['All button variants','CTA elements','Form submit buttons'] },
    compat:"Class naming conventions will be mapped to your platform's existing button components where possible.",
    used:11, plats:5, last:'1 week ago', created:'Apr 8, 2026' },
]

const INIT_CHAINS = [
  { id:1, name:'Full Design Polish', desc:'Applies shadow, spacing, and hover interactions in one pass.', aids:[0,4,6], created:'Apr 22, 2026' },
  { id:2, name:'Typography + Colour Refresh', desc:'Refreshes the type scale and harmonizes the color palette.', aids:[1,2], created:'Apr 19, 2026' },
]

const SEED_ACTIONS = [
  { id:'seed-1', name:'Blue CTA Button System', date:'Apr 24', g:0, plat:'loveable', built:'loveable',
    types:['visual'],
    desc:'Updates all primary call-to-action buttons to a vivid blue, improving click-through rates and visual hierarchy.',
    changes:{ visual:['Changes primary button background (#000000 → #1a56db)','Updates button text to white for contrast','Adds hover state with brightness(1.1) filter'], layout:['Standardizes button padding (10px 20px)'], components:['Primary CTA buttons','Hero section buttons','Form submit buttons'] },
    compat:'Compatible with all platforms. Color tokens will be mapped automatically.',
    used:7, plats:3, last:'Yesterday', created:'Apr 24, 2026' },
  { id:'seed-2', name:'Elevated Card Shadows', date:'Apr 23', g:1, plat:'claude', built:'claude',
    types:['visual'],
    desc:'Adds a soft two-layer drop shadow to all card components for a clean, elevated look with clear depth hierarchy.',
    changes:{ visual:['Adds rest shadow (0 4px 16px rgba(0,0,0,0.08))','Adds hover shadow (0 8px 32px rgba(0,0,0,0.14))','Smooth transition on hover (0.2s ease)'], layout:[], components:['Product cards','Feature cards','Testimonial blocks'] },
    compat:'Shadow syntax is adapted per platform. Works best with white or light card backgrounds.',
    used:14, plats:4, last:'Today', created:'Apr 23, 2026' },
  { id:'seed-3', name:'Hero Typography Scale', date:'Apr 22', g:2, plat:'cursor', built:'cursor',
    types:['typography'],
    desc:'Scales the hero headline from 48px to 72px and tightens letter-spacing to create a bold, editorial first impression.',
    changes:{ visual:['Increases hero headline contrast','Tightens letter-spacing (-0.03em)'], layout:['Adjusts line-height to 1.1 for large display sizes'], components:['Hero h1','Sub-headline','Hero CTA button'] },
    compat:'Font scaling is relative to root size. Responsive breakpoints will be preserved.',
    used:9, plats:2, last:'2 days ago', created:'Apr 22, 2026' },
  { id:'seed-4', name:'Dark Navigation Bar', date:'Apr 21', g:3, plat:'loveable', built:'loveable',
    types:['visual'],
    desc:'Converts the navigation bar background from white to dark navy, creating stronger contrast with the page content below.',
    changes:{ visual:['Changes nav background (#ffffff → #1a1a2e)','Updates nav text and links to white','Adds subtle bottom border (rgba(255,255,255,0.1))'], layout:[], components:['Top navigation bar','Nav links','Logo area'] },
    compat:'Text color tokens will be updated automatically to maintain contrast ratios.',
    used:11, plats:3, last:'3 days ago', created:'Apr 21, 2026' },
  { id:'seed-5', name:'Soft Border Radius System', date:'Apr 20', g:4, plat:'figma', built:'figma',
    types:['visual'],
    desc:'Increases border-radius across all card and container components from 8px to 20px for a softer, more modern aesthetic.',
    changes:{ visual:['Increases card border-radius (8px → 20px)','Rounds button corners (6px → 14px)','Softens input field radius (4px → 10px)'], layout:[], components:['Cards','Buttons','Form inputs','Modal dialogs'] },
    compat:'Border-radius values are set directly. No token conflicts expected.',
    used:6, plats:2, last:'4 days ago', created:'Apr 20, 2026' },
]

const SEED_CHAINS = [
  { id:'seed-chain-1', name:'Full Design Polish', description:'Applies card shadows, CTA color, and border radius in one seamless pass.',
    gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    versionBefore:'v1.0', versionAfter:'v1.3', platform:'Loveable', createdAt:'2026-04-24T10:00:00Z',
    changes:[
      { title:'Blue CTA Button System', category:'Visual', description:'Primary button color changed from black to blue', beforeValue:'#000000', afterValue:'#1a56db' },
      { title:'Elevated Card Shadows', category:'Visual', description:'Soft drop shadow added to all card components', beforeValue:'none', afterValue:'0 4px 16px rgba(0,0,0,0.08)' },
      { title:'Soft Border Radius System', category:'Visual', description:'Card border-radius increased for softer appearance', beforeValue:'8px', afterValue:'20px' },
    ] },
  { id:'seed-chain-2', name:'Typography + Nav Refresh', description:'Scales the hero headline and darkens the navigation bar for editorial impact.',
    gradient:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    versionBefore:'v2.0', versionAfter:'v2.2', platform:'Cursor', createdAt:'2026-04-22T14:00:00Z',
    changes:[
      { title:'Hero Typography Scale', category:'Typography', description:'Hero headline font-size increased for stronger impact', beforeValue:'48px', afterValue:'72px' },
      { title:'Dark Navigation Bar', category:'Visual', description:'Navigation background changed from white to dark navy', beforeValue:'#ffffff', afterValue:'#1a1a2e' },
    ] },
]

const FILES = [
  { id:1, name:'Dashboard Redesign',     plat:'loveable', versions:8,  g:0 },
  { id:2, name:'Marketing Landing Page', plat:'figma',    versions:5,  g:2 },
  { id:3, name:'Product Card System',    plat:'claude',   versions:12, g:1 },
  { id:4, name:'Onboarding Flow',        plat:'stitch',   versions:6,  g:3 },
  { id:5, name:'Auth Screen',            plat:'cursor',   versions:4,  g:4 },
]

function Tag({ plat, small }) {
  const p = PTAG[plat]
  if (!p) return null
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding: small ? '2px 8px' : '3px 12px', borderRadius:'999px', fontSize: small ? '10px' : '12px', fontWeight:500, background:p.bg, color:p.fg }}>
      {p.label}
    </span>
  )
}

function loadLocalActions() {
  try { return JSON.parse(localStorage.getItem('iterait_actions') || '[]') } catch { return [] }
}
function loadLocalChains() {
  try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] }
}

export default function ActionLibrary() {
  const navigate = useNavigate()
  const [actions, setActions] = useState(() => {
    const local = loadLocalActions()
    const localIds = new Set(local.map(a => a.id))
    return [...local, ...INIT_ACTIONS.filter(a => !localIds.has(a.id)), ...SEED_ACTIONS.filter(s => !localIds.has(s.id))]
  })
  const [chains, setChains] = useState(() => {
    const local = loadLocalChains()
    const localIds = new Set(local.map(c => c.id))
    return [...local, ...INIT_CHAINS.filter(c => !localIds.has(c.id))]
  })
  const [screen, setScreen]   = useState('library') // 'library' | 'builder'
  const [tab, setTab]         = useState('actions')  // 'actions' | 'chains'
  const [typeFilter, setTypeFilter] = useState('all')
  const [platFilter, setPlatFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Chain builder
  const [chainSel, setChainSel]       = useState([])
  const [builderName, setBuilderName] = useState('')
  const [builderDesc, setBuilderDesc] = useState('')

  // Context menu
  const [ctx, setCtx] = useState(null) // { x, y, id }

  // Modals
  const [applyModal, setApplyModal]   = useState(null) // { actionId, chainId, step, fileId }
  const [newModal, setNewModal]       = useState(null)  // { step, name, types, plat, desc, g }
  const [selectedChainId, setSelectedChainId] = useState(null)
  const [chainDetailOpen, setChainDetailOpen] = useState(false)

  // Toast
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)
  const [promptLoading, setPromptLoading] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  function toast(msg) {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600)
  }

  // Close ctx on outside click
  useEffect(() => {
    const handler = () => setCtx(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setDetailOpen(false); setSelectedId(null) } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const stored = (() => { try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] } })()
    const storedIds = new Set(stored.map(c => c.id))
    const toAdd = SEED_CHAINS.filter(s => !storedIds.has(s.id))
    if (toAdd.length > 0) {
      localStorage.setItem('iterait_chains', JSON.stringify([...stored, ...toAdd]))
    }
  }, [])

  function filtered() {
    return actions.filter(a => {
      if (typeFilter !== 'all' && !(a.types || []).includes(typeFilter)) return false
      if (platFilter !== 'all' && a.plat !== platFilter) return false
      if (searchQ && !a.name.toLowerCase().includes(searchQ.toLowerCase())) return false
      return true
    })
  }

  function selectCard(id) {
    if (selectedId === id) { setSelectedId(null); setDetailOpen(false); return }
    setSelectedId(id)
    setDetailOpen(true)
  }

  function closeDetail() { setSelectedId(null); setDetailOpen(false) }

  function goChainBuilder() {
    setChainSel([]); setBuilderName(''); setBuilderDesc('')
    closeDetail()
    setScreen('builder')
  }

  function cancelBuilder() { setChainSel([]); setScreen('library') }

  function toggleChain(id) {
    setChainSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function removeFromChain(id) {
    setChainSel(prev => prev.filter(x => x !== id))
  }

  function saveChain() {
    const name = builderName.trim() || 'Untitled Chain'
    const desc = builderDesc.trim() || 'Custom action chain.'
    setChains(prev => [...prev, {
      id: prev.length + 1, name, desc,
      aids: chainSel.map(id => actions.findIndex(a => a.id === id)),
      created: 'Apr 25, 2026',
    }])
    cancelBuilder()
    setTab('chains')
    toast(`✓ Chain "${name}" saved — ${chainSel.length} actions`)
  }

  function formatDate(iso) {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return iso }
  }

  function deleteChain(id) {
    const updated = chains.filter(c => c.id !== id)
    setChains(updated)
    const lsChains = JSON.parse(localStorage.getItem('iterait_chains') || '[]').filter(c => c.id !== id)
    localStorage.setItem('iterait_chains', JSON.stringify(lsChains))
    setSelectedChainId(null)
    setChainDetailOpen(false)
    toast('Chain deleted')
  }

  function handleGenerateChain(chain) {
    localStorage.setItem('iterait_active_chain', JSON.stringify(chain))
    navigate(`/action-chain-apply/${chain.id}`)
  }

  function selectChain(id) {
    if (selectedChainId === id) { setSelectedChainId(null); setChainDetailOpen(false); return }
    setSelectedChainId(id)
    setChainDetailOpen(true)
  }

  function dupAction(id) {
    const o = actions.find(a => a.id === id)
    setActions(prev => [...prev, { ...o, id: Math.max(...prev.map(a => a.id)) + 1, name: o.name + ' (copy)', date: 'Apr 25' }])
    toast(`Duplicated: "${o.name}"`)
  }

  function deleteAction(id) {
    setActions(prev => prev.filter(a => a.id !== id))
    closeDetail()
    toast('Action deleted')
  }

  function openApply(actionId, chainId) {
    setApplyModal({ actionId, chainId, step: 1, fileId: null })
    setGeneratedPrompt('')
  }

  function genPromptAction(a, file) {
    const pLabel = PTAG[file.plat].label
    const vis  = (a.changes.visual || []).map(c => `- ${c}`).join('\n')
    const lay  = (a.changes.layout || []).map(c => `- ${c}`).join('\n')
    const comp = (a.changes.components || []).map(c => `- ${c}`).join('\n')
    return `Please apply the following design action to this ${pLabel} project:\n\nAction: "${a.name}"\n${a.desc}\n\nVisual changes:\n${vis||'(none)'}\n\nLayout changes:\n${lay||'(none)'}\n\nComponents to update:\n${comp||'(none)'}\n\nAdapt all syntax and class names to match ${pLabel}'s conventions. Preserve all existing functionality — only update the visual and layout properties listed above.`
  }

  function genPromptChain(c, file) {
    const pLabel = PTAG[file.plat].label
    const acts = c.aids.map(i => actions[i]).filter(Boolean)
    const steps = acts.map((a, i) => `${i+1}. ${a.name} — ${a.desc}`).join('\n')
    return `Please apply the following action chain to this ${pLabel} project:\n\nChain: "${c.name}"\n${c.desc}\n\nApply each action in order:\n${steps}\n\nAdapt all syntax and class names to match ${pLabel}'s conventions. Apply each step sequentially, preserving existing functionality throughout.`
  }

  function openNewAction() {
    setNewModal({ step: 1, name: '', types: [], plat: null, desc: '', g: Math.floor(Math.random() * IMG.length) })
  }

  function saveNewAction(desc) {
    const d = { ...newModal, desc: desc || 'Custom action.' }
    setActions(prev => [...prev, {
      id: Math.max(...prev.map(a => a.id)) + 1,
      name: d.name, date: 'Apr 25', g: d.g,
      plat: d.plat, built: d.plat,
      types: d.types.length ? d.types : ['visual'],
      desc: d.desc,
      changes: { visual: [], layout: [], components: [] },
      compat: 'Compatible with all platforms.',
      used: 0, plats: 1, last: 'Just now', created: 'Apr 25, 2026',
    }])
    setNewModal(null)
    toast(`✓ "${d.name}" added to your library`)
  }

  const selectedAction = actions.find(a => a.id === selectedId)

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <main className="main-v2" style={{ display:'flex', flexDirection:'column', overflow:'hidden', height:'100vh' }}>
      {/* Topbar */}
      <header className="topbar-v2">
        <div className="left" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span onClick={() => navigate('/files')} style={{ color:'var(--text-3)', cursor:'pointer', fontSize:'14px' }}>Home</span>
          <span style={{ color:'var(--text-4)', fontSize:'14px' }}>/</span>
          <span style={{ fontSize:'14px', color:'var(--text)' }}>
            {screen === 'builder' ? 'Actions Library / New Chain' : 'Actions Library'}
          </span>
        </div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color:'var(--text-3)', flexShrink:0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <div className="right"><img src="/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
      </header>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── SCREEN: Library ── */}
        {screen === 'library' && (
          <>
            {/* Tab switcher */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 28px', flexShrink:0, background:'white' }}>
              {['actions','chains'].map(t => (
                <div key={t} onClick={() => { setTab(t); if (t==='actions') {} else closeDetail() }}
                  style={{ padding:'11px 14px', fontSize:'13px', fontWeight:500, color: tab===t ? 'var(--text)' : 'var(--text-3)', cursor:'pointer', borderBottom: tab===t ? '2px solid var(--text)' : '2px solid transparent', marginBottom:'-1px', transition:'all .15s' }}>
                  {t === 'actions' ? 'Actions' : 'Action Chains'}
                </div>
              ))}
            </div>

            {/* ACTIONS tab */}
            {tab === 'actions' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ padding:'22px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                  <div style={{ fontFamily:"'Instrument Sans', sans-serif", fontSize:'32px', fontWeight:600 }}>Actions Library</div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={openNewAction} style={btnOutlineSm}>+ New Action</button>
                    <button onClick={goChainBuilder} style={btnPrimarySm}>⊞ Create Chain</button>
                  </div>
                </div>

                {/* Filters */}
                <div style={{ padding:'14px 32px 0', display:'flex', alignItems:'center', gap:'6px', flexShrink:0, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-3)', marginRight:'2px' }}>Type:</span>
                  {[['all','All',null],['visual','Visual','#6366f1'],['layout','Layout','#10b981'],['color','Color','#f59e0b'],['typography','Typography','#8b5cf6']].map(([v,label,dot]) => (
                    <button key={v} onClick={() => setTypeFilter(v)} style={filterPill(typeFilter===v)}>
                      {dot && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:dot, flexShrink:0 }} />}
                      {label}
                    </button>
                  ))}
                  <div style={{ width:'1px', height:'18px', background:'var(--border)', margin:'0 2px' }} />
                  <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-3)', marginRight:'2px' }}>From:</span>
                  {[['all','All platforms'],['cursor','Cursor'],['loveable','Loveable'],['claude','Claude'],['figma','Figma Make'],['stitch','Stitch']].map(([v,label]) => (
                    <button key={v} onClick={() => setPlatFilter(v)} style={filterPill(platFilter===v)}>{label}</button>
                  ))}
                </div>

                {/* Cards + detail panel */}
                <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                  <div style={{ flex:1, overflowY:'auto', padding:'18px 32px 28px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:'18px' }}>
                      {filtered().length === 0 && (
                        <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'50px 20px', color:'var(--text-3)', fontSize:'13px' }}>No actions match your filters.</div>
                      )}
                      {filtered().map(a => (
                        <ActionCard key={a.id} a={a} selected={a.id === selectedId} inBuilder={false}
                          onClick={() => selectCard(a.id)}
                          onCtx={(e) => { e.preventDefault(); e.stopPropagation(); setCtx({ x: Math.min(e.clientX, window.innerWidth-170), y: Math.min(e.clientY, window.innerHeight-160), id: a.id }) }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Detail panel — fixed position */}
                  <div style={{ position:'fixed', right:0, top:0, height:'100vh', width: detailOpen ? '480px' : 0, background:'white', borderLeft:'1px solid var(--border)', overflow:'hidden', transition:'width .3s cubic-bezier(.4,0,.2,1), box-shadow .3s ease', display:'flex', flexDirection:'column', zIndex:200, boxShadow: detailOpen ? '-8px 0 32px rgba(0,0,0,.10)' : 'none' }}>
                    {selectedAction && (
                      <DetailPanel a={selectedAction} onClose={closeDetail} onDup={() => dupAction(selectedAction.id)} onDelete={() => deleteAction(selectedAction.id)} toast={toast} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CHAINS tab */}
            {tab === 'chains' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ padding:'22px 32px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                  <div style={{ fontFamily:"'Instrument Sans', sans-serif", fontSize:'32px', fontWeight:600 }}>Action Chains</div>
                </div>

                <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                  <div style={{ flex:1, overflowY:'auto', padding:'18px 32px 28px' }}>
                    {(() => {
                      const localChains = (() => { try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] } })()
                      if (localChains.length === 0) {
                        return (
                          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-3)', fontSize:'14px' }}>
                            <div style={{ fontSize:'30px', opacity:.25, marginBottom:'12px' }}>⊞</div>
                            No chains yet. Save 2+ changes together from Version History to create a chain.
                          </div>
                        )
                      }
                      return (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:18 }}>
                          {localChains.map(c => (
                            <ChainCard key={c.id} chain={c} onClick={() => selectChain(c.id)} selected={c.id === selectedChainId} onGenerate={() => handleGenerateChain(c)} />
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Chain detail panel */}
                  <div style={{ position:'fixed', right:0, top:0, height:'100vh', width: chainDetailOpen ? '480px' : 0, background:'white', borderLeft:'1px solid var(--border)', overflow:'hidden', transition:'width .3s cubic-bezier(.4,0,.2,1), box-shadow .3s ease', display:'flex', flexDirection:'column', zIndex:200, boxShadow: chainDetailOpen ? '-8px 0 32px rgba(0,0,0,.10)' : 'none' }}>
                    {(() => {
                      const localChains = (() => { try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] } })()
                      const chain = localChains.find(c => c.id === selectedChainId)
                      if (!chain) return null
                      return (
                        <div style={{ width:'480px', overflowY:'auto', height:'100%', display:'flex', flexDirection:'column' }}>
                          {/* Banner */}
                          <div style={{ height:140, background: chain.gradient || 'linear-gradient(135deg,#5BC4C0,#7EB8E8)', borderRadius:'0 16px 0 0', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:16, position:'relative', flexShrink:0 }}>
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <span style={{ background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:11, padding:'3px 8px', borderRadius:5, fontFamily:"'Instrument Sans',sans-serif" }}>{chain.versionBefore || 'Previous'}</span>
                              <span style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>→</span>
                              <span style={{ background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:11, padding:'3px 8px', borderRadius:5, fontFamily:"'Instrument Sans',sans-serif" }}>{chain.versionAfter || 'Current'}</span>
                            </div>
                            <div onClick={() => { setSelectedChainId(null); setChainDetailOpen(false) }} style={{ position:'absolute', top:10, right:12, width:26, height:26, borderRadius:6, background:'rgba(255,255,255,.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:13, color:'#555' }}>✕</div>
                          </div>

                          {/* Body */}
                          <div style={{ padding:'20px 24px 0', fontFamily:"'Instrument Sans',sans-serif" }}>
                            <div style={{ fontSize:22, fontWeight:700, color:'#111', letterSpacing:'-.02em', marginBottom: chain.description ? 6 : 14 }}>{chain.name}</div>
                            {chain.description && (
                              <div style={{ fontSize:14, color:'#666', lineHeight:1.6, marginBottom:14 }}>{chain.description}</div>
                            )}
                            <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                              <button onClick={() => handleGenerateChain(chain)} style={{ background:'#111', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, fontFamily:"'Instrument Sans',sans-serif", cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Generate Prompt
                              </button>
                              <button onClick={() => deleteChain(chain.id)} style={{ background:'#fff', border:'1.5px solid #e8e8e8', borderRadius:10, padding:'10px 12px', fontSize:14, cursor:'pointer', color:'#E05C5C', fontFamily:"'Instrument Sans',sans-serif" }}>Delete</button>
                            </div>
                          </div>

                          {/* Changes list */}
                          <div style={{ padding:'0 24px 24px', fontFamily:"'Instrument Sans',sans-serif" }}>
                            <div style={{ fontSize:10, fontWeight:600, color:'#bbb', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>{chain.changes.length} changes in this chain</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {chain.changes.map((change, i) => (
                                <div key={i} style={{ background:'#fafaf8', border:'1px solid #efefef', borderRadius:10, padding:'12px 14px' }}>
                                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                                    <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{change.title}</div>
                                    <span style={{ fontSize:10, fontWeight:600, color:'#888', background:'#f0f0ee', padding:'2px 7px', borderRadius:4 }}>{change.category}</span>
                                  </div>
                                  <div style={{ fontSize:12, color:'#888', lineHeight:1.5, marginBottom: (change.beforeValue && change.afterValue) ? 6 : 0 }}>{change.description}</div>
                                  {change.beforeValue && change.afterValue && (
                                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                      <span style={{ fontSize:11, background:'#FEE2E2', color:'#B91C1C', padding:'2px 7px', borderRadius:4, fontFamily:'monospace' }}>{change.beforeValue}</span>
                                      <span style={{ fontSize:10, color:'#bbb' }}>→</span>
                                      <span style={{ fontSize:11, background:'#DCFCE7', color:'#15803D', padding:'2px 7px', borderRadius:4, fontFamily:'monospace' }}>{change.afterValue}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SCREEN: Chain Builder ── */}
        {screen === 'builder' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'16px 28px', background:'white', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
              <button onClick={cancelBuilder} style={btnGhostSm}>← Back</button>
              <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:'18px', fontWeight:600, whiteSpace:'nowrap' }}>Create Action Chain</div>
              <input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="Chain name…"
                style={{ background:'#f2f2f2', border:'1px solid var(--border)', borderRadius:'7px', padding:'6px 13px', fontSize:'13px', fontFamily:'inherit', outline:'none', width:'240px', color:'var(--text)' }} />
              <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
                <button onClick={cancelBuilder} style={btnOutlineSm}>Cancel</button>
                <button onClick={saveChain} disabled={chainSel.length < 2} style={{ ...btnPrimarySm, opacity: chainSel.length < 2 ? .45 : 1, cursor: chainSel.length < 2 ? 'not-allowed' : 'pointer' }}>Save Chain</button>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              <div style={{ flex:1, overflowY:'auto', padding:'18px 28px 28px' }}>
                <div style={{ fontSize:'13px', color:'var(--text-3)', marginBottom:'16px' }}>Click actions to add them to your chain — they'll apply in the order selected.</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:'18px' }}>
                  {actions.map(a => (
                    <ActionCard key={a.id} a={a} selected={chainSel.includes(a.id)} inBuilder={true}
                      onClick={() => toggleChain(a.id)} onCtx={null}
                      chainNum={chainSel.includes(a.id) ? chainSel.indexOf(a.id) + 1 : null}
                    />
                  ))}
                </div>
              </div>
              {/* Chain preview panel */}
              <div style={{ width:'300px', flexShrink:0, borderLeft:'1px solid var(--border)', background:'white', display:'flex', flexDirection:'column' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'13px', fontWeight:600 }}>
                  Chain Preview
                  <span style={{ fontSize:'11px', fontWeight:600, background:'rgba(0,89,255,.08)', color:'#0059FF', padding:'2px 8px', borderRadius:'10px' }}>{chainSel.length} selected</span>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
                  {chainSel.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'180px', color:'var(--text-3)', fontSize:'13px', textAlign:'center', gap:'8px' }}>
                      <div style={{ fontSize:'26px', opacity:.25 }}>⊞</div>
                      <div>Select actions to build<br/>your chain</div>
                    </div>
                  ) : chainSel.map((id, i) => {
                    const a = actions.find(x => x.id === id)
                    if (!a) return null
                    const p = PTAG[a.plat]
                    return (
                      <div key={id}>
                        {i > 0 && <div style={{ textAlign:'center', fontSize:'14px', color:'var(--text-3)', padding:'2px 0', marginLeft:'20px' }}>↓</div>}
                        <div style={{ display:'flex', alignItems:'center', gap:'9px', padding:'9px 11px', background:'#f7f7f7', borderRadius:'8px', marginBottom:'6px', position:'relative' }}>
                          <div style={{ position:'absolute', top:'-6px', left:'-4px', width:'17px', height:'17px', borderRadius:'50%', background:'var(--text)', color:'white', fontSize:'9px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
                          <div style={{ width:'34px', height:'34px', borderRadius:'6px', flexShrink:0, ...thumbStyle(a.g), backgroundSize:'cover', backgroundPosition:'center' }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'12px', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</div>
                            <span style={{ fontSize:'10px', padding:'1px 7px', marginTop:'3px', display:'inline-flex', borderRadius:'999px', background:p.bg, color:p.fg, fontWeight:500 }}>{p.label}</span>
                          </div>
                          <span onClick={() => removeFromChain(id)} style={{ fontSize:'14px', color:'var(--text-3)', cursor:'pointer', padding:'2px 4px', borderRadius:'4px' }}>✕</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding:'12px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'8px' }}>
                  <textarea value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Description (optional)…"
                    style={{ width:'100%', background:'#f2f2f2', border:'1px solid var(--border)', borderRadius:'7px', padding:'7px 11px', fontSize:'12px', fontFamily:'inherit', outline:'none', resize:'none', minHeight:'52px', color:'var(--text)' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dim overlay for detail panel */}
      {detailOpen && (
        <div onClick={closeDetail} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.22)', zIndex:199, transition:'opacity .3s ease' }} />
      )}

      {/* Context menu */}
      {ctx && (
        <div style={{ position:'fixed', left:ctx.x, top:ctx.y, background:'white', border:'1px solid var(--border)', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,.11)', zIndex:400, overflow:'hidden', minWidth:'160px' }}
          onClick={e => e.stopPropagation()}>
          <div onClick={() => { setCtx(null); toast('Opening action editor…') }} style={ctxItem()}>✏️ &nbsp;Edit action</div>
          <div onClick={() => { setCtx(null); dupAction(ctx.id) }} style={ctxItem()}>⊕ &nbsp;Duplicate</div>
          <div onClick={() => { setCtx(null); goChainBuilder(); toast('Now select actions to add to your chain') }} style={ctxItem()}>⊞ &nbsp;Add to a chain</div>
          <div style={{ height:'1px', background:'var(--border)' }} />
          <div onClick={() => { setCtx(null); deleteAction(ctx.id) }} style={ctxItem('#dc2626')}>🗑 &nbsp;Delete</div>
        </div>
      )}

      {/* Apply modal */}
      {applyModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setApplyModal(null) }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.22)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={modalStyle}>
            <div style={modalHd}>
              <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:'16px', fontWeight:600, flex:1 }}>
                {applyModal.actionId
                  ? `Apply "${actions.find(a=>a.id===applyModal.actionId)?.name}"`
                  : `Apply Chain: "${chains.find(c=>c.id===applyModal.chainId)?.name}"`}
              </div>
              <span onClick={() => setApplyModal(null)} style={{ fontSize:'17px', color:'var(--text-3)', cursor:'pointer' }}>✕</span>
            </div>
            {applyModal.step === 1 && (
              <>
                <div style={modalBody}>
                  <ModalSteps steps={['Select file','Get prompt']} current={0} />
                  <p style={{ fontSize:'13px', color:'var(--text-3)', marginBottom:'14px' }}>Choose a file — LayerSync will translate this action into a paste-ready prompt for that platform.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px', maxHeight:'270px', overflowY:'auto' }}>
                    {FILES.map(f => {
                      const p = PTAG[f.plat]
                      const sel = applyModal.fileId === f.id
                      return (
                        <div key={f.id} onClick={() => setApplyModal(m => ({ ...m, fileId: f.id }))}
                          style={{ display:'flex', alignItems:'center', gap:'11px', padding:'10px 13px', borderRadius:'9px', border:`1.5px solid ${sel ? '#0059FF' : 'var(--border)'}`, cursor:'pointer', background: sel ? 'rgba(0,89,255,.03)' : 'white' }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'7px', flexShrink:0, ...thumbStyle(f.g), backgroundSize:'cover', backgroundPosition:'center' }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'13px', fontWeight:600 }}>{f.name}</div>
                            <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:'2px' }}>
                              <span style={{ display:'inline-flex', padding:'1px 7px', borderRadius:'999px', fontSize:'10px', fontWeight:500, background:p.bg, color:p.fg }}>{p.label}</span>
                              {' · '}{f.versions} versions
                            </div>
                          </div>
                          <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${sel ? '#0059FF' : 'var(--border)'}`, background: sel ? '#0059FF' : 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'white', flexShrink:0 }}>{sel ? '✓' : ''}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={modalFt}>
                  <button onClick={() => setApplyModal(null)} style={btnOutlineSm}>Cancel</button>
                  <button disabled={!applyModal.fileId} onClick={() => setApplyModal(m => ({ ...m, step: 2 }))} style={{ ...btnPrimarySm, opacity: applyModal.fileId ? 1 : .45, cursor: applyModal.fileId ? 'pointer' : 'not-allowed' }}>Next →</button>
                </div>
              </>
            )}
            {applyModal.step === 2 && (() => {
              const file   = FILES.find(f => f.id === applyModal.fileId)
              const action = applyModal.actionId ? actions.find(a => a.id === applyModal.actionId) : null
              const chain  = applyModal.chainId  ? chains.find(c => c.id === applyModal.chainId)   : null

              // Kick off Claude call when entering step 2 (if not already started)
              if (!promptLoading && !generatedPrompt) {
                setPromptLoading(true)
                const call = action
                  ? generateActionPrompt(action)
                  : Promise.resolve(genPromptChain(chain, file))
                call.then(p => { setGeneratedPrompt(p); setPromptLoading(false) })
                     .catch(() => { setGeneratedPrompt(genPromptChain(chain, file)); setPromptLoading(false) })
              }

              return (
                <>
                  <div style={modalBody}>
                    <ModalSteps steps={['Select file','Get prompt']} current={1} done={[0]} />
                    <p style={{ fontSize:'13px', color:'var(--text-3)', marginBottom:'14px' }}>
                      Paste this into <strong>{PTAG[file.plat].label}</strong> to apply to <strong>{file.name}</strong>.
                    </p>
                    <div style={{ fontSize:'11px', fontWeight:600, color:'var(--text-3)', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      Generated prompt
                      {!promptLoading && <button onClick={() => navigator.clipboard.writeText(generatedPrompt).then(()=>toast('Prompt copied to clipboard'))} style={btnOutlineSm}>Copy</button>}
                    </div>
                    {promptLoading ? (
                      <div style={{ background:'#f7f7f7', border:'1px solid var(--border)', borderRadius:'9px', padding:'32px', textAlign:'center', color:'var(--text-3)', fontSize:'13px' }}>
                        Generating prompt…
                      </div>
                    ) : (
                      <div style={{ background:'#f7f7f7', border:'1px solid var(--border)', borderRadius:'9px', padding:'14px', fontFamily:"'SF Mono',Menlo,monospace", fontSize:'11px', lineHeight:1.7, color:'#333', whiteSpace:'pre-wrap', maxHeight:'260px', overflowY:'auto' }}>{generatedPrompt}</div>
                    )}
                  </div>
                  <div style={modalFt}>
                    <button onClick={() => { setApplyModal(m => ({ ...m, step: 1 })); setGeneratedPrompt(''); setPromptLoading(false) }} style={btnGhostSm}>← Back</button>
                    <button disabled={promptLoading} onClick={() => navigator.clipboard.writeText(generatedPrompt).then(()=>toast('Prompt copied to clipboard'))} style={{ ...btnPrimarySm, opacity: promptLoading ? .5 : 1 }}>Copy prompt</button>
                    <button onClick={() => window.open('https://claude.ai', '_blank')} style={btnOutlineSm}>Open in Claude</button>
                    <button onClick={() => setApplyModal(null)} style={btnOutlineSm}>Done</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* New Action modal */}
      {newModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setNewModal(null) }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.22)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={modalStyle}>
            <div style={modalHd}>
              <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:'16px', fontWeight:600, flex:1 }}>New Action</div>
              <span onClick={() => setNewModal(null)} style={{ fontSize:'17px', color:'var(--text-3)', cursor:'pointer' }}>✕</span>
            </div>
            {newModal.step === 1 && (
              <>
                <div style={modalBody}>
                  <ModalSteps steps={['Name & Type','Platform','Description']} current={0} done={[]} />
                  <div style={{ marginBottom:'16px' }}>
                    <label style={fieldLabel}>Action Name</label>
                    <input value={newModal.name} onChange={e => setNewModal(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Elevated Card System"
                      style={{ width:'100%', background:'#f7f7f7', border:'1px solid var(--border)', borderRadius:'9px', padding:'10px 13px', fontSize:'13px', fontFamily:'inherit', outline:'none', color:'var(--text)' }} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Type <span style={{ fontWeight:400, textTransform:'none' }}>(optional, pick all that apply)</span></label>
                    <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginTop:'8px' }}>
                      {Object.entries(TC).map(([k, c]) => (
                        <button key={k} onClick={() => setNewModal(m => ({ ...m, types: m.types.includes(k) ? m.types.filter(t=>t!==k) : [...m.types, k] }))}
                          style={filterPill(newModal.types.includes(k))}>
                          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:c }} />
                          {k.charAt(0).toUpperCase()+k.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={modalFt}>
                  <button onClick={() => setNewModal(null)} style={btnGhostSm}>Cancel</button>
                  <button disabled={!newModal.name.trim()} onClick={() => setNewModal(m => ({ ...m, step: 2 }))} style={{ ...btnPrimarySm, opacity: newModal.name.trim() ? 1 : .45, cursor: newModal.name.trim() ? 'pointer' : 'not-allowed' }}>Next →</button>
                </div>
              </>
            )}
            {newModal.step === 2 && (
              <>
                <div style={modalBody}>
                  <ModalSteps steps={['Name & Type','Platform','Description']} current={1} done={[0]} />
                  <p style={{ fontSize:'13px', color:'var(--text-3)', marginBottom:'14px' }}>Which platform was this action created with?</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {Object.entries(PTAG).map(([k, p]) => {
                      const EMOJI = { cursor:'⌨️', loveable:'💜', claude:'🤖', figma:'🎨', stitch:'🧵' }
                      const sel = newModal.plat === k
                      return (
                        <div key={k} onClick={() => setNewModal(m => ({ ...m, plat: k }))}
                          style={{ display:'flex', alignItems:'center', gap:'11px', padding:'10px 13px', borderRadius:'9px', border:`1.5px solid ${sel ? '#0059FF' : 'var(--border)'}`, cursor:'pointer', background: sel ? 'rgba(0,89,255,.03)' : 'white' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{EMOJI[k]}</div>
                          <div style={{ flex:1, fontSize:'13px', fontWeight:600 }}>{p.label}</div>
                          <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${sel ? '#0059FF' : 'var(--border)'}`, background: sel ? '#0059FF' : 'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'white', flexShrink:0 }}>{sel ? '✓' : ''}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={modalFt}>
                  <button onClick={() => setNewModal(m => ({ ...m, step: 1 }))} style={btnGhostSm}>← Back</button>
                  <button disabled={!newModal.plat} onClick={() => setNewModal(m => ({ ...m, step: 3 }))} style={{ ...btnPrimarySm, opacity: newModal.plat ? 1 : .45, cursor: newModal.plat ? 'pointer' : 'not-allowed' }}>Next →</button>
                </div>
              </>
            )}
            {newModal.step === 3 && (() => {
              const pt = PTAG[newModal.plat]
              let descVal = newModal.desc
              return (
                <>
                  <div style={modalBody}>
                    <ModalSteps steps={['Name & Type','Platform','Description']} current={2} done={[0,1]} />
                    <div style={{ marginBottom:'14px' }}>
                      <label style={fieldLabel}>Description</label>
                      <textarea defaultValue={descVal} onChange={e => { descVal = e.target.value }} placeholder="Describe what this action does and what it changes…"
                        style={{ width:'100%', background:'#f7f7f7', border:'1px solid var(--border)', borderRadius:'9px', padding:'10px 13px', fontSize:'13px', fontFamily:'inherit', outline:'none', resize:'none', minHeight:'88px', color:'var(--text)' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 12px', background:'#f7f7f7', borderRadius:'9px' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'8px', flexShrink:0, ...thumbStyle(newModal.g), backgroundSize:'cover', backgroundPosition:'center' }} />
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px' }}>{newModal.name}</div>
                        <span style={{ fontSize:'10px', padding:'2px 9px', borderRadius:'999px', background:pt.bg, color:pt.fg, fontWeight:500 }}>{pt.label}</span>
                      </div>
                    </div>
                  </div>
                  <div style={modalFt}>
                    <button onClick={() => setNewModal(m => ({ ...m, step: 2 }))} style={btnGhostSm}>← Back</button>
                    <button onClick={() => saveNewAction(descVal)} style={btnPrimarySm}>Create Action</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position:'fixed', bottom:'22px', left:'50%', transform:'translateX(-50%)', background:'var(--text)', color:'white', borderRadius:'8px', padding:'9px 16px', fontSize:'12px', fontWeight:500, zIndex:999, opacity: toastMsg ? 1 : 0, pointerEvents:'none', transition:'opacity .2s', whiteSpace:'nowrap' }}>
        {toastMsg}
      </div>
    </main>
  )
}

// Flatten changes object → array with optional before/after values
function flattenChanges(changes) {
  const result = []
  let i = 0
  for (const key of ['visual', 'layout']) {
    for (const item of (changes[key] || [])) {
      const m = item.match(/\(([^→)]+?)\s*→\s*([^)]+?)\)/)
      let description = item, beforeValue = null, afterValue = null
      if (m) {
        description = item.replace(m[0], '').trim()
        beforeValue = m[1].trim()
        afterValue  = m[2].trim()
      }
      result.push({ id: i++, description, beforeValue, afterValue })
    }
  }
  return result
}

const PROMPT_TOOLS = ['Claude', 'Loveable', 'Cursor', 'Replit', 'Figma Make']

function GeneratePromptModal({ a, onClose }) {
  const [selectedTool,    setSelectedTool]    = useState('Claude')
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copyLabel,       setCopyLabel]       = useState('Copy prompt')

  async function handleGenerate() {
    setIsGenerating(true)
    setGeneratedPrompt('')
    try {
      const normalizedAction = {
        name:     a.name,
        category: a.types.join(', '),
        changes:  flattenChanges(a.changes),
      }
      const result = await generateActionPrompt(normalizedAction, selectedTool)
      setGeneratedPrompt(result)
    } catch {
      setGeneratedPrompt('Could not generate prompt. Check your API key in .env and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function copyPrompt() {
    navigator.clipboard.writeText(generatedPrompt)
    setCopyLabel('Copied ✓')
    window.__toast?.('Prompt copied to clipboard')
    setTimeout(() => setCopyLabel('Copy prompt'), 2000)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 480, maxHeight: '84vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'Instrument Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>Generate Prompt</div>
            <span onClick={onClose} style={{ fontSize: 18, color: '#aaa', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</span>
          </div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
            Choose your vibe-coding tool and iterait will write a ready-to-paste prompt.
          </div>

          {/* Tool selector */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#aaa', marginBottom: 8 }}>Tool</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
            {PROMPT_TOOLS.map(tool => (
              <button key={tool} onClick={() => setSelectedTool(tool)}
                style={{ padding: '7px 16px', borderRadius: 999, border: `1.5px solid ${selectedTool === tool ? '#111' : '#e8e8e8'}`, background: selectedTool === tool ? '#111' : '#fff', color: selectedTool === tool ? '#fff' : '#333', fontSize: 13, fontWeight: 500, fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer', transition: 'all .12s' }}>
                {tool}
              </button>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={isGenerating}
            style={{ width: '100%', padding: '10px', background: isGenerating ? '#ccc' : '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", cursor: isGenerating ? 'not-allowed' : 'pointer', marginBottom: 16, transition: 'background .15s' }}>
            {isGenerating ? 'Writing your prompt…' : 'Generate →'}
          </button>
        </div>

        {/* Result area */}
        <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
          {isGenerating && (
            <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 13 }}>
              Writing your prompt...
            </div>
          )}
          {!isGenerating && generatedPrompt && (
            <>
              <div style={{ background: '#fafaf8', border: '1px solid #efefef', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                {generatedPrompt}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={copyPrompt}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', fontSize: 13, fontWeight: 500, fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer' }}>
                  {copyLabel}
                </button>
                <button onClick={() => window.open('https://claude.ai', '_blank')}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer' }}>
                  Open in Claude
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ChainCardThumbnail({ chain }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:120, borderRadius:'14px 14px 0 0', overflow:'hidden', position:'relative' }}>
      <div style={{ background: chain.gradient || 'linear-gradient(135deg,#5BC4C0,#7EB8E8)', filter:'grayscale(0.5) brightness(0.9)' }} />
      <div style={{ background: chain.gradient || 'linear-gradient(135deg,#5BC4C0,#7EB8E8)' }} />
      <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, letterSpacing:'.04em', fontFamily:"'Instrument Sans',sans-serif" }}>BEFORE</div>
      <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, letterSpacing:'.04em', fontFamily:"'Instrument Sans',sans-serif" }}>AFTER</div>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.15)', zIndex:2 }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:4, fontFamily:"'Instrument Sans',sans-serif", whiteSpace:'nowrap', maxWidth:'80%', overflow:'hidden', textOverflow:'ellipsis' }}>
        {chain.versionBefore || 'Before'} → {chain.versionAfter || 'After'}
      </div>
    </div>
  )
}

function ChainCard({ chain, onClick, selected, onGenerate }) {
  return (
    <div onClick={onClick}
      style={{ background:'#fff', border:`1px solid ${selected ? '#111' : '#efefef'}`, borderRadius:14, overflow:'visible', cursor:'pointer', position:'relative', transition:'box-shadow .12s', boxShadow: selected ? '0 0 0 2px rgba(0,0,0,.15), 0 4px 20px rgba(0,0,0,.10)' : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; const btn = e.currentTarget.querySelector('.chain-gen-btn'); if (btn) btn.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = selected ? '0 0 0 2px rgba(0,0,0,.15), 0 4px 20px rgba(0,0,0,.10)' : 'none'; const btn = e.currentTarget.querySelector('.chain-gen-btn'); if (btn) btn.style.opacity = '0' }}
    >
      <ChainCardThumbnail chain={chain} />
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#111', fontFamily:"'Instrument Sans',sans-serif", marginBottom:4 }}>{chain.name}</div>
        <div style={{ fontSize:11, color:'#bbb', fontFamily:"'Instrument Sans',sans-serif" }}>
          {(chain.changes || []).length} changes · {chain.platform || ''}{chain.createdAt ? ` · ${new Date(chain.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}` : ''}
        </div>
        {chain.description && (
          <div style={{ fontSize:12, color:'#888', marginTop:6, lineHeight:1.5, fontFamily:"'Instrument Sans',sans-serif" }}>{chain.description}</div>
        )}
      </div>
      <button className="chain-gen-btn" onClick={e => { e.stopPropagation(); onGenerate() }}
        style={{ position:'absolute', top:10, right:10, background:'#111', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Instrument Sans',sans-serif", opacity:0, transition:'opacity .12s' }}>
        Generate →
      </button>
    </div>
  )
}

function ActionCardThumbnail({ a, height = 160 }) {
  if (a.thumbnailBefore && a.thumbnailAfter) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, height, borderRadius:'12px 12px 0 0', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'relative', overflow:'hidden' }}>
          <img src={a.thumbnailBefore} alt="Before" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'grayscale(0.4) brightness(0.95)', display:'block' }} />
          <div style={{ position:'absolute', bottom:6, left:6, background:'rgba(0,0,0,0.45)', color:'white', fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, letterSpacing:'.04em', fontFamily:"'Instrument Sans',sans-serif" }}>BEFORE</div>
        </div>
        <div style={{ position:'relative', overflow:'hidden' }}>
          <img src={a.thumbnailAfter} alt="After" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,0.45)', color:'white', fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, letterSpacing:'.04em', fontFamily:"'Instrument Sans',sans-serif" }}>AFTER</div>
        </div>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'white', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', zIndex:2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M6 2l3 3-3 3" stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    )
  }
  return <div style={{ height, ...thumbStyle(a.g), backgroundSize:'cover', backgroundPosition:'center', borderRadius:'12px 12px 0 0' }} />
}

function ActionCard({ a, selected, inBuilder, onClick, onCtx, chainNum }) {
  const p = PTAG[a.plat] || { label: a.platform || 'Other', bg: '#f0f0f0', fg: '#666' }
  return (
    <div onClick={onClick} onContextMenu={onCtx || undefined}
      style={{ background:'#fff', borderRadius:'14px', overflow:'hidden', cursor:'pointer', transition:'all .2s', boxShadow: selected ? '0 0 0 2px rgba(0,89,255,.72), 0 4px 20px rgba(0,0,0,.10)' : '0 4px 20px rgba(0,0,0,.08)', transform: selected ? 'translateY(-2px)' : '', position:'relative', border:'none' }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.15)' } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)' } }}
    >
      <div style={{ position:'relative' }}>
        <ActionCardThumbnail a={a} height={160} />
        {inBuilder && (
          <div style={{ position:'absolute', top:'9px', right:'9px', width:'22px', height:'22px', borderRadius:'6px', border:'2px solid white', background: selected ? '#0059FF' : 'rgba(255,255,255,.3)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'white', fontWeight:700 }}>
            {selected ? '✓' : ''}
          </div>
        )}
        {!inBuilder && onCtx && (
          <div onClick={onCtx}
            style={{ position:'absolute', top:'8px', right:'8px', width:'28px', height:'28px', borderRadius:'6px', background:'rgba(255,255,255,.85)', backdropFilter:'blur(4px)', display:'none', alignItems:'center', justifyContent:'center', fontSize:'18px', cursor:'pointer', lineHeight:1, color:'#444' }}
            className="card-menu-btn">
            ···
          </div>
        )}
      </div>
      <div style={{ background:'#fff', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
          <div style={{ fontSize:'15px', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'68%', color:'#111' }}>{a.name}</div>
          <div style={{ fontSize:'13px', color:'#999' }}>{a.date}</div>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background:p.bg, color:p.fg }}>{p.label}</span>
      </div>
    </div>
  )
}

function DetailPanel({ a, onClose, onDup, onDelete, toast }) {
  const [showPromptModal, setShowPromptModal] = useState(false)
  const p  = PTAG[a.plat]  || { label: a.platform || 'Other', bg: '#f0f0f0', fg: '#666' }
  const pb = PTAG[a.built] || p
  const flatChanges = flattenChanges(a.changes)
  return (
    <div style={{ width:'480px', overflowY:'auto', height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Banner — before/after if available, else gradient */}
      {a.thumbnailBefore && a.thumbnailAfter ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, height:120, borderRadius:'0 16px 0 0', overflow:'hidden', flexShrink:0, position:'relative' }}>
          <img src={a.thumbnailBefore} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'grayscale(0.4)', display:'block' }} alt="Before" />
          <img src={a.thumbnailAfter}  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} alt="After" />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'white', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', zIndex:2 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M7 2l4 4-4 4" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div onClick={onClose} style={{ position:'absolute', top:'10px', right:'12px', width:'26px', height:'26px', borderRadius:'6px', background:'rgba(255,255,255,.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'13px', color:'#555', zIndex:3 }}>✕</div>
        </div>
      ) : (
        <div style={{ height:'120px', ...thumbStyle(a.g), backgroundSize:'cover', backgroundPosition:'center', position:'relative', flexShrink:0, borderRadius:'0 16px 0 0', filter:'saturate(1.1)' }}>
          <div onClick={onClose} style={{ position:'absolute', top:'10px', right:'12px', width:'26px', height:'26px', borderRadius:'6px', background:'rgba(255,255,255,.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'13px', color:'#555' }}>✕</div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding:'22px 24px', flex:1, fontFamily:"'Instrument Sans',sans-serif" }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', marginBottom:'6px' }}>
          <div style={{ fontSize:'26px', fontWeight:600, flex:1, lineHeight:1.15 }}>{a.name}</div>
          <div style={{ display:'flex', gap:'4px', marginTop:'8px', flexWrap:'wrap' }}>
            {(a.types || [a.category?.toLowerCase()].filter(Boolean)).map(t => (
              <span key={t} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'10px', fontWeight:600, background:`${TC[t]}18`, color:TC[t] || '#888' }}>{t}</span>
            ))}
          </div>
        </div>
        <p style={{ fontSize:'14px', fontWeight:500, color:'#333', lineHeight:1.6, marginBottom:'18px', letterSpacing:'-.01em' }}>{a.desc}</p>

        <div style={{ display:'flex', gap:'7px', marginBottom:'20px', flexWrap:'wrap' }}>
          <button onClick={() => setShowPromptModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', border:'none', fontFamily:"'Instrument Sans',sans-serif", background:'#111', color:'white' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Generate Prompt
          </button>
          <button onClick={() => toast('Opening editor…')} style={btnOutlineSm}>✏️ Edit</button>
          <button onClick={onDup} style={btnOutlineSm}>⊕ Duplicate</button>
          <button onClick={onDelete} style={{ ...btnOutlineSm, background:'rgba(220,38,38,.07)', color:'#dc2626', border:'1px solid rgba(220,38,38,.2)' }}>🗑</button>
        </div>

        <div style={{ height:'1px', background:'var(--border)', margin:'16px 0' }} />
        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-3)', marginBottom:'10px' }}>Change Summary</div>

        {flatChanges.length === 0 && (
          <div style={{ fontSize:'13px', color:'#aaa', marginBottom:'12px' }}>No changes recorded.</div>
        )}
        {flatChanges.map(c => (
          <div key={c.id} style={{ marginBottom:'10px', paddingLeft:'0' }}>
            <div style={{ fontSize:'13px', color:'#333', lineHeight:1.5, marginBottom: (c.beforeValue || c.afterValue) ? '5px' : 0 }}>{c.description}</div>
            {(c.beforeValue || c.afterValue) && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                {c.beforeValue && (
                  <span style={{ background:'#FEE2E2', color:'#B91C1C', fontFamily:'monospace', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'5px', letterSpacing:'.01em' }}>{c.beforeValue}</span>
                )}
                {c.beforeValue && c.afterValue && (
                  <span style={{ color:'#aaa', fontSize:'11px' }}>→</span>
                )}
                {c.afterValue && (
                  <span style={{ background:'#DCFCE7', color:'#15803D', fontFamily:'monospace', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'5px', letterSpacing:'.01em' }}>{c.afterValue}</span>
                )}
              </div>
            )}
          </div>
        ))}

        <div style={{ height:'1px', background:'var(--border)', margin:'16px 0' }} />
        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-3)', marginBottom:'10px' }}>Source</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
          {[{ lbl:'Created from', val:'Dashboard Redesign' }, { lbl:'Original platform', val:<span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'999px', fontSize:'10px', fontWeight:500, background:p.bg, color:p.fg }}>{p.label}</span> }, { lbl:'Built in', val:<span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'999px', fontSize:'10px', fontWeight:500, background:pb.bg, color:pb.fg }}>{pb.label}</span> }, { lbl:'Created', val:a.created }].map((s, i) => (
            <div key={i} style={{ background:'#f7f7f7', borderRadius:'8px', padding:'9px 11px' }}>
              <div style={{ fontSize:'10px', color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'2px' }}>{s.lbl}</div>
              <div style={{ fontSize:'12px', fontWeight:600 }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{ height:'1px', background:'var(--border)', margin:'16px 0' }} />
        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-3)', marginBottom:'10px' }}>Compatibility</div>
        <div style={{ background:'#fffbea', border:'1px solid #f0e68c', borderRadius:'8px', padding:'10px 13px', fontSize:'12px', color:'#7a6500', lineHeight:1.5, marginBottom:'16px' }}>{a.compat}</div>

        <div style={{ height:'1px', background:'var(--border)', margin:'16px 0' }} />
        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-3)', marginBottom:'10px' }}>Usage</div>
        <div style={{ display:'flex', gap:'10px' }}>
          {[{ val:a.used, lbl:'Times used' }, { val:a.plats, lbl:'Platforms' }, { val:a.last, lbl:'Last applied', small:true }].map((u, i) => (
            <div key={i} style={{ flex:1, background:'#f7f7f7', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize: u.small ? '12px' : '18px', fontWeight:700 }}>{u.val}</div>
              <div style={{ fontSize:'11px', color:'var(--text-3)', marginTop:'1px' }}>{u.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {showPromptModal && <GeneratePromptModal a={a} onClose={() => setShowPromptModal(false)} />}
    </div>
  )
}

function ModalSteps({ steps, current, done = [] }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'16px' }}>
      {steps.map((s, i) => {
        const isDone    = done.includes(i)
        const isActive  = i === current
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            {i > 0 && <span style={{ color:'var(--border)', fontSize:'12px' }}>→</span>}
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color: isDone ? '#059669' : isActive ? 'var(--text)' : 'var(--text-3)', fontWeight: isActive ? 600 : 400 }}>
              <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:`2px solid ${isDone ? '#059669' : isActive ? 'var(--text)' : 'var(--border)'}`, background: isDone ? '#059669' : isActive ? 'var(--text)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color: (isDone||isActive) ? 'white' : 'inherit' }}>
                {isDone ? '✓' : i+1}
              </div>
              {s}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const btnPrimarySm = { display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:500, cursor:'pointer', border:'none', fontFamily:'inherit', background:'var(--text)', color:'white' }
const btnOutlineSm = { display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', background:'transparent', color:'var(--text)', border:'1px solid var(--border)' }
const btnGhostSm   = { display:'inline-flex', alignItems:'center', gap:'5px', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit', background:'transparent', color:'var(--text-3)', border:'1px solid transparent' }
const modalStyle   = { background:'white', borderRadius:'13px', boxShadow:'0 24px 64px rgba(0,0,0,.14)', width:'500px', maxHeight:'82vh', display:'flex', flexDirection:'column', overflow:'hidden' }
const modalHd      = { padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'10px' }
const modalBody    = { padding:'20px', overflowY:'auto', flex:1 }
const modalFt      = { padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:'7px', justifyContent:'flex-end' }
const fieldLabel   = { fontSize:'11px', fontWeight:600, color:'var(--text-3)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.05em' }
function filterPill(active) {
  return { display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 11px', borderRadius:'30px', border:'none', background: active ? 'var(--text)' : 'white', fontSize:'12px', fontWeight:500, color: active ? 'white' : 'var(--text-3)', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,.09),0 0 0 1px rgba(0,0,0,.04)' }
}
function ctxItem(color) {
  return { display:'flex', alignItems:'center', gap:'8px', padding:'9px 14px', fontSize:'13px', cursor:'pointer', color: color || 'inherit' }
}
