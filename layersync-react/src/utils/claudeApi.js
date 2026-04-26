const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://iterait-production.up.railway.app'

function headers() {
  return {
    'Content-Type': 'application/json'
  }
}

export async function generateChangeSummary(htmlBefore, htmlAfter) {
  try {
    console.log('Before length:', htmlBefore?.length)
    console.log('After length:', htmlAfter?.length)

    const res = await fetch(`${BACKEND_URL}/api/generate-diff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlBefore: htmlBefore?.slice(0, 8000),
        htmlAfter: htmlAfter?.slice(0, 8000)
      })
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Diff error:', res.status, err)
      return []
    }
    const data = await res.json()
    console.log('Changes returned:', data.changes?.length)
    return data.changes || []
  } catch (err) {
    console.error('generateChangeSummary failed:', err)
    return []
  }
}

export async function generateActionPrompt(action, tool = 'Claude') {
  const res = await fetch(`${BACKEND_URL}/api/generate-action-prompt`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action, tool })
  })
  const data = await res.json()
  return data.prompt || ''
}

export async function generateChainPrompt(chain, tool = 'Claude') {
  const res = await fetch(`${BACKEND_URL}/api/generate-chain-prompt`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ chain, tool })
  })
  const data = await res.json()
  return data.prompt || ''
}
