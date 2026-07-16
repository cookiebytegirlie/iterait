// Single source of truth for the backend base URL and auth headers.
//
// Production builds fall back to the hosted backend below. For local dev,
// create layersync-react/.env.local with:
//   VITE_BACKEND_URL=http://localhost:4000
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://iterait-production.up.railway.app'

const TOKEN_KEY = 'iterait_api_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

// JSON + bearer-auth headers. Pass an explicit token to override the stored one.
export function authHeaders(token = getToken()) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}
