const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function getToken() {
  return localStorage.getItem('iterait_api_token') || ''
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

export async function generateChangeSummary(htmlBefore, htmlAfter) {
  const res = await fetch(`${BACKEND_URL}/api/generate-diff`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ htmlBefore, htmlAfter })
  })
  const data = await res.json()
  return data.changes || []
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
