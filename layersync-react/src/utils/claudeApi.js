const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://iterait-production.up.railway.app'

function headers() {
  return {
    'Content-Type': 'application/json'
  }
}

export async function generateChangeSummary(htmlBefore, htmlAfter) {
  try {
    console.log('HTML before length:', htmlBefore?.length)
    console.log('HTML after length:', htmlAfter?.length)
    console.log('First 200 chars before:', htmlBefore?.slice(0, 200))
    console.log('First 200 chars after:', htmlAfter?.slice(0, 200))

    const res = await fetch(`${BACKEND_URL}/api/generate-diff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlBefore: htmlBefore?.slice(0, 6000),
        htmlAfter: htmlAfter?.slice(0, 6000)
      })
    })
    if (!res.ok) {
      console.error('generate-diff failed:', res.status, await res.text())
      return []
    }
    const data = await res.json()
    return data.changes || []
  } catch (err) {
    console.error('generateChangeSummary error:', err)
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
