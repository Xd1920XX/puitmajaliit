// Punktid + veakategooriad + lõppteavitused.
// Allikas: Puitmajaliit_reeglid_TAIS_DEMO.xlsx (lehed PUNKTID, TEAVITUSED, REEGLID).
//
// Põhimõtted:
//   - Igal korrusel kaks sõltumatut kategooriat: Karkass (max 10) + OSB (max 5).
//   - Max kokku 150 p (10 × 15).
//   - CLT valik: OSB etapp jäetakse vahele; OSB punktid tulevad automaatselt
//     (1.–4. k = 5 p, 5.–10. k = 0 p).
//   - Igale valikule määratud veakood + tõsidus (sheet "PUNKTID").
//   - Mängu lõpus: üks kõige kõrgema prioriteediga teavitus. Dubleerimist pole.
//   - Prioriteet (madalam = tähtsam): 1 KARKASS_EBAPIISAV, 2 OSB_EBAPIISAV,
//     3 KARKASS_LIIGNE / CLT_MITTEOPTIMAALNE, 4 OSB_LIIGNE, 5 kõik OK.
//   - Vigade korruste numbreid lõpus EI avaldata.
//
// Kõik Exceli väärtused on tabelites allpool — rakenduskoodi puudutamata saab
// konstruktori täpsustustega siin muuta nii punktid, veakoodid kui tekstid.

export const MAX_FLOOR_SCORE = 15
export const MAX_TOTAL_SCORE = 150

// Veakoodide register. Prioriteet null = eraldi teavitust ei genereerita.
export const ERROR_CODES = {
  OK:                   { priority: null },
  KARKASS_EBAPIISAV:    { priority: 1 },
  OSB_EBAPIISAV:        { priority: 2 },
  KARKASS_LIIGNE:       { priority: 3 },
  CLT_MITTEOPTIMAALNE:  { priority: 3 },
  OSB_LIIGNE:           { priority: 4 },
  OSB_PUNKTE_EI_ANTA:   { priority: null },
}

// Lühendid tabelites loetavuse huvides.
const KE = 'KARKASS_EBAPIISAV'
const KL = 'KARKASS_LIIGNE'
const OE = 'OSB_EBAPIISAV'
const OL = 'OSB_LIIGNE'
const OP = 'OSB_PUNKTE_EI_ANTA'
const CM = 'CLT_MITTEOPTIMAALNE'
const OK = 'OK'

// Karkassi tabel korruste kaupa. Võti = variantId (`KARKASS_VARIANTS.id`).
// Väärtus = { p: punktid, c: veakood }.
export const KARKASS_TABLE = {
  1:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:0,  c:KE}, CLT: {p:10, c:OK} },
  2:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:0,  c:KE}, CLT: {p:10, c:OK} },
  3:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:0,  c:KE}, CLT: {p:10, c:OK} },
  4:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:0,  c:KE}, CLT: {p:10, c:OK} },
  5:  { '300': {p:10, c:OK}, '400': {p:0,  c:KL}, '600': {p:0,  c:KL}, CLT: {p:0,  c:KL} },
  6:  { '300': {p:10, c:OK}, '400': {p:0,  c:KL}, '600': {p:0,  c:KL}, CLT: {p:0,  c:KL} },
  7:  { '300': {p:0,  c:KE}, '400': {p:10, c:OK}, '600': {p:0,  c:KL}, CLT: {p:0,  c:KL} },
  8:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:10, c:OK}, CLT: {p:0,  c:KL} },
  9:  { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:10, c:OK}, CLT: {p:0,  c:KL} },
  10: { '300': {p:0,  c:KE}, '400': {p:0,  c:KE}, '600': {p:10, c:OK}, CLT: {p:0,  c:KL} },
}

// OSB naelutussammu tabel. Võti = `JAIKUS_VARIANTS.id` (50/70/100) või
// 'CLT_AUTO' kui mängija valis CLT ja OSB etapp jäeti vahele.
export const OSB_TABLE = {
  1:  { '50': {p:0, c:OP}, '70': {p:0, c:OP}, '100': {p:0, c:OP}, CLT_AUTO: {p:5, c:OK} },
  2:  { '50': {p:0, c:OP}, '70': {p:0, c:OP}, '100': {p:0, c:OP}, CLT_AUTO: {p:5, c:OK} },
  3:  { '50': {p:0, c:OP}, '70': {p:0, c:OP}, '100': {p:0, c:OP}, CLT_AUTO: {p:5, c:OK} },
  4:  { '50': {p:0, c:OP}, '70': {p:0, c:OP}, '100': {p:0, c:OP}, CLT_AUTO: {p:5, c:OK} },
  5:  { '50': {p:5, c:OK}, '70': {p:0, c:OE}, '100': {p:0, c:OE}, CLT_AUTO: {p:0, c:CM} },
  6:  { '50': {p:0, c:OL}, '70': {p:5, c:OK}, '100': {p:0, c:OE}, CLT_AUTO: {p:0, c:CM} },
  7:  { '50': {p:0, c:OL}, '70': {p:5, c:OK}, '100': {p:0, c:OE}, CLT_AUTO: {p:0, c:CM} },
  8:  { '50': {p:0, c:OL}, '70': {p:0, c:OL}, '100': {p:5, c:OK}, CLT_AUTO: {p:0, c:CM} },
  9:  { '50': {p:0, c:OL}, '70': {p:0, c:OL}, '100': {p:5, c:OK}, CLT_AUTO: {p:0, c:CM} },
  10: { '50': {p:0, c:OL}, '70': {p:0, c:OL}, '100': {p:5, c:OK}, CLT_AUTO: {p:0, c:CM} },
}

