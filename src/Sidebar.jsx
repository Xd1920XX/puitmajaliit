import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import Confetti from './Confetti.jsx'
import { FLOOR_STEPS, KARKASS_VARIANTS, LAYERS, MAX_FLOORS } from './config.js'
import {
  canAddKatus,
  canSelectFloor,
  floorProgress,
  isFloorComplete,
  isStepDone,
  isStepEnabled,
  roofFloorId,
  stepApplies,
} from './floorState.js'
import { formatTime } from './formatTime.js'
import { MAX_TOTAL_SCORE, scoreAll } from './scoring.js'

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

function BuildingSummary({ floors, roofId, elapsedMs = 0 }) {
  const builtFloors = floors.filter((f) => f.id <= (roofId ?? MAX_FLOORS) && (f.karkass || Object.keys(LAYERS).some((k) => f[k])))
  const karkassBreakdown = useMemo(() => {
    const counts = {}
    builtFloors.forEach((f) => {
      if (!f.karkass) return
      counts[f.karkass] = (counts[f.karkass] ?? 0) + 1
    })
    return counts
  }, [builtFloors])
  const totalScore = useMemo(() => scoreAll(floors).total, [floors])

  return (
    <div className="summary">
      <div className="summary-row">
        <span>Punktid</span>
        <strong>{totalScore} / {MAX_TOTAL_SCORE}</strong>
      </div>
      <div className="summary-row">
        <span>Aeg</span>
        <strong>{formatTime(elapsedMs)}</strong>
      </div>
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
  onCopyPreviousFloor,
  onResetFloor,
  elapsedMs = 0,
  submitted = false,
}) {
  const floor = floors.find((f) => f.id === selectedFloorId)
  const doneCount = floors.filter(isFloorComplete).length
  const totalScore = useMemo(() => scoreAll(floors).total, [floors])
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
  const [confirmResetFloor, setConfirmResetFloor] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [infoStepId, setInfoStepId] = useState(null)

  const prevFloor = floors.find((f) => f.id === selectedFloorId - 1)
  const canCopyPrev =
    selectedFloorId > 1 &&
    prevFloor &&
    FLOOR_STEPS.some((s) => (s.kind === 'variant' ? prevFloor[s.id] !== null : prevFloor[s.id] === true))
  const floorHasAnyStep = FLOOR_STEPS.some((s) =>
    s.kind === 'variant' ? floor[s.id] !== null : floor[s.id] === true,
  )

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
      <section className="score">
        <div className="score-row">
          <span>Korruseid valmis</span>
          <strong>{doneCount} / {MAX_FLOORS}</strong>
        </div>
        <div className="score-row">
          <span>Aeg {submitted && <em className="score-flag">lukus</em>}</span>
          <strong className={`timer ${submitted ? 'is-stopped' : ''}`}>
            {formatTime(elapsedMs)}
          </strong>
        </div>
        <div className="score-row">
          <span>Punktid</span>
          <strong>{totalScore} / {MAX_TOTAL_SCORE}</strong>
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
          <div className="floor-panel-head-row">
            <h3>{selectedFloorId}. korrus</h3>
            <span
              className="floor-progress-label"
              aria-label={`${progress.done} / ${progress.total} kohustuslikku sammu tehtud`}
            >
              {progress.done} / {progress.total} kohustuslikku
            </span>
          </div>
          <div className="floor-progress-bar">
            <div className="floor-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="floor-actions">
            {canCopyPrev && (
              <button
                type="button"
                className="floor-action"
                onClick={() => onCopyPreviousFloor?.(selectedFloorId)}
                title={`Kopeeri korruse ${selectedFloorId - 1} valikud`}
              >
                ⎘ Kopeeri korrus {selectedFloorId - 1}
              </button>
            )}
            {floorHasAnyStep && (
              <button
                type="button"
                className="floor-action floor-action-danger"
                onClick={() => setConfirmResetFloor(true)}
                title="Tühista selle korruse valikud"
              >
                ⟲ Tühista korrus
              </button>
            )}
          </div>
        </div>
        <ol className="steps">
          {FLOOR_STEPS.map((step, index) => {
            const notApplicable = !stepApplies(step, floor)
            const baseEnabled = isStepEnabled(floor, index)
            const katusBlocked =
              step.id === 'katus' && !canAddKatus(floors, selectedFloorId)
            const enabled = baseEnabled && !katusBlocked && !notApplicable
            const done = isStepDone(floor, step)
            const hint = notApplicable
              ? 'Ei kehti valitud karkassi puhul.'
              : katusBlocked
                ? `Katust saab lisada ainult ${MAX_FLOORS}. korrusele.`
                : step.hint
            return (
              <li
                key={step.id}
                className={`step ${done ? 'is-done' : ''} ${!enabled ? 'is-locked' : ''} ${step.optional ? 'is-optional' : ''} ${notApplicable ? 'is-na' : ''}`}
              >
                <div className="step-head">
                  <span className="step-num">{index + 1}</span>
                  <div className="step-title">
                    <strong>
                      {step.label}
                      {step.optional && <span className="step-opt"> · valikuline</span>}
                      {notApplicable && <span className="step-opt"> · ei kehti</span>}
                    </strong>
                    <span className="step-hint">{hint}</span>
                  </div>
                  <button
                    type="button"
                    className="step-info"
                    aria-label={`Info: ${step.label}`}
                    onClick={() => setInfoStepId(step.id)}
                    title="Mida see tähendab?"
                  >
                    ⓘ
                  </button>
                  <span className="step-state">
                    {notApplicable ? '—' : done ? '✓' : enabled ? '' : '🔒'}
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
                      label={LAYERS[step.id]?.label ?? step.label}
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
        open={confirmResetFloor}
        onClose={() => setConfirmResetFloor(false)}
        title={`Tühista korrus ${selectedFloorId}?`}
        tone="warning"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmResetFloor(false)}>
              Tühista
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirmResetFloor(false)
                onResetFloor?.(selectedFloorId)
              }}
            >
              Jah, tühjenda korrus
            </button>
          </>
        }
      >
        <p>Selle korruse valikud kustutatakse. Teised korrused jäävad.</p>
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
        {showSubmit && <Confetti />}
        <p className="modal-lead">Sinu puitmaja on esitatud. Vaata kokkuvõtet:</p>
        <BuildingSummary floors={floors} roofId={roofId} elapsedMs={elapsedMs} />
      </Modal>

      <StepInfoModal
        stepId={infoStepId}
        onClose={() => setInfoStepId(null)}
      />
    </aside>
  )
}

