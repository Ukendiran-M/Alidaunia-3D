import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOperationsRevealState } from './operationsRevealPose';

test('computeOperationsRevealState at progress 0 has centered aperture and initial image scale', () => {
  const state = computeOperationsRevealState(0);
  assert.equal(state.progress, 0);
  assert.equal(state.revealFactor, 0);
  assert.equal(state.panelOffsetLeft, 0);
  assert.equal(state.panelOffsetRight, 0);
  assert.equal(state.imageScale, 0.78);
  assert.ok(state.tiltRotation[0] > 0);
  assert.equal(state.isSettled, false);
});

test('computeOperationsRevealState at progress 0.35 is actively parting panels', () => {
  const state = computeOperationsRevealState(0.35);
  assert.ok(state.revealFactor > 0 && state.revealFactor < 1);
  assert.ok(state.panelOffsetLeft < 0);
  assert.ok(state.panelOffsetRight > 0);
  assert.ok(state.imageScale > 0.78 && state.imageScale < 1.0);
  assert.equal(state.isSettled, false);
});

test('computeOperationsRevealState at progress 0.70 is fully settled and cleared', () => {
  const state = computeOperationsRevealState(0.70);
  assert.equal(state.revealFactor, 1.0);
  assert.equal(state.imageScale, 1.0);
  assert.deepEqual(state.tiltRotation, [0, 0, 0]);
  assert.equal(state.isSettled, true);
});

test('computeOperationsRevealState at progress 1.0 remains fully settled', () => {
  const state = computeOperationsRevealState(1.0);
  assert.equal(state.revealFactor, 1.0);
  assert.equal(state.imageScale, 1.0);
  assert.equal(state.isSettled, true);
});

test('reverse progress returns exact deterministic states', () => {
  const forwardAt30 = computeOperationsRevealState(0.30);
  const forwardAt60 = computeOperationsRevealState(0.60);
  const backTo30 = computeOperationsRevealState(0.30);

  assert.deepEqual(forwardAt30, backTo30);
  assert.notDeepEqual(forwardAt30, forwardAt60);
});

test('out of range clamping behaves properly', () => {
  assert.deepEqual(computeOperationsRevealState(-0.5), computeOperationsRevealState(0));
  assert.deepEqual(computeOperationsRevealState(1.5), computeOperationsRevealState(1));
});
