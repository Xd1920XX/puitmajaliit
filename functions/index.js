// Virtuaalne mudeldaja — Academy integration API (Firebase Functions v2).
//
// Kaks logiliselt eristatud liidest:
//   /game/*     — mäng (Puitmajaliit SPA) kasutab launch tokeniga (user JWT).
//   /academy/*  — Woodhouse Academy backend kasutab server-to-server
//                 API võtmega (Bearer).
//
// Secrets (seadista `firebase functions:secrets:set <NAME>`):
//   ACADEMY_JWT_SECRET   — Academy launch tokeni allkirjastamise salajane võti (HS256).
//   ACADEMY_API_KEY      — M2M Bearer võti Academy backend päringutele.
//
// Firestore kollektsioonid:
//   tasks/{taskId}       — { title, description, image_url, is_active, sort_order }
//   results/{autoId}     — { email, name, task_id, score, duration_seconds,
//                            finished_at, created_at, floors_count }

import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import jwt from 'jsonwebtoken'
import express from 'express'
import cors from 'cors'

initializeApp()
const db = getFirestore()

const ACADEMY_JWT_SECRET = defineSecret('ACADEMY_JWT_SECRET')
const ACADEMY_API_KEY = defineSecret('ACADEMY_API_KEY')

// JWT metadata — hoiab Game ja Academy koordineerituna.
const EXPECTED_ISS = 'woodhouse-academy'
const EXPECTED_AUD = 'virtuaalne-mudeldaja'

function readBearer(req) {
  const h = req.get('authorization') || req.get('Authorization') || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

// Launch tokeni verifitseerimine — HS256 shared secret, lühike kehtivusaeg
// (5–15 min soovitatud). audience + issuer kontroll.
function verifyLaunchToken(token, secret) {
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: EXPECTED_ISS,
      audience: EXPECTED_AUD,
    })
  } catch {
    return null
  }
}

function requireLaunch(req, res, next) {
  const token = readBearer(req)
  if (!token) return res.status(401).json({ error: 'missing_token' })
  const payload = verifyLaunchToken(token, ACADEMY_JWT_SECRET.value())
  if (!payload || !payload.email) {
    return res.status(401).json({ error: 'invalid_token' })
  }
  req.user = {
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email,
  }
  next()
}

function requireAcademy(req, res, next) {
  const token = readBearer(req)
  const expected = ACADEMY_API_KEY.value()
  if (!token || !expected || !safeEquals(token, expected)) {
    return res.status(401).json({ error: 'invalid_api_key' })
  }
  next()
}

function safeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Perekonnanime esimene täht — Academy TOP-vaates kuvatakse nt "Mari M.".
function toDisplayName(full) {
  const trimmed = (full || '').trim()
  if (!trimmed) return 'Anonüümne'
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return parts[0]
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first} ${last[0] || ''}.`
}

const app = express()
app.use(express.json({ limit: '64kb' }))
app.use(cors({ origin: true }))

app.get('/health', (_req, res) => res.json({ ok: true }))

// --------- Game: SPA (user JWT) ----------

// POST /game/results
// Headers: Authorization: Bearer <launch_token>
// Body: { task_id, score, duration_seconds, finished_at?, floors_count? }
app.post('/game/results', requireLaunch, async (req, res) => {
  const { task_id, score, duration_seconds, finished_at, floors_count } = req.body || {}
  if (
    typeof task_id !== 'string' ||
    typeof score !== 'number' ||
    typeof duration_seconds !== 'number'
  ) {
    return res.status(400).json({ error: 'bad_request' })
  }
  const now = finished_at ? new Date(finished_at) : new Date()
  if (Number.isNaN(now.getTime())) {
    return res.status(400).json({ error: 'bad_finished_at' })
  }

  const doc = {
    email: req.user.email,
    name: req.user.name,
    task_id,
    score,
    duration_seconds,
    floors_count: typeof floors_count === 'number' ? floors_count : null,
    finished_at: now.toISOString(),
    created_at: FieldValue.serverTimestamp(),
  }
  const ref = await db.collection('results').add(doc)
  res.json({ id: ref.id, ...doc, created_at: null })
})

// --------- Academy: M2M (API key) ----------

// GET /academy/tasks → { tasks: [...] }
app.get('/academy/tasks', requireAcademy, async (_req, res) => {
  let snap
  try {
    snap = await db
      .collection('tasks')
      .where('is_active', '==', true)
      .orderBy('sort_order', 'asc')
      .get()
  } catch (err) {
    // Fallback kui orderBy index puudub — lihtsalt where ja sorteeri mälus.
    snap = await db.collection('tasks').where('is_active', '==', true).get()
  }
  const tasks = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  res.json({ tasks })
})

// GET /academy/tasks/:task_id/leaderboard → { task_id, top_result }
app.get('/academy/tasks/:task_id/leaderboard', requireAcademy, async (req, res) => {
  const { task_id } = req.params
  // Parim tulemus: kõrgeim score; võrdse score korral kiirem (väiksem duration).
  const snap = await db
    .collection('results')
    .where('task_id', '==', task_id)
    .orderBy('score', 'desc')
    .orderBy('duration_seconds', 'asc')
    .limit(1)
    .get()
  if (snap.empty) {
    return res.json({ task_id, top_result: null })
  }
  const r = snap.docs[0].data()
  res.json({
    task_id,
    top_result: {
      display_name: toDisplayName(r.name || r.email),
      score: r.score,
      duration_seconds: r.duration_seconds,
    },
  })
})

// GET /academy/users/:email/results → { email, results: [...] }
app.get('/academy/users/:email/results', requireAcademy, async (req, res) => {
  const email = decodeURIComponent(req.params.email || '').toLowerCase()
  if (!email) return res.status(400).json({ error: 'bad_email' })
  const snap = await db.collection('results').where('email', '==', email).get()
  const byTask = new Map()
  for (const d of snap.docs) {
    const r = d.data()
    const prev = byTask.get(r.task_id) || { task_id: r.task_id, best: null, latest: null }
    const better =
      !prev.best ||
      r.score > prev.best.score ||
      (r.score === prev.best.score && r.duration_seconds < prev.best.duration_seconds)
    if (better) prev.best = r
    const newer = !prev.latest || r.finished_at > prev.latest.finished_at
    if (newer) prev.latest = r
    byTask.set(r.task_id, prev)
  }
  const results = [...byTask.values()].map((e) => ({
    task_id: e.task_id,
    best_result: e.best && {
      score: e.best.score,
      duration_seconds: e.best.duration_seconds,
      finished_at: e.best.finished_at,
    },
    latest_result: e.latest && {
      score: e.latest.score,
      duration_seconds: e.latest.duration_seconds,
      finished_at: e.latest.finished_at,
    },
  }))
  res.json({ email, results })
})

// --------- Admin: task CRUD (sama API key, MVP otstarbel) ----------

// POST /admin/tasks  body: { id, title, description, image_url?, is_active?, sort_order? }
// PUT  /admin/tasks/:id  body: muudetavad väljad
// DELETE /admin/tasks/:id
app.post('/admin/tasks', requireAcademy, async (req, res) => {
  const { id, title, description, image_url, is_active, sort_order } = req.body || {}
  if (typeof id !== 'string' || !id || typeof title !== 'string') {
    return res.status(400).json({ error: 'bad_request' })
  }
  const data = {
    title,
    description: description || '',
    image_url: image_url || '',
    is_active: is_active !== false,
    sort_order: typeof sort_order === 'number' ? sort_order : 1,
  }
  await db.collection('tasks').doc(id).set(data, { merge: true })
  res.json({ id, ...data })
})

app.delete('/admin/tasks/:id', requireAcademy, async (req, res) => {
  await db.collection('tasks').doc(req.params.id).delete()
  res.json({ id: req.params.id, deleted: true })
})

app.use((err, _req, res, _next) => {
  console.error('unhandled', err)
  res.status(500).json({ error: 'internal' })
})

export const api = onRequest(
  {
    region: 'europe-west1',
    secrets: [ACADEMY_JWT_SECRET, ACADEMY_API_KEY],
    cors: true,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  app,
)