const STEP_INFO = {
  porand: {
    title: 'Põrand',
    body: 'Põrandakonstruktsioon moodustab iga korruse aluse. Lisatakse alati esimesena enne karkassi püstitamist. Tagab staatilise jäikuse ja kannab elanike + mööbli raskust alusstruktuurile.',
  },
  karkass: {
    title: 'Karkass',
    body: 'Kandev struktuur. 300/400/600 mm puitkarkass on klassikaline lahendus — number tähistab vahetugede sammu seinas. CLT (ristkihtliimpuit) on massiivpaneel, millel pole eraldi jäikusseinu ega soojustusvilla seintes vaja.',
  },
  jaikus: {
    title: 'Jäikusseinad OSB',
    body: 'OSB plaadid naelutatakse karkassi peale, muutes seina jäigaks tuulekoormuste vastu. Naelutussamm (50/70/100 mm) määrab, kui tihedalt naelu lüüakse — mida tihedam, seda tugevam. CLT seinas pole jäikust vaja, kuna paneel ise on jäik.',
  },
  soojustus: {
    title: 'Soojustusvill',
    body: 'Üks nupp lisab korraga seina + vannitoa soojustuse (puitkarkassil). CLT paneeli puhul lisandub ainult vannitoa soojustus — ülejäänud seinad soojustavad massiivpuidu enda termiline kaitse.',
  },
  kips:  {
    title: 'Kips (2-kihiline)',
    body: 'Sisemine 2-kihiline kipsplaat katab seinad seestpoolt. Tagab tuleohutuse (2 kihti = parem tulekindlus) ja ühtlase pinna viimistluseks. Paigaldatakse peale soojustust, enne fassaadi.',
  },
  fassaad: {
    title: 'Fassaad',
    body: 'Välimine kate — kaitseb seinad ilmastiku eest ja annab ehitisele visuaalse ilme. Paigaldatakse peale kipsi.',
  },
  trepikoda: {
    title: 'Trepikoda',
    body: 'Trepikoja segment lisatakse igale korrusele. 1. korrusel paigaldub maapinna segment (1K), ülejäänud korrustel korduv segment (2K). Trepikoda on läbiv vertikaalne element.',
  },
  rodu: {
    title: 'Rõdu',
    body: 'Välisrõdu konstruktsioon. Valikuline — lisa ainult kui korrusel on rõdu kavandatud.',
  },
  lagi: {
    title: 'Lagi',
    body: 'Laekonstruktsioon sulgeb korruse. Vajalik enne järgmise korruse ehitamise alustamist. Kannab ülemise korruse põranda ja tagab tuleohutuse korruste vahel.',
  },
  katus: {
    title: 'Katus',
    body: 'Katusekate paigaldatakse ainult viimasele (10.) korrusele. Pärast katuse paigaldust ehitamine lõppeb — rohkem korruseid lisada ei saa. Katus on terminal, pöördumatu samm.',
  },
}

function StepInfoModal({ stepId, onClose }) {
  const info = stepId ? STEP_INFO[stepId] : null
  return (
    <Modal
      open={!!info}
      onClose={onClose}
      title={info?.title ?? ''}
      actions={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Selge
        </button>
      }
    >
      {info && <p>{info.body}</p>}
    </Modal>
  )
}
