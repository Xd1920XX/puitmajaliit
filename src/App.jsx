import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Intro from './Intro.jsx'
import GameSelect from './GameSelect.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import AcademyBar from './academy/AcademyBar.jsx'
import { readLaunchToken, clearLaunchToken } from './academy/launchToken.js'
import { submitResult } from './academy/api.js'
import { DEFAULT_RETURN_URL } from './academy/config.js'
import { FLOOR_STEPS, GAMES, MAX_FLOORS, gameById } from './config.js'
import { canSelectFloor, isFloorComplete } from './floorState.js'

// Lazy-load the 3D viewer so three.js + R3F don't block the initial
// HTML/CSS paint. UI shell appears instantly while the heavy chunk streams.
const HouseViewer = lazy(() => import('./HouseViewer.jsx'))

const STORAGE_KEY = 'puitmajaliit:v2'

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
  const [selectedGameId, setSelectedGameId] = useState(null)
  const [introSeen, setIntroSeen] = useState(false)
  const [restorePrompt, setRestorePrompt] = useState(null) // saved blob
  const [academyUser] = useState(() => readLaunchToken())

  // Timer state:
  //   startedAt   — set when the first `porand` toggles on. Null before.
  //   elapsedMs   — tick-updated clock, reflects live elapsed (or frozen value).
  //   submittedAt — set when user hits "Esita ehitis". Freezes elapsed.
  //                 Cleared when user chooses "Sulge" (continue building).
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [submittedAt, setSubmittedAt] = useState(null)
  const pausedElapsedRef = useRef(null)

  const game = useMemo(() => gameById(selectedGameId), [selectedGameId])
  const submitted = submittedAt !== null
  const timeLimitMs = game?.timeLimitMs ?? null

  // Derived: for a timed game, remaining ms. Null = unlimited.
  const remainingMs = useMemo(() => {
    if (!timeLimitMs) return null
    return Math.max(0, timeLimitMs - elapsedMs)
  }, [timeLimitMs, elapsedMs])

  // Check for saved session on first mount.
  useEffect(() => {
    const saved = loadSaved()
    if (saved?.introSeen && saved?.selectedGameId) setRestorePrompt(saved)
  }, [])

  // Auto-start the timer when the first porand toggles on anywhere.
  useEffect(() => {
    if (!introSeen || startedAt !== null) return
    const hasPorand = floors.some((f) => f.porand === true)
    if (hasPorand) {
      setStartedAt(Date.now())
      setElapsedMs(0)
    }
  }, [floors, introSeen, startedAt])

  // Interval tick while running (and not hidden, not submitted).
  useEffect(() => {
    if (!introSeen || startedAt === null || submitted) return
    const id = setInterval(() => {
      if (!document.hidden) setElapsedMs(Date.now() - startedAt)
    }, 500)
    return () => clearInterval(id)
  }, [introSeen, startedAt, submitted])

  // Freeze elapsed exactly when submit happens.
  useEffect(() => {
    if (submitted && startedAt !== null) {
      setElapsedMs(submittedAt - startedAt)
    }
  }, [submitted, submittedAt, startedAt])

  // Auto-submit on countdown hitting zero.
  useEffect(() => {
    if (!timeLimitMs || submitted || startedAt === null) return
    if (elapsedMs >= timeLimitMs) {
      setSubmittedAt(startedAt + timeLimitMs)
    }
  }, [elapsedMs, timeLimitMs, submitted, startedAt])

  // Tab visibility: pause the clock while the user is on another tab.
  useEffect(() => {
    if (!introSeen || submitted || startedAt === null) return
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
    if (!introSeen || !selectedGameId) return
    const t = setTimeout(() => {
      try {
        const payload = {
          floors,
          selectedFloorId,
          selectedGameId,
          startedAt,
          elapsedMs,
          submittedAt,
          introSeen: true,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [floors, selectedFloorId, selectedGameId, startedAt, elapsedMs, submittedAt, introSeen])

  const pickGame = (id) => {
    setSelectedGameId(id)
  }

  const startBuilding = () => {
    setIntroSeen(true)
  }

  const restoreSaved = () => {
    const s = restorePrompt
    if (!s) return
    setFloors(s.floors)
    setSelectedFloorId(s.selectedFloorId ?? 1)
    setSelectedGameId(s.selectedGameId ?? GAMES[0].id)
    const elapsed = s.elapsedMs ?? 0
    setElapsedMs(elapsed)
    if (s.startedAt) {
      // Shift startedAt so elapsed continues from where user left.
      setStartedAt(Date.now() - elapsed)
    }
    setSubmittedAt(s.submittedAt ?? null)
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
    setStartedAt(null)
    setElapsedMs(0)
    setSubmittedAt(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  // Lock the timer + fire Academy submit. Called from Sidebar's Esita button.
  const submitBuilding = useCallback(() => {
    setSubmittedAt(Date.now())
  }, [])

  // Modal "Sulge" — resume timer and keep building.
  const resumeBuilding = useCallback(() => {
    if (!submittedAt || !startedAt) return
    const held = submittedAt - startedAt
    setStartedAt(Date.now() - held)
    setSubmittedAt(null)
  }, [submittedAt, startedAt])

  const submitToAcademy = useCallback(
    async (payload) => {
      if (!academyUser?.token) throw new Error('Puudub Academy launch token')
      if (!selectedGameId) throw new Error('Mäng valimata')
      return submitResult(academyUser.token, { task_id: selectedGameId, ...payload })
    },
    [academyUser, selectedGameId],
  )

  const returnToAcademy = useCallback(() => {
    const url = academyUser?.return_url || DEFAULT_RETURN_URL
    if (!url) return
    clearLaunchToken()
    window.location.href = url
  }, [academyUser])

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
  }, [introSeen, floors, selectedFloorId])

  const showGameSelect = !selectedGameId && !restorePrompt
  const showIntro = selectedGameId && !introSeen && !restorePrompt

  return (
    <div className="app">
      <AcademyBar user={academyUser} onReturn={returnToAcademy} />
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
            remainingMs={remainingMs}
            timerStarted={startedAt !== null}
            submitted={submitted}
            game={game}
            academyUser={academyUser}
            onSubmitBuilding={submitBuilding}
            onResumeBuilding={resumeBuilding}
            onSubmitToAcademy={submitToAcademy}
            onReturnToAcademy={returnToAcademy}
          />
        )}
      </main>
      {showGameSelect && <GameSelect onPick={pickGame} />}
      {showIntro && <Intro game={game} onStart={startBuilding} />}
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
  const game = gameById(saved.selectedGameId)
  return (
    <div className="modal-overlay">
      <div className="modal modal-success" role="dialog" aria-modal="true" aria-labelledby="restore-title">
        <header className="modal-head">
          <h2 id="restore-title">Jätka pooleli ehitust?</h2>
        </header>
        <div className="modal-body">
          <p>Leidsime salvestatud sessiooni{game ? ` — ${game.title}` : ''} ({builtCount} korrust alustatud).</p>
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
