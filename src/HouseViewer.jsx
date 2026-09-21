import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei'
import {
  PARKLA_URL,
  KARKASS_VARIANTS,
  LAYERS,
  FLOOR_HEIGHT,
  MAX_FLOORS,
} from './config.js'

// Each Model clones its GLB scene because the same URL may render multiple
// times (e.g. Karkass_CLT on floors 1, 2, 3). three.js forbids the same
// Object3D having two parents, so cloning per instance is required.
function Model({ url }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])
  return <primitive object={cloned} />
}

function Floor({ index, floor }) {
  const karkassUrl = floor.karkass
    ? KARKASS_VARIANTS.find((v) => v.id === floor.karkass)?.url
    : null
  return (
    <group position={[0, index * FLOOR_HEIGHT, 0]}>
      {karkassUrl && <Model url={karkassUrl} />}
      {floor.horisontaal && <Model url={LAYERS.horisontaal.url} />}
      {floor.kips && <Model url={LAYERS.kips.url} />}
      {floor.fassaad && <Model url={LAYERS.fassaad.url} />}
    </group>
  )
}

function House({ floors }) {
  return (
    <>
      <Model url={PARKLA_URL} />
      {floors.map((f, i) => (
        <Floor key={f.id} index={i} floor={f} />
      ))}
    </>
  )
}

export default function HouseViewer({ floors }) {
  const controls = useRef(null)
  // Aim slightly below the building's mid-height so the model sits in the
  // upper half of the frame rather than dead-center.
  const targetY = (MAX_FLOORS * FLOOR_HEIGHT) / 2.6
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [30, 22, 42], fov: 40, near: 0.1, far: 500 }}
    >
      <color attach="background" args={['#fff9e8']} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[20, 36, 14]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Suspense fallback={null}>
        <House floors={floors} />
        <Environment preset="park" />
      </Suspense>
      <ContactShadows position={[0, -0.01, 0]} opacity={0.35} scale={40} blur={2.4} far={10} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        target={[0, targetY, 0]}
        minDistance={8}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  )
}

// Preload every GLB up front so building a floor doesn't stall on network I/O.
useGLTF.preload(PARKLA_URL)
KARKASS_VARIANTS.forEach((v) => useGLTF.preload(v.url))
Object.values(LAYERS).forEach((l) => useGLTF.preload(l.url))
