import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Intro from './Intro.jsx'
import { FLOOR_STEPS, MAX_FLOORS } from './config.js'
import { canSelectFloor, isFloorComplete, roofFloorId } from './floorState.js'

// Lazy-load the 3D viewer so three.js + R3F don't block the initial
// HTML/CSS paint. UI shell appears instantly while the heavy chunk streams.
const HouseViewer = lazy(() => import('./HouseViewer.jsx'))

function emptyFloor(id) {
  const f = { id }
  for (const step of FLOOR_STEPS) {
    f[step.id] = step.kind === 'variant' ? null : false
  }
  return f
}

function initialFloors() {
  return Array.from({ length: MAX_FLOORS }, (_, i) => emptyFloor(i + 1))
}

export default function App() {
  const [floors, setFloors] = useState(initialFloors)
  const [selectedFloorId, setSelectedFloorId] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [introSeen, setIntroSeen] = useState(false)

  // Build timer. Starts ticking once the user hits "Alusta"; freezes when
  // the roof is placed (ehitis esitatud).
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const frozenRef = useRef(false)

  const roofId = roofFloorId(floors)
  const submitted = roofId !== null

  useEffect(() => {
    if (!introSeen || startedAt === null || submitted) return
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 1000)
    return () => clearInterval(id)
  }, [introSeen, startedAt, submitted])

  // Capture final elapsed exactly when the roof is placed so the submit
  // modal shows a stable number rather than whatever the last tick was.
  useEffect(() => {
    if (submitted && !frozenRef.current && startedAt !== null) {
      setElapsedMs(Date.now() - startedAt)
      frozenRef.current = true
    }
    if (!submitted) frozenRef.current = false
  }, [submitted, startedAt])

  const startBuilding = () => {
    setIntroSeen(true)
    setStartedAt(Date.now())
    setElapsedMs(0)
  }

  const setVariant = (floorId, stepId, variantId) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, [stepId]: variantId } : f)),
    )
  }

  const toggleLayer = (floorId, layerId) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, [layerId]: !f[layerId] } : f)),
    )
  }

  const reset = () => {
    setFloors(initialFloors())
    setSelectedFloorId(1)
    setStartedAt(Date.now())
    setElapsedMs(0)
  }

  useEffect(() => {
    if (!introSeen) return
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'ArrowLeft') {
        if (selectedFloorId > 1) {
          setSelectedFloorId(selectedFloorId - 1)
          e.preventDefault()
        }
      } else if (e.key === 'ArrowRight') {
        const curr = floors.find((f) => f.id === selectedFloorId)
        const roof = roofFloorId(floors)
        const roofBlocks = roof !== null && selectedFloorId >= roof
        if (selectedFloorId < MAX_FLOORS && isFloorComplete(curr) && !roofBlocks) {
          setSelectedFloorId(selectedFloorId + 1)
          e.preventDefault()
        }
      } else if (/^[1-9]$/.test(e.key)) {
        const target = parseInt(e.key, 10)
        if (canSelectFloor(floors, target)) {
          setSelectedFloorId(target)
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [introSeen, floors, selectedFloorId])

  return (
    <div className="app">
      <main className={`layout ${sidebarOpen && introSeen ? '' : 'layout-full'}`}>
        <section className="stage">
          <Suspense fallback={<ViewerBoot />}>
            <HouseViewer floors={floors} selectedFloorId={selectedFloorId} />
          </Suspense>
          {introSeen && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-pressed={sidebarOpen}
              title={sidebarOpen ? 'Peida paneel' : 'Näita paneeli'}
              aria-label={sidebarOpen ? 'Peida paneel' : 'Näita paneeli'}
            >
              {sidebarOpen ? '›' : '‹'}
            </button>
          )}
        </section>
        {introSeen && sidebarOpen && (
          <Sidebar
            floors={floors}
            selectedFloorId={selectedFloorId}
            onSelectFloor={setSelectedFloorId}
            onVariant={setVariant}
            onToggleLayer={toggleLayer}
            onReset={reset}
            elapsedMs={elapsedMs}
            submitted={submitted}
          />
        )}
      </main>
      {!introSeen && <Intro onStart={startBuilding} />}
    </div>
  )
}

function ViewerBoot() {
  return (
    <div className="viewer-loading" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Laadin vaadet…</span>
    </div>
  )
}
