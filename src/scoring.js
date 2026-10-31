// Punktid + kategooriad + lõppteavitused.
// Allikas: docs/Puitmajaliit_valikute_selgitused_v3.xlsx + konstruktori reeglid.
//
// Põhimõtted:
//   - Igal korrusel kolm kategooriat: karkass, OSB (jäikus), kips.
//   - Iga valik klassifitseeritakse: 'correct' | 'over' | 'under' | 'na' | 'missing'.
//   - Punktid: karkass correct=10, over=5; OSB correct=5, over=2; kips 0 p.
//     under = 0 p ja korrutab terve mängu kogupunktid 0-ga läbi.
//   - CLT valik 1.–4. korrusel annab OSB auto-punktid (5 p), eraldi OSB ei valita.
//   - Täispunktid = 150 (10 × (10 + 5)). Kips ei anna punkte, aga vale kips võib
//     terve ehitise null-i viia.
//   - Mängu lõpus: null-skoori korral alati sama hoiatus. Muidu kõige tähtsam
//     mittepositiivne teavitus või positiivne kinnitus.

export const KARKASS_POINTS = { correct: 10, over: 5, under: 0 }
export const OSB_POINTS     = { correct: 5,  over: 2, under: 0 }
export const KIPS_POINTS    = { correct: 0,  over: 0, under: 0 }
export const CLT_OSB_AUTO_POINTS = 5

export const MAX_FLOOR_SCORE = KARKASS_POINTS.correct + OSB_POINTS.correct
export const MAX_TOTAL_SCORE  = MAX_FLOOR_SCORE * 10

// Per-floor "õige" valikud. Iga ülejäänud variant klassifitseeritakse
// classifyKarkass / classifyOsb / classifyKips järgi.
const CORRECT_KARKASS = {
  1: 'CLT', 2: 'CLT', 3: 'CLT', 4: 'CLT',
  5: '300', 6: '300', 7: '400', 8: '600', 9: '600', 10: '600',
}
// Floor 1–4: CLT korruste puhul OSB-d eraldi ei valita (auto).
// Floor 5–10: valitav naelutussamm.
const CORRECT_OSB = {
  5: '50', 6: '70', 7: '70', 8: '100', 9: '100', 10: '100',
}
const CORRECT_KIPS = {
  1: '2', 2: '2', 3: '2', 4: '2',
  5: '3', 6: '3', 7: '3', 8: '3', 9: '3', 10: '3',
}

// Puitkarkassi sammu suuruse järjekord — väiksem = tihedam post = tugevam.
// (Kui "õige" on 400, siis 300 = üle, 600 = ala.) CLT käsitletakse eraldi.
const KARKASS_ORDER = ['300', '400', '600']
const OSB_ORDER     = ['50', '70', '100']   // väiksem samm = tihedam = tugevam
const KIPS_ORDER    = ['1', '2', '3']        // suurem kihtide arv = tugevam tulekindlus

function compareIndex(variant, correct, order) {
  const vi = order.indexOf(variant)
  const ci = order.indexOf(correct)
  if (vi < 0 || ci < 0) return null
  return vi - ci // negative = stronger (over), positive = weaker (under)
}

export function classifyKarkass(floorId, variant) {
  if (!variant) return 'missing'
  const correct = CORRECT_KARKASS[floorId]
  if (!correct) return 'na'
  if (variant === correct) return 'correct'

  // CLT valik korrustel 5–10: üledimensioneeritud (massiivpaneel ülemisel).
  if (variant === 'CLT') return 'over'
  // Correct on CLT (korrused 1–4), aga valitud puitkarkass → aladim.
  if (correct === 'CLT') return 'under'

  const diff = compareIndex(variant, correct, KARKASS_ORDER)
  if (diff === null) return 'na'
  return diff < 0 ? 'over' : 'under'
}

export function classifyOsb(floorId, variant, karkassVariant) {
  // Floor 1–4 + CLT: ei valita, auto-korrektne.
  if (floorId <= 4) {
    if (karkassVariant === 'CLT') return 'auto'
    // Puitkarkass 1.–4. korrusel = juba karkass under; OSB ei ole kriitiline.
    // Käsitle siiski — kui user valis naelutussammu, 50mm = tugevam.
    if (!variant) return 'missing'
    return 'na'
  }
  // Floor 5–10:
  if (karkassVariant === 'CLT') {
    // CLT ülemisel korrusel → karkass loeb üledimineerituks; OSB pole asjakohane.
    return 'na'
  }
  if (!variant) return 'missing'
  const correct = CORRECT_OSB[floorId]
  if (!correct) return 'na'
  if (variant === correct) return 'correct'
  const diff = compareIndex(variant, correct, OSB_ORDER)
  if (diff === null) return 'na'
  return diff < 0 ? 'over' : 'under'
}

