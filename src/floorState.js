import { FLOOR_STEPS } from './config.js'

export function isStepDone(floor, step) {
  return step.kind === 'variant'
    ? floor[step.id] !== null
    : floor[step.id] === true
}

// Linear gate — a required prior step blocks subsequent steps.
// Optional steps never block.
export function isStepEnabled(floor, index) {
  for (let i = 0; i < index; i++) {
    const prior = FLOOR_STEPS[i]
    if (prior.optional) continue
    if (!isStepDone(floor, prior)) return false
  }
  return true
}

export function isFloorComplete(floor) {
  return FLOOR_STEPS.every((s) => s.optional || isStepDone(floor, s))
}

export function isFloorStarted(floor) {
  return FLOOR_STEPS.some((s) => isStepDone(floor, s))
}

// Can the user jump to this floor? First floor always; later floors only
// once the floor below is complete. Floors above an installed roof are
// locked — the roof terminates construction.
export function canSelectFloor(floors, floorId) {
  const roof = roofFloorId(floors)
  if (roof !== null && floorId > roof) return false
  if (floorId === 1) return true
  const prev = floors.find((f) => f.id === floorId - 1)
  return prev ? isFloorComplete(prev) : false
}

// Floor id where the roof was placed (katus toggled on), or null.
export function roofFloorId(floors) {
  const f = floors.find((x) => x.katus === true)
  return f ? f.id : null
}

export function isBuildingSubmitted(floors) {
  return roofFloorId(floors) !== null
}

// Required-step progress on a floor: {done, total}.
export function floorProgress(floor) {
  const required = FLOOR_STEPS.filter((s) => !s.optional)
  const done = required.filter((s) => isStepDone(floor, s)).length
  return { done, total: required.length }
}
