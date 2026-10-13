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
  { id: '300', label: 'Puitkarkass 300 mm', url: '/GLB/Karkass_300.glb' },
  { id: '400', label: 'Puitkarkass 400 mm', url: '/GLB/Karkass_400.glb' },
  { id: '600', label: 'Puitkarkass 600 mm', url: '/GLB/Karkass_600.glb' },
  { id: 'CLT', label: 'CLT paneel',         url: '/GLB/Karkass_CLT.glb' },
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
// `yOffset` optional (defaults to 0).
export const LAYERS = {
  jaikus:              { label: 'Jäikusseinad OSB',       url: '/GLB/Jaikusseinad_OSB.glb' },
  soojustus:           { label: 'Soojustusvill',          url: '/GLB/Soojustusvill.glb' },
  soojustus_vannituba: { label: 'Soojustus (vannituba)',  url: '/GLB/Soojustusvill_Vannituba.glb' },
  kips:                { label: 'Kips (2-kihiline)',      url: '/GLB/Kips_2kihiline.glb' },
  porand:              { label: 'Põrand',                 url: '/GLB/Porand.glb' },
  lagi:                { label: 'Lagi',                   url: '/GLB/Lagi.glb' },
  rodu:                { label: 'Rõdu',                   url: '/GLB/Rodu.glb' },
  fassaad:             { label: 'Fassaad',                url: '/GLB/Fassaad.glb' },
  katus:               { label: 'Katus',                  url: '/GLB/Katused.glb' },
}

// Sub-steps within a single floor. Linear gate — a required step blocks the
// next until done; optional steps can be skipped. Floor is "complete" when
// every non-optional step is done. Order follows construction sequence:
// floor slab first, frame + insulation + gypsum + facade in between, ceiling
// slab last (closes the floor), roof optional on top of all.
export const FLOOR_STEPS = [
  { id: 'porand',              label: 'Põrand',                kind: 'toggle',                              hint: 'Põrandakonstruktsioon — esimene samm korruse ehitamisel.' },
  { id: 'karkass',             label: 'Karkass',               kind: 'variant', variants: KARKASS_VARIANTS, hint: 'Vali kandev karkass — 300/400/600 mm või CLT.' },
  { id: 'jaikus',              label: 'Jäikusseinad OSB',      kind: 'toggle',                              hint: 'OSB jäikusseinad karkassi peale.' },
  { id: 'soojustus',           label: 'Soojustusvill',         kind: 'toggle',                              hint: 'Soojustusvill seintes.' },
  { id: 'soojustus_vannituba', label: 'Soojustus (vannituba)', kind: 'toggle',  optional: true,             hint: 'Täiendav vannitoa soojustus. Lisa vajadusel.' },
  { id: 'kips',                label: 'Kips',                  kind: 'toggle',                              hint: 'Sisemine 2-kihiline kipsplaat.' },
  { id: 'rodu',                label: 'Rõdu',                  kind: 'toggle',  optional: true,             hint: 'Rõdu konstruktsioon. Lisa soovi korral.' },
  { id: 'fassaad',             label: 'Fassaad',               kind: 'toggle',                              hint: 'Välimine fassaadikate.' },
  { id: 'lagi',                label: 'Lagi',                  kind: 'toggle',                              hint: 'Laekonstruktsioon — sulgeb korruse.' },
  { id: 'katus',               label: 'Katus',                 kind: 'toggle',  optional: true,             hint: 'Katusekate — tavaliselt ülemisel korrusel.' },
]
