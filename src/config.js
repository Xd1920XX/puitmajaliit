// Base site model — always visible, sits below floor 1.
export const PARKLA_URL = '/GLB/Parkla.glb'

// Karkass variants. Each floor picks one; different floors can pick different
// variants (per-floor selection, not building-wide).
export const KARKASS_VARIANTS = [
  { id: '300', label: 'Puitkarkass 300 mm', url: '/GLB/Karkass_300.glb' },
  { id: '400', label: 'Puitkarkass 400 mm', url: '/GLB/Karkass_400.glb' },
  { id: '600', label: 'Puitkarkass 600 mm', url: '/GLB/Karkass_600.glb' },
  { id: 'CLT',  label: 'CLT paneel',        url: '/GLB/Karkass_CLT.glb' },
]

// Toggleable layers within a floor.
export const LAYERS = {
  horisontaal: { label: 'Vahelaed',           url: '/GLB/Horisontaalkonst.glb' },
  kips:        { label: 'Kips (2-kihiline)',  url: '/GLB/Kips_2kihiline.glb' },
  fassaad:     { label: 'Fassaad',            url: '/GLB/Fassaad.glb' },
}

// Sub-steps within a single floor. Each floor cycles through this sequence.
// Order defines the linear gate: karkass → kips → vahelaed → fassaad.
// Kips before vahelaed so the interior gypsum stays visible before the ceiling
// slab covers it.
export const FLOOR_STEPS = [
  { id: 'karkass',     label: 'Karkass',     kind: 'variant', hint: 'Vali kandev karkass — 300/400/600 mm või CLT.' },
  { id: 'kips',        label: 'Kips',        kind: 'toggle',  hint: 'Sisemine 2-kihiline kipsplaat.' },
  { id: 'horisontaal', label: 'Vahelaed',    kind: 'toggle',  hint: 'Horisontaalkonstruktsioon kipsi peale.' },
  { id: 'fassaad',     label: 'Fassaad',     kind: 'toggle',  hint: 'Välimine fassaadikate.' },
]

// Building capacity. User may stop earlier — nothing forces reaching 10.
export const MAX_FLOORS = 10

// Vertical stacking offset per floor. Assumes each floor GLB spans Y = 0..3m
// with origin at its base. If real models differ, adjust here (or per-model
// offset in HouseViewer).
export const FLOOR_HEIGHT = 3.0
