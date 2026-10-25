import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLifecycleState, LIFECYCLE_PHASES } from './projectLifecyclePose';

test('computeLifecycleState at progress 0 is in Analisi phase with high contour opacity', () => {
  const state = computeLifecycleState(0);
  assert.equal(state.activePhaseIndex, 0);
  assert.equal(state.phaseName, 'Analisi');
  assert.ok(state.contourOpacity > 0.5);
  assert.equal(state.blueprintOpacity, 0);
  assert.equal(state.physicalReveal, 0);
  assert.equal(state.managementHighlight, 0);
});

test('computeLifecycleState at 35% is in Progetto phase with active blueprint', () => {
  const state = computeLifecycleState(0.35);
  assert.equal(state.activePhaseIndex, 1);
  assert.equal(state.phaseName, 'Progetto');
  assert.ok(state.blueprintOpacity > 0.8);
  assert.equal(state.physicalReveal, 0);
});

test('computeLifecycleState at 65% is in Realizzazione phase with physical reveal', () => {
  const state = computeLifecycleState(0.65);
  assert.equal(state.activePhaseIndex, 2);
  assert.equal(state.phaseName, 'Realizzazione');
  assert.ok(state.physicalReveal > 0.5);
  assert.equal(state.managementHighlight, 0);
});

test('computeLifecycleState at 85% is in Gestione phase with full physical build and management highlight', () => {
  const state = computeLifecycleState(0.85);
  assert.equal(state.activePhaseIndex, 3);
  assert.equal(state.phaseName, 'Gestione');
  assert.equal(state.physicalReveal, 1.0);
  assert.ok(state.managementHighlight > 0.5);
});

test('computeLifecycleState at 98% has background darkening towards M4 navy', () => {
  const state = computeLifecycleState(0.98);
  assert.equal(state.activePhaseIndex, 3);
  assert.ok(state.backgroundDarkening > 0.7);
});

test('reverse progress returns exact deterministic states', () => {
  const forwardAt30 = computeLifecycleState(0.30);
  const forwardAt70 = computeLifecycleState(0.70);
  const backTo30 = computeLifecycleState(0.30);

  assert.deepEqual(forwardAt30, backTo30);
  assert.notDeepEqual(forwardAt30, forwardAt70);
});

test('clamping handles out-of-range bounds gracefully', () => {
  assert.deepEqual(computeLifecycleState(-1), computeLifecycleState(0));
  assert.deepEqual(computeLifecycleState(2), computeLifecycleState(1));
});
