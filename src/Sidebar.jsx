import { FLOOR_STEPS, LAYERS, MAX_FLOORS } from './config.js'

function isStepDone(floor, step) {
  return step.kind === 'variant' ? floor[step.id] !== null : floor[step.id] === true
}

// Linear gate — required step blocks next until done. Optional never blocks.
function isStepEnabled(floor, index) {
  for (let i = 0; i < index; i++) {
    const prior = FLOOR_STEPS[i]
    if (prior.optional) continue
    if (!isStepDone(floor, prior)) return false
  }
  return true
}

function isFloorComplete(floor) {
  return FLOOR_STEPS.every((s) => s.optional || isStepDone(floor, s))
}

function canSelect(floors, floorId) {
  if (floorId === 1) return true
  const prev = floors.find((f) => f.id === floorId - 1)
  return prev ? isFloorComplete(prev) : false
}

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
  const canGoNext = selectedFloorId < MAX_FLOORS && isFloorComplete(floor)

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
      </div>

      <footer className="sidebar-foot">
        <button type="button" className="btn btn-ghost" onClick={onReset}>Alusta uuesti</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canGoNext}
          onClick={() => onSelectFloor(selectedFloorId + 1)}
        >
          Järgmine korrus ›
        </button>
      </footer>
    </aside>
  )
}
