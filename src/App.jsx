import { useState } from 'react'
import HouseViewer from './HouseViewer.jsx'
import Sidebar from './Sidebar.jsx'
import { FLOOR_STEPS, MAX_FLOORS } from './config.js'

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

  return (
    <div className="app">
      <main className={`layout ${sidebarOpen ? '' : 'layout-full'}`}>
        <section className="stage">
          <HouseViewer floors={floors} />
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
