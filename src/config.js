// Building capacity. User may stop earlier.
export const MAX_FLOORS = 10

// Vertical stacking offset per floor.
export const FLOOR_HEIGHT = 3.0

// Baseline site models — always visible, sit below floor 1.
// Underground parking + ground surface + ground-level balcony/landscaping.
export const BASELINE_URLS = [
  '/GLB/Parkla.glb',
  '/GLB/Maapind_Parkla.glb',
  '/GLB/Rodu_Maapinnal.glb',
]

// Karkass variants. Each floor picks one. `yOffset` adjusts the model's
// vertical placement relative to its floor group (defaults to 0).
export const KARKASS_VARIANTS = [
  { id: '600', label: 'Puitkarkass 600 mm', url: '/GLB/Karkass_600.glb' },
  { id: '400', label: 'Puitkarkass 400 mm', url: '/GLB/Karkass_400.glb' },
  { id: '300', label: 'Puitkarkass 300 mm', url: '/GLB/Karkass_300.glb' },
  { id: 'CLT', label: 'CLT paneel',         url: '/GLB/Karkass_CLT.glb' },
]

// Jäikusseinad OSB — naelutussamm variants. Only available for timber
// frames (300/400/600). CLT panels don't need separate stiffening.
export const JAIKUS_VARIANTS = [
  { id: '50',  label: 'Naelutussamm 50 mm',  url: '/GLB/Jaikusseinad_OSB.glb' },
  { id: '70',  label: 'Naelutussamm 70 mm',  url: '/GLB/Jaikusseinad_OSB.glb' },
  { id: '100', label: 'Naelutussamm 100 mm', url: '/GLB/Jaikusseinad_OSB.glb' },
]

// Trepikoda — automatic per-floor stairwell segments.
// `ground` lands on floor 1; `upper` repeats for floors 2..N.
// `yOffset` compensates for GLB-origin quirks (upper's geometry sits one
// floor-height above its local origin, so group is nudged down).
export const TREPIKODA_SEGMENTS = {
  ground: { url: '/GLB/Trepikoda_1K.glb', yOffset: 0 },
  upper:  { url: '/GLB/Trepikoda_2K.glb', yOffset: -FLOOR_HEIGHT },
}

// Toggleable layers within a floor. Key = state field on Floor object.
// `yOffset` optional (defaults to 0). Variant-kind steps (karkass, jaikus)
// list their URLs in their variants array, not here.
// `soojustus` is handled externally in HouseViewer because it renders a
// different combination of GLBs based on karkass choice — see SOOJUSTUS_URLS.
export const LAYERS = {
  kips:                { label: 'Kipsplaadid',            url: '/GLB/Kips_2kihiline.glb' },
  porand:              { label: 'Põrand',                 url: '/GLB/Porand.glb' },
  lagi:                { label: 'Lagi',                   url: '/GLB/Lagi.glb' },
  rodu:                { label: 'Rõdu',                   url: '/GLB/Rodu.glb' },
  fassaad:             { label: 'Fassaad',                url: '/GLB/Fassaad.glb' },
  katus:               { label: 'Katus',                  url: '/GLB/Katused.glb' },
}

// Composite soojustus render — one toggle, picks the right wool mix:
//   puitkarkass → wall wool + bathroom wool together
//   CLT         → bathroom wool only
export const SOOJUSTUS_URLS = {
  wall: '/GLB/Soojustusvill.glb',
  bath: '/GLB/Soojustusvill_Vannituba.glb',
}

// Sub-steps within a single floor. Linear gate — a required step blocks the
// next until done; optional steps can be skipped. Floor is "complete" when
// every non-optional step is done. Order follows construction sequence:
// floor slab first, frame + insulation + gypsum + facade in between, ceiling
// slab last (closes the floor), roof optional on top of all.
//
// `hideWhenCollapsed: true` marks a layer as internal/structural — hidden
// from the viewer once the floor is complete AND the user has moved on to
// another floor, so lower storeys don't carry heavy frame/insulation GLBs
// behind the façade. Visible exterior layers (facade, balcony, roof) stay.
export const FLOOR_STEPS = [
  { id: 'porand',              label: 'Põrand',                kind: 'toggle',                                                                     hint: 'Põrandakonstruktsioon' },
  { id: 'karkass',             label: 'Konstruktsioon',        kind: 'variant', variants: KARKASS_VARIANTS, hideWhenAboveComplete: true,           hint: 'Vali kandev konstruktsioon' },
  { id: 'jaikus',              label: 'Jäikusseinad OSB',      kind: 'variant', variants: JAIKUS_VARIANTS,  skipWhenVariant: { karkass: ['CLT'] }, hint: 'OSB jäikusseinad' },
  { id: 'soojustus',           label: 'Isolatsioon',           kind: 'toggle',                                                                     hint: 'Soojus- ja akustiline isolatsioon' },
  { id: 'kips',                label: 'Kipsplaadid',           kind: 'toggle',                                                                     hint: 'Kipsplaadid 1, 2 või 3 kihis' },
  { id: 'fassaad',             label: 'Fassaad',               kind: 'toggle',                                                                     hint: 'Välifassaad' },
  { id: 'trepikoda',           label: 'Trepikoda',             kind: 'toggle',                                                                     hint: 'Lisa trepikoda' },
  { id: 'rodu',                label: 'Rõdu',                  kind: 'toggle',  optional: true,                                                    hint: 'Lisa rõdu' },
  { id: 'lagi',                label: 'Lagi',                  kind: 'toggle',                                                                     hint: 'Laekonstruktsioon' },
  { id: 'katus',               label: 'Katus',                 kind: 'toggle',  optional: true,                                                    hint: 'Katust saab lisada viimase korrusega' },
]