export function classifyKips(floorId, variant) {
  if (!variant) return 'missing'
  const correct = CORRECT_KIPS[floorId]
  if (!correct) return 'na'
  if (variant === correct) return 'correct'
  const diff = compareIndex(variant, correct, KIPS_ORDER)
  if (diff === null) return 'na'
  return diff < 0 ? 'under' : 'over'
}

function pointsFor(category, cls) {
  if (cls === 'correct') return category.correct
  if (cls === 'over')    return category.over
  if (cls === 'under')   return category.under
  return 0
}

// Ühe korruse hindamine. Tagastab klassifikatsioonid + raw punktid.
// `rawTotal` on enne under-dim-null-multiplier'i rakendamist.
export function evaluateFloor(floor) {
  if (!floor || typeof floor.id !== 'number') {
    return {
      karkass: { cls: 'missing', points: 0 },
      osb:     { cls: 'missing', points: 0 },
      kips:    { cls: 'missing', points: 0 },
      rawTotal: 0,
    }
  }

  const kCls = classifyKarkass(floor.id, floor.karkass)
  const oCls = classifyOsb(floor.id, floor.jaikus, floor.karkass)
  const kipsCls = classifyKips(floor.id, floor.kips)

  const kPts = pointsFor(KARKASS_POINTS, kCls)
  const oPts = oCls === 'auto' ? CLT_OSB_AUTO_POINTS : pointsFor(OSB_POINTS, oCls)
  const kipsPts = pointsFor(KIPS_POINTS, kipsCls)

  return {
    karkass: { cls: kCls, points: kPts },
    osb:     { cls: oCls, points: oPts },
    kips:    { cls: kipsCls, points: kipsPts },
    rawTotal: kPts + oPts + kipsPts,
  }
}

export const NULL_SCORE_MESSAGE = {
  id: 'NULL',
  title: 'Konstruktsiooni kandevõime ei ole tagatud',
  body: 'Konstruktsiooni kandevõime/stabiilsus ei ole tagatud. Mõtle läbi karkassi ja jäigastuse sobivus koormustele.',
}

export const PERFECT_MESSAGE = {
  id: 'OK',
  title: 'Lahendused vastavad ülesandele',
  body: 'Valisid kõigil korrustel optimaalsed karkassi-, jäikus- ja kipslahendused.',
}

export const OVER_MESSAGE = {
  id: 'OVER',
  title: 'Materjalikasutus ei ole optimaalne',
  body: 'Mõnes hoone osas on valitud lähteülesande järgi liiga materjalimahukas lahendus. Kaalu säästlikumat varianti.',
}

// Mängu lõpphindamine. Tagastab:
//   - total: lõplik skoor (×0 kui kuskil aladim)
//   - rawTotal: toorpunktid enne multiplierit
//   - zeroed: boolean, kas aladim multiplier rakendati
//   - perFloor: iga korruse evaluateFloor tulemus
//   - message: üks lõpp-teavitus
export function evaluateGame(floors) {
  const perFloor = (floors || []).map(evaluateFloor)
  const rawTotal = perFloor.reduce((s, f) => s + f.rawTotal, 0)

  const hasUnder = perFloor.some(
    (f) => f.karkass.cls === 'under' || f.osb.cls === 'under' || f.kips.cls === 'under',
  )
  const total = hasUnder ? 0 : rawTotal

  let message = null
  if (hasUnder) {
    message = NULL_SCORE_MESSAGE
  } else if (rawTotal === MAX_TOTAL_SCORE) {
    message = PERFECT_MESSAGE
  } else {
    const hasOver = perFloor.some(
      (f) => f.karkass.cls === 'over' || f.osb.cls === 'over' || f.kips.cls === 'over',
    )
    if (hasOver) message = OVER_MESSAGE
  }

  return { total, rawTotal, zeroed: hasUnder, perFloor, message }
}

// Vana API — mõned komponendid võivad kutsuda. Hoia alles minimaalne shim.
export function scoreFloor(floor) {
  const r = evaluateFloor(floor)
  return {
    karkass: r.karkass.points,
    osb: r.osb.points,
    kips: r.kips.points,
    total: r.rawTotal,
  }
}

