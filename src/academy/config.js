// Academy integration — frontend konfiguratsioon.
// Üks ülesanne MVP-s. Lisandumisel laienda TASKS massiiv.
export const TASK_ID = import.meta.env.VITE_TASK_ID || 'vm-001'

// Game API baas. Produktsioonis = https://<project>.cloudfunctions.net/api
// või Firebase Hosting rewrite (vt firebase.json → /api/**).
// Dev-is võib tühi olla kui Academyga ei ühenda — mäng töötab anonüümselt.
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

// Vaikimisi tagasilink Academy'sse, kui launch token return_url puudub.
export const DEFAULT_RETURN_URL = import.meta.env.VITE_ACADEMY_RETURN_URL || ''

// Launch token URL-parameetri nimi.
export const LAUNCH_PARAM = 'launch_token'
