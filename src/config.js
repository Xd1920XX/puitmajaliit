// Available game modes. User picks one on the GameSelect screen before
// building. `timeLimitMs: null` = untimed (counts up). Numeric = countdown;
// auto-submit when it hits zero.
export const GAMES = [
  {
    id: 'vm-001',
    title: 'Mäng 1',
    short: 'Mäng 1 · ajaga',
    description:
      'Ehita etteantud aja jooksul tugevate tormituulte eest kaitstud piirkonda optimaalse konstruktsioonilahendusega 10-korruseline hoone.',
    scoring:
      'Võidab see, kes saab etteantud ajaraamis rohkem punkte. Võrdse punktiarvu korral võidab lühema ajaga lahendaja.',
    timeLimitMs: 10 * 60 * 1000,
  },
  {
    id: 'vm-002',
    title: 'Mäng 2',
    short: 'Mäng 2 · ilma ajata',
    description:
      'Ehita tugevate tormituulte eest kaitstud piirkonda optimaalseima konstruktsioonilahendusega 10-korruseline hoone.',
    scoring:
      'Oluline on saada maksimaalne arv punkte. Võidab see, kes selle saavutab kiireima ajaga.',
    timeLimitMs: null,
  },
]

export function gameById(id) {
  return GAMES.find((g) => g.id === id) ?? null
}

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

// Kips — layer-count variants. Each has its own GLB (visible layer stack).
// Points: no points for kips per excel, but under-dim (wrong layer count
// for floor) zeroes the whole score.
export const KIPS_VARIANTS = [
  { id: '1', label: '1-kihiline kips', url: '/GLB/Kips_1_kiht.glb' },
  { id: '2', label: '2-kihiline kips', url: '/GLB/Kips_2_kiht.glb' },
  { id: '3', label: '3-kihiline kips', url: '/GLB/Kips_3_kiht.glb' },
]

// Fassaadi viimistluse variandid — building-level choice (one per build,
// not per floor). Each variant carries 4 URLs: facade wall(s), stairwell
// 1K segment, stairwell 2K segment, roof. Variant C ships wall as two
// GLBs (ground + upper) — all others use a single `wall` URL for every
// storey.
//
// User picks one on first use of the Fassaad step, then it locks for the
// rest of the build (swap requires explicit reset in Sidebar).
export const FASSAAD_VARIANTS = [
  {
    id: 'A',
    label: 'Viimistlus A',
    wall:         '/GLB/Fassaadi_viimistlus_A.glb',
    trepikoda1K:  '/GLB/Trepikoda_1K_Viimistlus_A.glb',
    trepikoda2K:  '/GLB/Trepikoda_2K_Viimistlus_A.glb',
    katus:        '/GLB/Katused_Viimistlus_A.glb',
  },
  {
    id: 'B',
    label: 'Viimistlus B',
    wall:         '/GLB/Fassaadi_viimistlus_B.glb',
    trepikoda1K:  '/GLB/Trepikoda_1K_Viimistlus_B.glb',
    trepikoda2K:  '/GLB/Trepikoda_2K_Viimistlus_B.glb',
    katus:        '/GLB/Katused_Viimistlus_B.glb',
  },
  {
    id: 'C',
    label: 'Viimistlus C',
    // C has separate ground + upper facade walls.
    wall1K:       '/GLB/Fassaadi_viimistlus_C_1K.glb',
    wall2K:       '/GLB/Fassaadi_viimistlus_C_2K.glb',
    trepikoda1K:  '/GLB/Trepikoda_1K_Viimistlus_C.glb',
    trepikoda2K:  '/GLB/Trepikoda_2K_Viimistlus_C.glb',
    katus:        '/GLB/Katused_Viimistlus_C.glb',
  },
]

export function fassaadVariantById(id) {
  return FASSAAD_VARIANTS.find((v) => v.id === id) ?? null
}

// Resolve the correct wall URL for a given floor index (0-based).
// Variant C has 1K/2K+ split, others use the same `wall` on every floor.
export function fassaadWallUrl(variant, floorIndex) {
  if (!variant) return null
  if (variant.wall) return variant.wall
  return floorIndex === 0 ? variant.wall1K : variant.wall2K
}

// Trepikoda — per-floor stairwell segments. URL resolves from the chosen
// fassaad variant; this map keeps the per-segment `yOffset` quirk (upper's
// geometry sits one floor-height above its local origin, so group is
// nudged down).
export const TREPIKODA_OFFSETS = {
  ground: 0,
  upper:  -FLOOR_HEIGHT,
}

// Toggleable layers within a floor. Key = state field on Floor object.
// `yOffset` optional (defaults to 0). Variant-kind steps (karkass, jaikus,
// kips) list their URLs in their variants array, not here.
// Layers whose GLB is picked by external state (soojustus → karkass,
// fassaad/katus → fassaadVariant) have no `url` here and are rendered via
// dedicated code paths in HouseViewer.
export const LAYERS = {
  porand: { label: 'Põrand', url: '/GLB/Porand.glb' },
  lagi:   { label: 'Lagi',   url: '/GLB/Lagi.glb' },
  rodu:   { label: 'Rõdu',   url: '/GLB/Rodu.glb' },
  // Facade + roof render from the chosen FASSAAD_VARIANTS — no direct URL.
  fassaad: { label: 'Fassaad' },
  katus:   { label: 'Katus' },
}

// Composite soojustus render — one toggle lights up the full insulation
// package: interior wall wool (puitkarkass only) + bathroom wool +
// exterior facade insulation (always, independent of karkass).
export const SOOJUSTUS_URLS = {
  wall:    '/GLB/Soojustusvill.glb',
  bath:    '/GLB/Soojustusvill_Vannituba.glb',
  fassaad: '/GLB/Fassaadi_isolatsioon.glb',
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
  { id: 'kips',                label: 'Kipsplaadid',           kind: 'variant', variants: KIPS_VARIANTS,                                           hint: 'Vali kipsi kihtide arv' },
  { id: 'fassaad',             label: 'Fassaad',               kind: 'toggle',                                                                     hint: 'Välifassaad' },
  { id: 'trepikoda',           label: 'Trepikoda',             kind: 'toggle',                                                                     hint: 'Lisa trepikoda' },
  { id: 'rodu',                label: 'Rõdu',                  kind: 'toggle',  optional: true,                                                    hint: 'Lisa rõdu' },
  { id: 'lagi',                label: 'Lagi',                  kind: 'toggle',                                                                     hint: 'Laekonstruktsioon' },
  { id: 'katus',               label: 'Katus',                 kind: 'toggle',  optional: true,                                                    hint: 'Katust saab lisada viimase korrusega' },
]
