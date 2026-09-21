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

  const isComplete = (f) => f.karkass && f.horisontaal && f.kips && f.fassaad

  // After any mutation, if the currently-selected floor is now complete,
  // auto-advance selection to the next floor (if there is one).
  const advanceIfComplete = (nextFloors) => {
    const cur = nextFloors.find((f) => f.id === selectedFloorId)
    if (cur && isComplete(cur) && selectedFloorId < MAX_FLOORS) {
      setSelectedFloorId(selectedFloorId + 1)
    }
  }

  const setKarkass = (floorId, variantId) => {
    setFloors((prev) => {
      const next = prev.map((f) => (f.id === floorId ? { ...f, karkass: variantId } : f))
      advanceIfComplete(next)
      return next
    })
  }

  const toggleLayer = (floorId, layerId) => {
    setFloors((prev) => {
      const next = prev.map((f) => (f.id === floorId ? { ...f, [layerId]: !f[layerId] } : f))
      advanceIfComplete(next)
      return next
    })
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
            onKarkass={setKarkass}
            onToggleLayer={toggleLayer}
            onReset={reset}
          />
        )}
      </main>
    </div>
  )
}
