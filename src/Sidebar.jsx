import { FLOOR_STEPS, KARKASS_VARIANTS, LAYERS, MAX_FLOORS } from './config.js'

function isStepDone(floor, id) {
  return id === 'karkass' ? floor.karkass !== null : floor[id] === true
}

function isStepEnabled(floor, index) {
  for (let i = 0; i < index; i++) {
    if (!isStepDone(floor, FLOOR_STEPS[i].id)) return false
  }
  return true
}

function isFloorComplete(floor) {
  return FLOOR_STEPS.every((s) => isStepDone(floor, s.id))
}

// A floor is selectable when the floor below is complete (or it's floor 1).
function canSelect(floors, floorId) {
  if (floorId === 1) return true
  const prev = floors.find((f) => f.id === floorId - 1)
  return prev ? isFloorComplete(prev) : false
}

export default function Sidebar({
  floors,
  selectedFloorId,
  onSelectFloor,
  onKarkass,
  onToggleLayer,
  onReset,
}) {
  const floor = floors.find((f) => f.id === selectedFloorId)
  const doneCount = floors.filter(isFloorComplete).length
  const canGoPrev = selectedFloorId > 1
  const canGoNext =
    selectedFloorId < MAX_FLOORS && isFloorComplete(floor)

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
        >
          ‹
        </button>
        <div className="floor-chips">
          {floors.map((f) => {
            const done = isFloorComplete(f)
            const enabled = canSelect(floors, f.id)
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
        >
          ›
        </button>
      </div>

      <div className="floor-panel">
        <h3>{selectedFloorId}. korrus</h3>
        <ol className="steps">
          {FLOOR_STEPS.map((step, index) => {
            const enabled = isStepEnabled(floor, index)
            const done = isStepDone(floor, step.id)
            return (
              <li
                key={step.id}
                className={`step ${done ? 'is-done' : ''} ${!enabled ? 'is-locked' : ''}`}
              >
                <div className="step-head">
                  <span className="step-num">{index + 1}</span>
                  <div className="step-title">
                    <strong>{step.label}</strong>
                    <span className="step-hint">{step.hint}</span>
                  </div>
                  <span className="step-state">
                    {done ? '✓' : enabled ? '' : '🔒'}
                  </span>
                </div>
                <div className="step-body">
                  {step.kind === 'variant' ? (
                    <div className="variant-grid" role="radiogroup" aria-label="Karkassi variant">
                      {KARKASS_VARIANTS.map((v) => {
                        const selected = floor.karkass === v.id
                        return (
                          <button
                            key={v.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={`variant ${selected ? 'is-selected' : ''}`}
                            disabled={!enabled}
                            onClick={() => onKarkass(selectedFloorId, v.id)}
                          >
                            {v.label}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`layer-toggle ${floor[step.id] ? 'is-on' : ''}`}
                      disabled={!enabled}
                      aria-pressed={floor[step.id]}
                      onClick={() => onToggleLayer(selectedFloorId, step.id)}
                    >
                      <span>{LAYERS[step.id].label}</span>
                      <span className="layer-state">
                        {floor[step.id] ? 'Lisatud ✓' : 'Lisa'}
                      </span>
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <footer className="sidebar-foot">
        <button type="button" className="btn btn-ghost" onClick={onReset}>Alusta uuesti</button>
      </footer>
    </aside>
  )
}
