import { LAUNCH_PARAM } from './config.js'

const SESSION_KEY = 'academy:launch'

// base64url → string (atob tolerates =-padding, not URL-safe chars).
function base64UrlDecode(input) {
  const s = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  try {
    return atob(s + pad)
  } catch {
    return null
  }
}

// Decode without verifying signature — verification happens server-side on
// every protected call. Client-side decode is just for UX (name display,
// return_url, expiry gating). Never trust these fields for authorization.
export function decodeJwt(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const raw = base64UrlDecode(parts[1])
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toSession(token) {
  const payload = decodeJwt(token)
  if (!payload || !payload.email) return null
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) return null
  return {
    token,
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email,
    return_url: payload.return_url || null,
    exp: payload.exp || null,
  }
}

// Boot-time launch read:
//  1. Grab ?launch_token= from URL and strip it (don't leak via refresh/share).
//  2. Store in sessionStorage so a page reload keeps the session alive
//     until the tab closes.
//  3. Return decoded session or null for anonymous mode.
export function readLaunchToken() {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const fromUrl = url.searchParams.get(LAUNCH_PARAM)
  if (fromUrl) {
    url.searchParams.delete(LAUNCH_PARAM)
    window.history.replaceState({}, '', url.toString())
    const session = toSession(fromUrl)
    if (session) {
      try { sessionStorage.setItem(SESSION_KEY, fromUrl) } catch {}
      return session
    }
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
    return null
  }
  let stored = null
  try { stored = sessionStorage.getItem(SESSION_KEY) } catch {}
  if (!stored) return null
  const session = toSession(stored)
  if (!session) {
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  }
  return session
}

export function clearLaunchToken() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}
