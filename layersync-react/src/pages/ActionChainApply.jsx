import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { generateChainPrompt } from '../utils/claudeApi'

const TOOLS = ['Claude', 'Loveable', 'Cursor', 'Replit', 'Figma Make']

export default function ActionChainApply() {
  const { chainId } = useParams()
  const navigate = useNavigate()
  const [chain, setChain] = useState(null)
  const [step, setStep] = useState(1)
  const [selectedTool, setSelectedTool] = useState('Claude')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const chains = JSON.parse(localStorage.getItem('iterait_chains') || '[]')
    const found = chains.find(c => c.id === chainId)
    setChain(found || null)
  }, [chainId])

  if (!chain) return null

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      const prompt = await generateChainPrompt(chain, selectedTool)
      setGeneratedPrompt(prompt)
      setStep(2)
    } catch (err) {
      console.error('Prompt generation failed:', err)
      setGeneratedPrompt('Could not generate prompt. Check your API key and try again.')
      setStep(2)
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    window.__toast?.('Prompt copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: "'Instrument Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #efefef', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/actions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 13, fontFamily: "'Instrument Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
            ← Back to Action Library
          </button>
          <div style={{ width: 1, height: 16, background: '#e8e8e8' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{chain.name}</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['Review changes', 'Your prompt'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step >= i + 1 ? '#111' : '#e8e8e8', color: step >= i + 1 ? '#fff' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: step === i + 1 ? '#111' : '#bbb' }}>{label}</span>
              </div>
              {i < 1 && <div style={{ width: 24, height: 1, background: step > 1 ? '#111' : '#e8e8e8' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

        {/* MAIN CONTENT */}
        <div>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Changes in this chain</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {(chain.changes || []).map((change, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{change.title}</div>
                        <span style={{ fontSize: 10, background: '#f5f5f3', color: '#888', padding: '2px 7px', borderRadius: 4 }}>{change.category}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginBottom: (change.beforeValue && change.afterValue) ? 8 : 0 }}>{change.description}</div>
                      {change.beforeValue && change.afterValue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11, background: '#FEE2E2', color: '#B91C1C', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace' }}>{change.beforeValue}</span>
                          <span style={{ fontSize: 10, color: '#bbb' }}>→</span>
                          <span style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace' }}>{change.afterValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Which tool are you using?</div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {TOOLS.map(tool => (
                  <button key={tool} onClick={() => setSelectedTool(tool)} style={{ padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${selectedTool === tool ? '#111' : '#e8e8e8'}`, background: selectedTool === tool ? '#111' : '#fff', color: selectedTool === tool ? '#fff' : '#333', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .12s' }}>
                    {tool}
                  </button>
                ))}
              </div>

              <button onClick={handleGenerate} disabled={isGenerating} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: isGenerating ? 0.7 : 1 }}>
                {isGenerating ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Writing your {selectedTool} prompt...
                  </>
                ) : (
                  <>
                    Generate {selectedTool} prompt
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Your {selectedTool} prompt</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Copy this and paste directly into {selectedTool}.</div>

              <div style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 12, padding: '18px 20px', fontFamily: 'monospace', fontSize: 13, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12, maxHeight: 320, overflowY: 'auto' }}>
                {generatedPrompt}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button onClick={handleCopy} style={{ flex: 1, padding: 13, borderRadius: 10, border: `1.5px solid ${copied ? '#DCFCE7' : '#e8e8e8'}`, background: copied ? '#DCFCE7' : '#fff', color: copied ? '#15803D' : '#333', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}>
                  {copied ? 'Copied ✓' : 'Copy prompt'}
                </button>
                <button onClick={() => window.open('https://claude.ai', '_blank')} style={{ flex: 1, padding: 13, borderRadius: 10, border: 'none', background: '#111', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Open in {selectedTool} ↗
                </button>
              </div>

              <button onClick={() => { setStep(1); setGeneratedPrompt('') }} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
                ← Try a different tool
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 24 }}>
          <div style={{ height: 80, background: chain.gradient || 'linear-gradient(135deg,#5BC4C0,#7EB8E8)' }} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>{chain.name}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6 }}>{(chain.changes || []).length} changes · {chain.platform || ''}</div>
            {chain.description && (
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 10 }}>{chain.description}</div>
            )}
            <div style={{ fontSize: 11, color: '#bbb', padding: '8px 0', borderTop: '1px solid #f5f5f3' }}>
              {chain.versionBefore || 'Previous'} → {chain.versionAfter || 'Current'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {(chain.changes || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#111', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#555' }}>{c.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