// Lõppteavitused (Exceli leht "TEAVITUSED"). `priority` madalam = tähtsam.
// `triggerCodes` tühi + special M05 = ainult kui kõik täispunktid.
export const MESSAGES = {
  M01: {
    id: 'M01',
    priority: 1,
    triggerCodes: ['KARKASS_EBAPIISAV'],
    title: 'Kandekonstruktsioon vajab ülevaatamist',
    body:  'Valitud karkassilahendused ei vasta kõigis hoone osades simulaatori nõuetele. Mõnes kohas võib kandevõime olla ebapiisav. Mõtle läbi karkassi sobivus koormustele ja hoone kõrgusele.',
  },
  M02: {
    id: 'M02',
    priority: 2,
    triggerCodes: ['OSB_EBAPIISAV'],
    title: 'Hoone jäigastus vajab ülevaatamist',
    body:  'Mõne jäikusseina kinnitussamm võib olla liiga hõre. Ebapiisav jäigastus võib põhjustada hoone külgsuunalist deformeerumist. Kontrolli naelutussammu sobivust.',
  },
  M03: {
    id: 'M03',
    priority: 3,
    triggerCodes: ['KARKASS_LIIGNE', 'CLT_MITTEOPTIMAALNE'],
    title: 'Materjalikasutus ei ole optimaalne',
    body:  'Mõnes hoone osas on valitud simulaatori eesmärgiga võrreldes liiga materjalimahukas karkassilahendus. Kaalu sama ülesande täitmiseks säästlikumat varianti.',
  },
  M04: {
    id: 'M04',
    priority: 4,
    triggerCodes: ['OSB_LIIGNE'],
    title: 'Kinnitusi võib olla rohkem kui vaja',
    body:  'Mõnes jäikusseinas on valitud simulaatori optimaalsest lahendusest tihedam naelutussamm. Kontrolli, kas sobiva jäikuse saab tagada säästlikumalt.',
  },
  M05: {
    id: 'M05',
    priority: 5,
    triggerCodes: [],
    title: 'Lahendused vastavad ülesandele',
    body:  'Valisid kõigil korrustel simulaatori lähteülesande järgi optimaalsed karkassi- ja jäikusseinalahendused.',
  },
}

// Ühe korruse hindamine. Tagastab karkassi + OSB kirjed ja kogupunktid.
export function evaluateFloor(floor) {
  const empty = { karkass: {p:0, c:null}, osb: {p:0, c:null}, total: 0 }
  if (!floor || typeof floor.id !== 'number') return empty

  const karkassVariant = floor.karkass
  if (!karkassVariant) return empty

  const kEntry = KARKASS_TABLE[floor.id]?.[karkassVariant] ?? {p:0, c:null}

  let oEntry
  if (karkassVariant === 'CLT') {
    oEntry = OSB_TABLE[floor.id]?.CLT_AUTO ?? {p:0, c:null}
  } else if (floor.jaikus) {
    oEntry = OSB_TABLE[floor.id]?.[floor.jaikus] ?? {p:0, c:null}
  } else {
    // Puitkarkass valitud, OSB alles valimata — ei saa veel hinnata.
    oEntry = {p:0, c:null}
  }

  return { karkass: kEntry, osb: oEntry, total: kEntry.p + oEntry.p }
}

// Mängu lõpphindamine: punktid + üks (kõige tähtsam) teavitus.
export function evaluateGame(floors) {
  const perFloor = (floors || []).map(evaluateFloor)
  const total = perFloor.reduce((s, f) => s + f.total, 0)

  // Kogu kõigi korruste veakoodid (unikaalsed).
  const codes = new Set()
  for (const f of perFloor) {
    if (f.karkass.c) codes.add(f.karkass.c)
    if (f.osb.c)     codes.add(f.osb.c)
  }

  // Täispunktid + ainult OK koodid → positiivne teavitus.
  const nonTrivial = [...codes].filter((c) => c !== 'OK' && c !== 'OSB_PUNKTE_EI_ANTA')
  let message = null
  if (nonTrivial.length === 0 && total === MAX_TOTAL_SCORE) {
    message = MESSAGES.M05
  } else {
    // Prioriteedi järgi (madalam = tähtsam) esimene, mille trigger esineb.
    const ordered = Object.values(MESSAGES)
      .filter((m) => m.priority < 5)
      .sort((a, b) => a.priority - b.priority)
    for (const m of ordered) {
      if (m.triggerCodes.some((c) => codes.has(c))) {
        message = m
        break
      }
    }
  }

  return { total, perFloor, message }
}

// Taga-ühildumine: vana API endiselt eksporditud, et teised failid ei
// katkeks. Punktid tulevad uuest tabelist.
export function scoreFloor(floor) {
  const r = evaluateFloor(floor)
  return { karkass: r.karkass.p, osb: r.osb.p, total: r.total }
}
export function scoreAll(floors) {
  const perFloor = (floors || []).map(scoreFloor)
  const total = perFloor.reduce((s, p) => s + p.total, 0)
  return { perFloor, total }
}
