// Punktiarvestus. Allikas: Puitmajaliit_punktisusteem.xlsx.
//
// Mudel:
//   - Igal korrusel on kaks sõltumatut punktikomponenti: karkass (max 10) ja
//     OSB (max 5). Max 15 punkti korrus, max 150 punkti kogu mäng.
//   - Karkassi variant annab punkte ainult siis, kui see langeb kokku
//     konkreetse korruse õige variandiga (KARKASS_POINTS tabel).
//   - OSB naelutussammu punkte antakse ainult puitkarkassi (300/400/600)
//     puhul, JAIKUS_POINTS tabeli järgi. CLT puhul OSB sammu ei valita —
//     punktid tulevad automaatselt CLT_AUTO_OSB_POINTS tabelist (1.–4. k = 5p,
//     5.–10. k = 0p).
//   - Karkassi ja OSB punktid on sõltumatud (R01): vale karkass ei nulli
//     õiget OSB-d ja vastupidi.
//   - 6. korruse erand (R06): nii 50 kui 70 mm annavad 5p.
//   - Ülejäänud ehitusetapid (põrand, soojustusvill, kips, fassaad,
//     trepikoda, rõdu, lagi, katus) ei anna punkte (R07).
//
// Tabelid on allpool eraldi hoitud, et Exceli väärtuste muutmine oleks üks
// lokaalne muudatus. Võti = korruse id (1..10), väärtus = { variantId: p }.

export const MAX_FLOOR_SCORE = 15
export const MAX_TOTAL_SCORE = 150

// Karkassi õiged valikud korruste kaupa (veerud B/C/D/E Exceli lehel 1).
export const KARKASS_POINTS = {
  1:  { '300': 0, '400': 0, '600': 0, CLT: 10 },
  2:  { '300': 0, '400': 0, '600': 0, CLT: 10 },
  3:  { '300': 0, '400': 0, '600': 0, CLT: 10 },
  4:  { '300': 0, '400': 0, '600': 0, CLT: 10 },
  5:  { '300': 10, '400': 0, '600': 0, CLT: 0 },
  6:  { '300': 10, '400': 0, '600': 0, CLT: 0 },
  7:  { '300': 0, '400': 10, '600': 0, CLT: 0 },
  8:  { '300': 0, '400': 0, '600': 10, CLT: 0 },
  9:  { '300': 0, '400': 0, '600': 10, CLT: 0 },
  10: { '300': 0, '400': 0, '600': 10, CLT: 0 },
}

// OSB naelutussammu õiged valikud puitkarkassi korral (veerud F/G/H).
// 6. korruse erand (R06): nii 50 mm kui 70 mm annavad 5 punkti.
export const JAIKUS_POINTS = {
  1:  { '50': 0, '70': 0, '100': 0 },
  2:  { '50': 0, '70': 0, '100': 0 },
  3:  { '50': 0, '70': 0, '100': 0 },
  4:  { '50': 0, '70': 0, '100': 0 },
  5:  { '50': 5, '70': 0, '100': 0 },
  6:  { '50': 5, '70': 5, '100': 0 },
  7:  { '50': 0, '70': 5, '100': 0 },
  8:  { '50': 0, '70': 0, '100': 5 },
  9:  { '50': 0, '70': 0, '100': 5 },
  10: { '50': 0, '70': 0, '100': 5 },
}

// CLT korral OSB automaatpunktid korruse kaupa (veerg K).
export const CLT_AUTO_OSB_POINTS = {
  1: 5, 2: 5, 3: 5, 4: 5,
  5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
}

// Ühe korruse punktid. Tagastab lahtikäivatise, et UI saaks hiljem näidata
// kummagi komponendi eraldi.
export function scoreFloor(floor) {
  const empty = { karkass: 0, osb: 0, total: 0 }
  if (!floor || typeof floor.id !== 'number') return empty

  const karkassVariant = floor.karkass
  const karkassPts = karkassVariant
    ? (KARKASS_POINTS[floor.id]?.[karkassVariant] ?? 0)
    : 0

  let osbPts = 0
  if (karkassVariant === 'CLT') {
    // CLT: OSB sammu ei valita, automaatpunktid korruse järgi.
    osbPts = CLT_AUTO_OSB_POINTS[floor.id] ?? 0
  } else if (karkassVariant && floor.jaikus) {
    // Puitkarkass + valitud OSB samm.
    osbPts = JAIKUS_POINTS[floor.id]?.[floor.jaikus] ?? 0
  }

  return { karkass: karkassPts, osb: osbPts, total: karkassPts + osbPts }
}

// Kõigi korruste punktid + kogusumma.
export function scoreAll(floors) {
  const perFloor = (floors || []).map(scoreFloor)
  const total = perFloor.reduce((sum, p) => sum + p.total, 0)
  return { perFloor, total }
}
