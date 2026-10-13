import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Grid,
  useProgress,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  BASELINE_URLS,
  FLOOR_STEPS,
  LAYERS,
  FLOOR_HEIGHT,
  MAX_FLOORS,
  TREPIKODA_GROUND_URL,
  TREPIKODA_UPPER_URL,
} from './config.js'

const VARIANT_STEPS = FLOOR_STEPS.filter((s) => s.kind === 'variant')
const TOGGLE_STEPS = FLOOR_STEPS.filter((s) => s.kind === 'toggle')

const configuredScenes = new WeakSet()
function configureScene(scene) {
  if (configuredScenes.has(scene)) return
  scene.traverse((o) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    mats.forEach((m) => {
      if ('envMapIntensity' in m) m.envMapIntensity = 0
      ;['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((k) => {
        const t = m[k]
        if (t) t.anisotropy = 4
      })
    })
  })
  configuredScenes.add(scene)
}

function Model({ url }) {
  const { scene } = useGLTF(url)
  configureScene(scene)
  const cloned = useMemo(() => scene.clone(true), [scene])
  return <primitive object={cloned} />
}

function variantUrl(step, floor) {
  const id = floor[step.id]
  if (!id) return null
  return step.variants.find((v) => v.id === id)?.url ?? null
}

function isFloorStarted(floor) {
  return FLOOR_STEPS.some((s) =>
    s.kind === 'variant' ? floor[s.id] !== null : floor[s.id] === true,
  )
}

function Floor({ index, floor }) {
  const isGround = index === 0
  const trepikodaUrl = isGround ? TREPIKODA_GROUND_URL : TREPIKODA_UPPER_URL
  // The 2K GLB's geometry sits one floor-height above its local origin,
  // so for upper floors we offset the trepikoda group down by FLOOR_HEIGHT
  // to make the stairwell land on this floor rather than the next one up.
  const trepikodaOffsetY = isGround ? 0 : -FLOOR_HEIGHT
  return (
    <group position={[0, index * FLOOR_HEIGHT, 0]}>
      {isFloorStarted(floor) && (
        <group position={[0, trepikodaOffsetY, 0]}>
          <Model url={trepikodaUrl} />
        </group>
      )}
      {VARIANT_STEPS.map((step) => {
        const url = variantUrl(step, floor)
        return url ? <Model key={step.id} url={url} /> : null
      })}
      {TOGGLE_STEPS.map((step) =>
        floor[step.id] ? <Model key={step.id} url={LAYERS[step.id].url} /> : null,
      )}
    </group>
  )
}

function House({ floors }) {
  return (
    <>
      {BASELINE_URLS.map((url) => (
        <Model key={url} url={url} />
      ))}
      {floors.map((f, i) => (
        <Floor key={f.id} index={i} floor={f} />
      ))}
    </>
  )
}

function CameraGrabber({ cameraRef, invalidateRef, onAzimuth }) {
  const { camera, invalidate } = useThree()
  cameraRef.current = camera
  invalidateRef.current = invalidate
  useFrame(() => {
    if (!onAzimuth) return
    const az = Math.atan2(camera.position.x, camera.position.z)
    onAzimuth(az)
  })
  return null
}

function isFloorComplete(floor) {
  return FLOOR_STEPS.every((s) => {
    if (s.optional) return true
    return s.kind === 'variant' ? floor[s.id] !== null : floor[s.id] === true
  })
}

