import { API_BASE, TASK_ID } from './config.js'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// POST /api/game/results — kasutaja launch tokeniga (Bearer).
// Serverpool verifitseerib JWT, ekstraktib email + name, kirjutab Firestore'i.
export async function submitResult(launchToken, payload) {
  if (!API_BASE) {
    throw new ApiError('Academy API ei ole seadistatud (VITE_API_BASE)', 0)
  }
  if (!launchToken) {
    throw new ApiError('Puudub launch token', 401)
  }
  const res = await fetch(`${API_BASE}/game/results`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${launchToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task_id: TASK_ID, ...payload }),
  })
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json())?.error || '' } catch {}
    throw new ApiError(detail || `HTTP ${res.status}`, res.status)
  }
  return res.json()
}
