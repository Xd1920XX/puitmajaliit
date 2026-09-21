import { useState } from 'react'
import HouseViewer from './HouseViewer.jsx'
import Sidebar from './Sidebar.jsx'
import { MAX_FLOORS } from './config.js'

function initialFloors() {
  return Array.from({ length: MAX_FLOORS }, (_, i) => ({
    id: i + 1,
    karkass: null,
    horisontaal: false,
    kips: false,
    fassaad: false,
  }))
}

export default function App() {
  const [floors, setFloors] = useState(initialFloors)
  const [selectedFloorId, setSelectedFloorId] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const setKarkass = (floorId, variantId) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, karkass: variantId } : f)),
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

  const buildAll = () => {
    setFloors(
      initialFloors().map((f) => ({
        ...f,
        karkass: 'CLT',
        horisontaal: true,
        kips: true,
        fassaad: true,
      })),
    )
    setSelectedFloorId(MAX_FLOORS)
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
            onKarkass={setKarkass}
            onToggleLayer={toggleLayer}
            onReset={reset}
            onBuildAll={buildAll}
          />
        )}
      </main>
    </div>
  )
}