export default function HouseViewer({ floors }) {
  const controls = useRef(null)
  const cameraRef = useRef(null)
  const invalidateRef = useRef(null)
  const [azimuth, setAzimuth] = useState(0)
  const [gridOn, setGridOn] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const initialCamPos = useMemo(() => [30, 22, 42], [])
  const builtCount = floors.filter(isFloorComplete).length
  const targetY = (MAX_FLOORS * FLOOR_HEIGHT) / 2.6

  const withRig = (fn) => () => {
    const c = controls.current
    const cam = cameraRef.current
    if (!c || !cam) return
    fn(c, cam)
    c.update()
    invalidateRef.current?.()
  }

  const panY = (delta) => withRig((c, cam) => {
    c.target.y += delta
    cam.position.y += delta
  })
  const dolly = (factor) => withRig((c, cam) => {
    const offset = cam.position.clone().sub(c.target).multiplyScalar(factor)
    const next = offset.length()
    if (next < 8 || next > 120) return
    cam.position.copy(c.target).add(offset)
  })
  const orbit = (deltaAz) => withRig((c, cam) => {
    const offset = cam.position.clone().sub(c.target)
    const r = Math.hypot(offset.x, offset.z)
    const a = Math.atan2(offset.x, offset.z) + deltaAz
    cam.position.x = c.target.x + Math.sin(a) * r
    cam.position.z = c.target.z + Math.cos(a) * r
  })
  const view = (preset) => withRig((c, cam) => {
    const d = 45
    if (preset === 'ees') cam.position.set(0, targetY, d)
    else if (preset === 'kylg') cam.position.set(d, targetY, 0)
    else if (preset === 'ylalt') cam.position.set(0, d + targetY, 0.01)
    else if (preset === 'iso') cam.position.set(30, 22, 42)
    c.target.set(0, targetY, 0)
  })
  const reset = withRig((c, cam) => {
    cam.position.set(...initialCamPos)
    c.target.set(0, targetY, 0)
  })

  return (
    <div className="viewer">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: initialCamPos, fov: 40, near: 0.1, far: 500 }}
      >
        <color attach="background" args={['#fff9e8']} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={['#ffffff', '#d8d0b8', 0.8]} />
        <directionalLight position={[20, 36, 14]} intensity={1.6} />
        <directionalLight position={[-18, 20, -14]} intensity={0.5} />
        <Suspense fallback={null}>
          <House floors={floors} />
        </Suspense>
        {gridOn && (
          <Grid
            args={[80, 80]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#b8ad8a"
            sectionSize={5}
            sectionThickness={1.1}
            sectionColor="#6b7a55"
            fadeDistance={90}
            fadeStrength={1.4}
            infiniteGrid
            position={[0, 0.002, 0]}
          />
        )}
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan
          screenSpacePanning
          target={[0, targetY, 0]}
          minDistance={8}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.05}
        />
        <CameraGrabber cameraRef={cameraRef} invalidateRef={invalidateRef} onAzimuth={setAzimuth} />
      </Canvas>

      <div className="viewer-hud" aria-hidden>
        <div className="hud-badge">
          <span className="hud-badge-num">{builtCount}</span>
          <span className="hud-badge-lbl">/ {MAX_FLOORS} korrust</span>
        </div>
      </div>

      {!panelOpen && (
        <button
          type="button"
          className="viewer-controls-toggle"
          onClick={() => setPanelOpen(true)}
          title="Näita juhtnuppe"
          aria-label="Näita juhtnuppe"
        >
          ⚙
        </button>
      )}

      {panelOpen && (
      <div className="viewer-controls" aria-label="Vaate juhtimine">
        <div className="vc-header">
          <span className="vc-title">Vaade</span>
          <button
            type="button"
            className="vc-close"
            onClick={() => setPanelOpen(false)}
            title="Peida"
            aria-label="Peida juhtnupud"
          >
            ×
          </button>
        </div>
        <div className="vc-section">
          <span className="vc-label">Liikumine</span>
          <div className="vc-grid vc-grid-3">
            <span />
            <button type="button" onClick={panY(1.5)} title="Liigu üles" aria-label="Liigu üles">↑</button>
            <span />
            <button type="button" onClick={orbit(-Math.PI / 12)} title="Pööra vasakule" aria-label="Pööra vasakule">⟲</button>
            <button type="button" onClick={panY(-1.5)} title="Liigu alla" aria-label="Liigu alla">↓</button>
            <button type="button" onClick={orbit(Math.PI / 12)} title="Pööra paremale" aria-label="Pööra paremale">⟳</button>
          </div>
        </div>

        <div className="vc-section">
          <span className="vc-label">Suum</span>
          <div className="vc-row">
            <button type="button" onClick={dolly(0.85)} title="Suumi sisse" aria-label="Suumi sisse">＋</button>
            <button type="button" onClick={dolly(1.18)} title="Suumi välja" aria-label="Suumi välja">−</button>
          </div>
        </div>

        <div className="vc-section">
          <span className="vc-label">Vaated</span>
          <div className="vc-row vc-row-wrap">
            <button type="button" onClick={view('ees')}>Ees</button>
            <button type="button" onClick={view('kylg')}>Külg</button>
            <button type="button" onClick={view('ylalt')}>Ülalt</button>
            <button type="button" onClick={view('iso')}>Iso</button>
          </div>
        </div>

        <div className="vc-footer">
          <button
            type="button"
            className={`vc-toggle ${gridOn ? 'is-on' : ''}`}
            onClick={() => setGridOn((v) => !v)}
            aria-pressed={gridOn}
            title="Näita võrku"
          >
            Võrk
          </button>
          <button type="button" className="vc-reset" onClick={reset}>Lähtesta</button>
        </div>
      </div>
      )}

      <div className="viewer-compass" title="Kompass" aria-hidden>
        <svg viewBox="-50 -50 100 100" style={{ transform: `rotate(${-azimuth}rad)` }}>
          <circle cx="0" cy="0" r="44" fill="rgba(255,255,255,0.85)" stroke="var(--brand-line)" strokeWidth="1.5" />
          <polygon points="0,-34 8,6 0,-2 -8,6" fill="var(--brand-accent)" />
          <polygon points="0,34 8,-6 0,2 -8,-6" fill="var(--brand-green-dark)" opacity="0.55" />
          <text x="0" y="-16" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--brand-ink)" fontFamily="var(--font-display)">N</text>
        </svg>
      </div>

      <LoadingOverlay />
    </div>
  )
}

function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="viewer-loading" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Laadin mudeleid… {Math.round(progress)}%</span>
    </div>
  )
}

// Preload every GLB up front so building a floor doesn't stall on network I/O.
BASELINE_URLS.forEach((url) => useGLTF.preload(url))
VARIANT_STEPS.forEach((s) => s.variants.forEach((v) => useGLTF.preload(v.url)))
TOGGLE_STEPS.forEach((s) => useGLTF.preload(LAYERS[s.id].url))
useGLTF.preload(TREPIKODA_GROUND_URL)
useGLTF.preload(TREPIKODA_UPPER_URL)
