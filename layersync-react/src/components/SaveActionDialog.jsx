import { useState } from 'react'
import { ACTION_TAG_SUGGESTIONS } from '../data/mockData'

const ACTIONS_KEY = 'iterait_gh_actions'

function loadActions() {
  try { return JSON.parse(localStorage.getItem(ACTIONS_KEY)) || [] } catch { return [] }
}

export default function SaveActionDialog({ commit, projectId, onClose, onSaved }) {
  const [name, setName] = useState(commit.message)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag))
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setTimeout(() => {
      const action = {
        id: `action_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        tags,
        projectId,
        commitSha: commit.sha,
        createdAt: new Date().toISOString(),
        appliedCount: 0,
      }
      localStorage.setItem(ACTIONS_KEY, JSON.stringify([...loadActions(), action]))
      window.__toast?.('Action saved!')
      onSaved?.(action)
      onClose()
    }, 350)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>Save this change as an Action</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1, padding: 0, marginTop: '2px' }}>×</button>
          </div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px', lineHeight: 1.5 }}>
            This commit will become a reusable Action you can apply to other projects.
          </div>
        </div>

        <div style={{ padding: '0 28px 8px' }}>
          <div style={{ background: '#fafaf9', border: '1px solid #ececea', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{commit.message}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{commit.author}</div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>Action name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name this change"
              style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>
              Description <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe what this change does"
              style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>
              Tags <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, background: '#f0f0ee', color: '#444' }}>
                  {t}
                  <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, lineHeight: 1, fontSize: '13px' }}>×</button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
              placeholder="Add a tag and press Enter"
              style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ACTION_TAG_SUGGESTIONS.filter(s => !tags.includes(s)).map(s => (
                <button key={s} onClick={() => addTag(s)}
                  style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', border: '1px solid #e8e8e8', background: '#fff', color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            style={{ padding: '10px 20px', background: name.trim() ? '#0a0a0a' : '#d4d4d4', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Save Action'}
          </button>
        </div>
      </div>
    </div>
  )
}
