import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Intro from './Intro.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { FLOOR_STEPS, MAX_FLOORS } from './config.js'
import { canSelectFloor, isFloorComplete, roofFloorId } from './floorState.js'

// Lazy-load the 3D viewer so three.js + R3F don't block the initial
// HTML/CSS paint. UI shell appears instantly while the heavy chunk streams.
const HouseViewer = lazy(() => import('./HouseViewer.jsx'))

const STORAGE_KEY = 'puitmajaliit:v1'

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

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.floors || !Array.isArray(parsed.floors)) return null
    return parsed
  } catch {
    return null
  }
}

export default function App() {
  const [floors, setFloors] = useState(initialFloors)
  const [selectedFloorId, setSelectedFloorId] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [introSeen, setIntroSeen] = useState(false)
  const [restorePrompt, setRestorePrompt] = useState(null) // saved blob

  // Build timer. Starts ticking once the user hits "Alusta"; freezes when
  // the roof is placed (ehitis esitatud); pauses while tab is hidden.
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const frozenRef = useRef(false)
  const pausedElapsedRef = useRef(null)

  const roofId = roofFloorId(floors)
  const submitted = roofId !== null

  // Check for saved session on first mount.
  useEffect(() => {
    const saved = loadSaved()
    if (saved?.introSeen) setRestorePrompt(saved)
  }, [])

  // Interval tick while running (and not hidden).
  useEffect(() => {
    if (!introSeen || startedAt === null || submitted) return
    const id = setInterval(() => {
      if (!document.hidden) setElapsedMs(Date.now() - startedAt)
    }, 1000)
    return () => clearInterval(id)
  }, [introSeen, startedAt, submitted])

  // Freeze elapsed exactly when the roof is placed.
  useEffect(() => {
    if (submitted && !frozenRef.current && startedAt !== null) {
      setElapsedMs(Date.now() - startedAt)
      frozenRef.current = true
    }
    if (!submitted) frozenRef.current = false
  }, [submitted, startedAt])

  // Tab visibility: pause the clock while the user is on another tab.
  useEffect(() => {
    if (!introSeen || submitted) return
    const onVis = () => {
      if (document.hidden) {
        pausedElapsedRef.current = Date.now() - startedAt
      } else if (pausedElapsedRef.current !== null) {
        setStartedAt(Date.now() - pausedElapsedRef.current)
        pausedElapsedRef.current = null
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [introSeen, submitted, startedAt])

  // Persist state (debounced) whenever something meaningful changes.
  useEffect(() => {
    if (!introSeen) return
    const t = setTimeout(() => {
      try {
        const payload = {
          floors,
          selectedFloorId,
          startedAt,
          elapsedMs,
          introSeen: true,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [floors, selectedFloorId, startedAt, elapsedMs, introSeen])

  const startBuilding = () => {
    setIntroSeen(true)
    setStartedAt(Date.now())
    setElapsedMs(0)
  }

  const restoreSaved = () => {
    const s = restorePrompt
    if (!s) return
    setFloors(s.floors)
    setSelectedFloorId(s.selectedFloorId ?? 1)
    // Restore so elapsed continues from where user left (shift startedAt).
    const elapsed = s.elapsedMs ?? 0
    setElapsedMs(elapsed)
    setStartedAt(Date.now() - elapsed)
    setIntroSeen(true)
    setRestorePrompt(null)
  }
  const discardSaved = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setRestorePrompt(null)
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

  const copyPreviousFloor = (toFloorId) => {
    if (toFloorId <= 1) return
    setFloors((prev) => {
      const source = prev.find((f) => f.id === toFloorId - 1)
      if (!source) return prev
      return prev.map((f) => {
        if (f.id !== toFloorId) return f
        const copy = { id: f.id }
        for (const step of FLOOR_STEPS) {
          // Never copy katus — that's a terminal, floor-specific decision.
          if (step.id === 'katus') {
            copy[step.id] = step.kind === 'variant' ? null : false
          } else {
            copy[step.id] = source[step.id]
          }
        }
        return copy
      })
    })
  }

  const resetFloor = (floorId) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? emptyFloor(f.id) : f)),
    )
  }

  const reset = () => {
    setFloors(initialFloors())
    setSelectedFloorId(1)
    setStartedAt(Date.now())
    setElapsedMs(0)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
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
          <ErrorBoundary>
            <Suspense fallback={<ViewerBoot />}>
              <HouseViewer
                floors={floors}
                selectedFloorId={selectedFloorId}
              />
            </Suspense>
          </ErrorBoundary>
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
            onCopyPreviousFloor={copyPreviousFloor}
            onResetFloor={resetFloor}
            elapsedMs={elapsedMs}
            submitted={submitted}
          />
        )}
      </main>
      {!introSeen && !restorePrompt && <Intro onStart={startBuilding} />}
      {restorePrompt && (
        <RestoreModal
          saved={restorePrompt}
          onContinue={restoreSaved}
          onDiscard={discardSaved}
        />
      )}
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

function RestoreModal({ saved, onContinue, onDiscard }) {
  const builtCount = (saved.floors || []).filter((f) =>
    FLOOR_STEPS.some((s) =>
      s.kind === 'variant' ? f[s.id] !== null : f[s.id] === true,
    ),
  ).length
  return (
    <div className="modal-overlay">
      <div className="modal modal-success" role="dialog" aria-modal="true" aria-labelledby="restore-title">
        <header className="modal-head">
          <h2 id="restore-title">Jätka pooleli ehitust?</h2>
        </header>
        <div className="modal-body">
          <p>Leidsime salvestatud sessiooni — {builtCount} korrust alustatud.</p>
          <p className="modal-lead">Soovid jätkata sealt, kus pooleli jäid, või alustada otsast?</p>
        </div>
        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onDiscard}>
            Alusta otsast
          </button>
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Jätka
          </button>
        </footer>
      </div>
    </div>
  )
}
