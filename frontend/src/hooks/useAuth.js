import { useState } from 'react'
import { api } from '../api/client.js'

const AUTH_KEY = 'iterait_auth'
const ONBOARDED_KEY = 'iterait_onboarded'

function loadAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null } catch { return null }
}

function persist(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  return session
}

// Mock auth session, backed by localStorage. Two flags: "signed up" (has a
// session) and "onboarded" (has connected GitHub) — RequireAuth uses both to
// send a user to the right step of the flow.
export function useAuth() {
  const [user, setUser] = useState(loadAuth)
  const isAuthenticated = !!user
  const isOnboarded = localStorage.getItem(ONBOARDED_KEY) === '1'

  async function signUp(email) {
    const { user: session } = await api.signUp(email)
    setUser(persist(session))
    return session
  }

  async function connectGithub() {
    const { githubUser } = await api.connectGithub()
    const session = { ...(user || {}), githubUser }
    setUser(persist(session))
    localStorage.setItem(ONBOARDED_KEY, '1')
    return session
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(ONBOARDED_KEY)
    setUser(null)
  }

  return { user, isAuthenticated, isOnboarded, signUp, connectGithub, logout }
}
