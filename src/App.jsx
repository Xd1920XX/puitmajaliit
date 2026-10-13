import { lazy, Suspense, useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import { FLOOR_STEPS, MAX_FLOORS } from './config.js'
import { canSelectFloor, isFloorComplete } from './floorState.js'

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
  }

  // Keyboard navigation: ← / → move between floors (respecting the gate),
  // 1..9 jump directly. Skip when focus is on an input/button being
  // interacted with via keyboard so the user doesn't fight the UI.
  useEffect(() => {
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
        if (selectedFloorId < MAX_FLOORS && isFloorComplete(curr)) {
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
  }, [floors, selectedFloorId])

  return (
    <div className="app">
      <main className={`layout ${sidebarOpen ? '' : 'layout-full'}`}>
        <section className="stage">
          <Suspense fallback={<ViewerBoot />}>
            <HouseViewer floors={floors} />
          </Suspense>
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
        </section>
        {sidebarOpen && (
          <Sidebar
            floors={floors}
            selectedFloorId={selectedFloorId}
            onSelectFloor={setSelectedFloorId}
            onVariant={setVariant}
            onToggleLayer={toggleLayer}
            onReset={reset}
          />
        )}
      </main>
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
