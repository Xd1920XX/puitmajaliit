import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { FLOOR_STEPS, KARKASS_VARIANTS, LAYERS, MAX_FLOORS } from './config.js'
import {
  canSelectFloor,
  floorProgress,
  isFloorComplete,
  isStepDone,
  isStepEnabled,
  roofFloorId,
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

function karkassLabel(id) {
  return KARKASS_VARIANTS.find((v) => v.id === id)?.label ?? id
}

function BuildingSummary({ floors, roofId }) {
  const builtFloors = floors.filter((f) => f.id <= (roofId ?? MAX_FLOORS) && (f.karkass || Object.keys(LAYERS).some((k) => f[k])))
  const karkassBreakdown = useMemo(() => {
    const counts = {}
    builtFloors.forEach((f) => {
      if (!f.karkass) return
      counts[f.karkass] = (counts[f.karkass] ?? 0) + 1
    })
    return counts
  }, [builtFloors])

  return (
    <div className="summary">
      <div className="summary-row">
        <span>Korruseid</span>
        <strong>{roofId ?? builtFloors.length}</strong>
      </div>
      <div className="summary-row">
        <span>Katus paigaldatud korrusel</span>
        <strong>{roofId ?? '—'}</strong>
      </div>
      <div className="summary-block">
        <span>Karkassid</span>
        <ul>
          {Object.entries(karkassBreakdown).map(([id, n]) => (
            <li key={id}>
              <strong>{n}×</strong> {karkassLabel(id)}
            </li>
          ))}
          {Object.keys(karkassBreakdown).length === 0 && <li>—</li>}
        </ul>
      </div>
    </div>
  )
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
  const roofId = roofFloorId(floors)
  const buildingSubmittable = roofId !== null
  const roofOnThisFloor = roofId === selectedFloorId
  const hasNextFloor = selectedFloorId < MAX_FLOORS && !buildingSubmittable
  const canGoNext = hasNextFloor && complete
  const progress = floorProgress(floor)
  const progressPct = Math.round((progress.done / progress.total) * 100)

  const [confirmReset, setConfirmReset] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  const panelRef = useRef(null)
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0
  }, [selectedFloorId])

  const confirmRef = useRef(null)
  useEffect(() => {
    if (complete && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [complete, roofOnThisFloor])

  const anyWork = floors.some((f) => FLOOR_STEPS.some((s) => isStepDone(f, s)))

  const handleResetClick = () => {
    if (!anyWork) {
      onReset()
      return
    }
    setConfirmReset(true)
  }
  const confirmedReset = () => {
    setConfirmReset(false)
    onReset()
  }

  const handleConfirmFloor = () => {
    if (buildingSubmittable) {
      setShowSubmit(true)
    } else if (hasNextFloor) {
      onSelectFloor(selectedFloorId + 1)
    }
  }

  const handleSubmit = () => {
    setShowSubmit(true)
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
            const isRoof = roofId === f.id
            const lockedByRoof = roofId !== null && f.id > roofId
            return (
              <button
                key={f.id}
                type="button"
                className={`floor-chip ${done ? 'is-done' : ''} ${active ? 'is-active' : ''} ${!enabled ? 'is-locked' : ''} ${isRoof ? 'is-roof' : ''}`}
                disabled={!enabled}
                onClick={() => onSelectFloor(f.id)}
                aria-label={`Korrus ${f.id}`}
                aria-current={active ? 'step' : undefined}
                title={
                  lockedByRoof
                    ? 'Katus paigaldatud — ehitis on lõpetatud'
                    : `Korrus ${f.id}${f.id <= 9 ? ` (${f.id})` : ''}`
                }
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
          <div
            className={`floor-complete ${roofOnThisFloor ? 'is-final' : ''}`}
            ref={confirmRef}
            role="status"
          >
            <div className="floor-complete-head">
              <span className="floor-complete-icon" aria-hidden>{roofOnThisFloor ? '🏠' : '✓'}</span>
              <div>
                <strong>
                  {roofOnThisFloor
                    ? 'Ehitis on valmis'
                    : `Korrus ${selectedFloorId} valmis`}
                </strong>
                <p>
                  {roofOnThisFloor
                    ? 'Paigaldasid katuse — ehitamine on lõpetatud. Esita oma ehitis.'
                    : hasNextFloor
                      ? 'Kõik kohustuslikud sammud tehtud. Lisa soovi korral valikulised või kinnita ja liigu järgmisele korrusele.'
                      : 'Viimane korrus valmis. Paigalda katus ja esita ehitis.'}
                </p>
              </div>
            </div>
            {roofOnThisFloor ? (
              <button
                type="button"
                className="btn btn-primary is-pulse"
                onClick={handleSubmit}
              >
                Esita ehitis →
              </button>
            ) : hasNextFloor ? (
              <button
                type="button"
                className="btn btn-primary is-pulse"
                onClick={handleConfirmFloor}
              >
                Kinnita korrus {selectedFloorId} →
              </button>
            ) : null}
          </div>
        )}
      </div>

      <footer className="sidebar-foot">
        <button type="button" className="btn btn-ghost btn-full" onClick={handleResetClick}>
          Alusta uuesti
        </button>
      </footer>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Alusta uuesti?"
        tone="warning"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Tühista
            </button>
            <button type="button" className="btn btn-primary" onClick={confirmedReset}>
              Jah, kustuta kõik
            </button>
          </>
        }
      >
        <p>Kõik ehitatud korrused kaovad. Seda ei saa tagasi võtta.</p>
      </Modal>

      <Modal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        title="Ehitis esitatud"
        tone="success"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowSubmit(false)}>
              Sulge
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowSubmit(false)
                onReset()
              }}
            >
              Alusta uut ehitist
            </button>
          </>
        }
      >
        <p className="modal-lead">Sinu puitmaja on esitatud. Vaata kokkuvõtet:</p>
        <BuildingSummary floors={floors} roofId={roofId} />
      </Modal>
    </aside>
  )
}
