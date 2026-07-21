import { useState } from 'react'

const AUTH_KEY = 'iterait_auth'
const ONBOARDED_KEY = 'iterait_onboarding_complete'

function loadAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null } catch { return null }
}

function persist(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  return session
}

export function useAuth() {
  const [user, setUser] = useState(loadAuth)
  const isAuthenticated = !!user
  const isOnboarded = localStorage.getItem(ONBOARDED_KEY) === '1'

  function signUp(email, name) {
    const session = { email, name: name || email.split('@')[0], signedUpAt: Date.now() }
    setUser(persist(session))
    return session
  }

  function connectGithub(githubToken, githubUser) {
    const session = { ...(user || {}), githubToken, githubUser }
    setUser(persist(session))
    return session
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDED_KEY, '1')
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(ONBOARDED_KEY)
    setUser(null)
  }

  return { user, isAuthenticated, isOnboarded, signUp, connectGithub, completeOnboarding, logout }
}
