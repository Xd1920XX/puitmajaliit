import { useEffect, useRef } from 'react'
import { FLOOR_STEPS, LAYERS, MAX_FLOORS } from './config.js'
import {
  canSelectFloor,
  floorProgress,
  isFloorComplete,
  isStepDone,
  isStepEnabled,
} from './floorState.js'

function VariantGrid({ step, selectedId, enabled, onPick }) {
  return (
    <div className="variant-grid" role="radiogroup" aria-label={step.label}>
      {step.variants.map((v) => {
        const selected = selectedId === v.id
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`variant ${selected ? 'is-selected' : ''}`}
            disabled={!enabled}
            onClick={() => onPick(v.id)}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}

function LayerToggle({ label, on, enabled, onClick }) {
  return (
    <button
      type="button"
      className={`layer-toggle ${on ? 'is-on' : ''}`}
      disabled={!enabled}
      aria-pressed={on}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="layer-state">{on ? 'Lisatud ✓' : 'Lisa'}</span>
    </button>
  )
}

const chipsGridStyle = {
  gridTemplateColumns: `repeat(${MAX_FLOORS}, minmax(0, 1fr))`,
}

export default function Sidebar({
  floors,
  selectedFloorId,
  onSelectFloor,
  onVariant,
  onToggleLayer,
  onReset,
}) {
  const floor = floors.find((f) => f.id === selectedFloorId)
  const doneCount = floors.filter(isFloorComplete).length
  const canGoPrev = selectedFloorId > 1
  const complete = isFloorComplete(floor)
  const hasNextFloor = selectedFloorId < MAX_FLOORS
  const canGoNext = hasNextFloor && complete
  const progress = floorProgress(floor)
  const progressPct = Math.round((progress.done / progress.total) * 100)
  const buildingDone = doneCount === MAX_FLOORS

  // Reset scroll to top whenever the user navigates to another floor so the
  // steps list always starts at step 1, not wherever we left off.
  const panelRef = useRef(null)
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [selectedFloorId])

  // When the current floor becomes complete, nudge the confirm card into
  // view so the user doesn't miss it (especially on long steps list).
  const confirmRef = useRef(null)
  useEffect(() => {
    if (complete && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [complete])

  const handleReset = () => {
    const anyWork = floors.some((f) => FLOOR_STEPS.some((s) => isStepDone(f, s)))
    if (anyWork && !window.confirm('Kas kustutada kõik korrused ja alustada otsast?')) return
    onReset()
  }

  const handleConfirmFloor = () => {
    if (hasNextFloor) onSelectFloor(selectedFloorId + 1)
  }

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <img src="/logo.png" alt="Woodhouse Academy" className="brand-logo" />
      </header>

      <section className="score">
        <div className="score-row">
          <span>Korruseid valmis</span>
          <strong>{doneCount} / {MAX_FLOORS}</strong>
        </div>
        <div className="score-row">
          <span>Punktid</span>
          <strong>—</strong>
        </div>
      </section>

      <div className="floor-nav">
        <button
          type="button"
          className="nav-arrow"
          onClick={() => onSelectFloor(selectedFloorId - 1)}
          disabled={!canGoPrev}
          aria-label="Eelmine korrus"
          title="Eelmine korrus (← nool)"
        >
          ‹
        </button>
        <div className="floor-chips" style={chipsGridStyle}>
          {floors.map((f) => {
            const done = isFloorComplete(f)
            const enabled = canSelectFloor(floors, f.id)
            const active = f.id === selectedFloorId
            return (
              <button
                key={f.id}
                type="button"
                className={`floor-chip ${done ? 'is-done' : ''} ${active ? 'is-active' : ''} ${!enabled ? 'is-locked' : ''}`}
                disabled={!enabled}
                onClick={() => onSelectFloor(f.id)}
                aria-label={`Korrus ${f.id}`}
                aria-current={active ? 'step' : undefined}
                title={`Korrus ${f.id}${f.id <= 9 ? ` (${f.id})` : ''}`}
              >
                {f.id}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="nav-arrow"
          onClick={() => onSelectFloor(selectedFloorId + 1)}
          disabled={!canGoNext}
          aria-label="Järgmine korrus"
          title="Järgmine korrus (→ nool)"
        >
          ›
        </button>
      </div>

      <div className="floor-panel" ref={panelRef}>
        <div className="floor-panel-head">
          <h3>{selectedFloorId}. korrus</h3>
          <div className="floor-progress" aria-label={`${progress.done} / ${progress.total} kohustuslikku sammu tehtud`}>
            <div className="floor-progress-bar">
              <div className="floor-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="floor-progress-label">
              {progress.done} / {progress.total} kohustuslikku
            </span>
          </div>
        </div>
        <ol className="steps">
          {FLOOR_STEPS.map((step, index) => {
            const enabled = isStepEnabled(floor, index)
            const done = isStepDone(floor, step)
            return (
              <li
                key={step.id}
                className={`step ${done ? 'is-done' : ''} ${!enabled ? 'is-locked' : ''} ${step.optional ? 'is-optional' : ''}`}
              >
                <div className="step-head">
                  <span className="step-num">{index + 1}</span>
                  <div className="step-title">
                    <strong>
                      {step.label}
                      {step.optional && <span className="step-opt"> · valikuline</span>}
                    </strong>
                    <span className="step-hint">{step.hint}</span>
                  </div>
                  <span className="step-state">
                    {done ? '✓' : enabled ? '' : '🔒'}
                  </span>
                </div>
                <div className="step-body">
                  {step.kind === 'variant' ? (
                    <VariantGrid
                      step={step}
                      selectedId={floor[step.id]}
                      enabled={enabled}
                      onPick={(id) => onVariant(selectedFloorId, step.id, id)}
                    />
                  ) : (
                    <LayerToggle
                      label={LAYERS[step.id].label}
                      on={floor[step.id]}
                      enabled={enabled}
                      onClick={() => onToggleLayer(selectedFloorId, step.id)}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {complete && (
          <div className="floor-complete" ref={confirmRef} role="status">
            <div className="floor-complete-head">
              <span className="floor-complete-icon" aria-hidden>✓</span>
              <div>
                <strong>Korrus {selectedFloorId} valmis</strong>
                <p>
                  {hasNextFloor
                    ? 'Kõik kohustuslikud sammud tehtud. Lisa soovi korral valikulised või kinnita ja liigu järgmisele korrusele.'
                    : buildingDone
                      ? 'Oled ehitanud kõik 10 korrust — hoone on valmis.'
                      : 'Viimane korrus valmis.'}
                </p>
              </div>
            </div>
            {hasNextFloor && (
              <button
                type="button"
                className="btn btn-primary is-pulse"
                onClick={handleConfirmFloor}
              >
                Kinnita korrus {selectedFloorId} →
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="sidebar-foot">
        <button type="button" className="btn btn-ghost btn-full" onClick={handleReset}>
          Alusta uuesti
        </button>
      </footer>
    </aside>
  )
}
