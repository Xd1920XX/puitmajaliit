// Seedi või uuenda tasks/vm-001 kirjet Firestore'is.
//
// Kasuta:
//   # Produktsioon (gcloud auth application-default login)
//   node scripts/seed-task.js
//
//   # Emulaator
//   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-task.js
//
// Vajalik: firebase-admin on juba `functions/node_modules` all.

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

function loadCredential() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (path) {
    const svc = JSON.parse(readFileSync(path, 'utf8'))
    return cert(svc)
  }
  return applicationDefault()
}

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID

initializeApp({
  credential: loadCredential(),
  projectId,
})
const db = getFirestore()

const TASK_ID = process.env.TASK_ID || 'vm-001'

const task = {
  title: 'Virtuaalne mudeldaja',
  description:
    'Ehita puitmaja alt üles — kuni 10 korrust. Vali igale korrusele õige karkass ja jäikusseinte naelutussamm. Mida optimaalsemad valikud, seda rohkem punkte.',
  image_url: '',
  is_active: true,
  sort_order: 1,
}

const ref = db.collection('tasks').doc(TASK_ID)
await ref.set(task, { merge: true })
console.log(`Seeded tasks/${TASK_ID}`)
process.exit(0)
