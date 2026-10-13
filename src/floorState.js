import { FLOOR_STEPS, MAX_FLOORS } from './config.js'

export function isStepDone(floor, step) {
  return step.kind === 'variant'
    ? floor[step.id] !== null
    : floor[step.id] === true
}

// Whether this step applies to the current floor configuration.
// `skipWhenVariant: { karkass: ['CLT'] }` means: skip entirely if karkass
// is CLT. Hidden from Sidebar + treated as satisfied in gating/completion.
export function stepApplies(step, floor) {
  if (!step.skipWhenVariant) return true
  for (const [variantStepId, excludedIds] of Object.entries(step.skipWhenVariant)) {
    if (excludedIds.includes(floor[variantStepId])) return false
  }
  return true
}

// Satisfied = either does not apply, or is done. Used by gates/completion.
export function isStepSatisfied(floor, step) {
  if (!stepApplies(step, floor)) return true
  return isStepDone(floor, step)
}

// Linear gate — a required prior step blocks subsequent steps.
// Optional steps never block; non-applicable steps count as satisfied.
export function isStepEnabled(floor, index) {
  for (let i = 0; i < index; i++) {
    const prior = FLOOR_STEPS[i]
    if (prior.optional) continue
    if (!isStepSatisfied(floor, prior)) return false
  }
  return true
}

export function isFloorComplete(floor) {
  return FLOOR_STEPS.every((s) => s.optional || isStepSatisfied(floor, s))
}

export function isFloorStarted(floor) {
  return FLOOR_STEPS.some((s) => isStepDone(floor, s))
}

// Highest floor id with any work started, or 0 if the build is empty.
export function highestStartedFloorId(floors) {
  let hi = 0
  for (const f of floors) {
    if (isFloorStarted(f)) hi = Math.max(hi, f.id)
  }
  return hi
}

// Katus is only addable on the final storey (MAX_FLOORS). The user must
// build the full tower before being able to cap it with a roof.
export function canAddKatus(_floors, floorId) {
  return floorId === MAX_FLOORS
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

// Required-step progress on a floor: {done, total}. Non-applicable steps
// (e.g. soojustus when karkass is CLT) drop out of the denominator.
export function floorProgress(floor) {
  const required = FLOOR_STEPS.filter((s) => !s.optional && stepApplies(s, floor))
  const done = required.filter((s) => isStepDone(floor, s)).length
  return { done, total: required.length }
}
