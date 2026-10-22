// Testimiseks: mint lühiealine Academy launch token. Academy-poolel tehakse
// sama asja produktsioonis.
//
// Kasuta:
//   ACADEMY_JWT_SECRET=... node scripts/mint-launch-token.js student@example.com "Mari Mets"
//
// Prindib täieliku URL-i, mida saad brauseris avada:
//   http://localhost:5174/?launch_token=<jwt>

import jwt from 'jsonwebtoken'

const [, , emailArg, nameArg, returnUrlArg] = process.argv

const email = emailArg || 'student@example.com'
const name = nameArg || 'Mari Mets'
const return_url = returnUrlArg || 'https://academy.woodhouse.ee/mang/projekteeri'
const secret = process.env.ACADEMY_JWT_SECRET
if (!secret) {
  console.error('ACADEMY_JWT_SECRET env puudu')
  process.exit(1)
}

const now = Math.floor(Date.now() / 1000)
const token = jwt.sign(
  {
    email,
    name,
    return_url,
    iat: now,
    exp: now + 15 * 60,
  },
  secret,
  {
    algorithm: 'HS256',
    issuer: 'woodhouse-academy',
    audience: 'virtuaalne-mudeldaja',
  },
)

const base = process.env.GAME_URL || 'http://localhost:5174'
const sep = base.includes('?') ? '&' : '?'
console.log(`${base}${sep}launch_token=${token}`)
