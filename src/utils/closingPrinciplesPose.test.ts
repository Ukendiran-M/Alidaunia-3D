import test from 'node:test';
import assert from 'node:assert/strict';
import { computeClosingPrinciplesState } from './closingPrinciplesPose';

test('computeClosingPrinciplesState at progress 0 has start camera and rotation', () => {
  const state = computeClosingPrinciplesState(0);
  assert.equal(state.progress, 0);
  assert.equal(state.isSettled, false);
  assert.equal(state.modelScale, 0.65);
  assert.ok(state.modelRotationY < 0);
});

test('computeClosingPrinciplesState at progress 0.5 is midway in camera transition', () => {
  const state = computeClosingPrinciplesState(0.5);
  assert.ok(state.cameraPosition[0] > 2.5 && state.cameraPosition[0] < 5.4);
  assert.equal(state.isSettled, false);
});

test('computeClosingPrinciplesState at progress 1.0 is fully settled at rest', () => {
  const state = computeClosingPrinciplesState(1.0);
  assert.equal(state.progress, 1.0);
  assert.equal(state.isSettled, true);
  assert.equal(state.modelRotationY, 0);
  assert.deepEqual(state.cameraPosition, [5.4, 9.2, 13.6]);
});

test('reverse progress returns exact deterministic states', () => {
  const forwardAt25 = computeClosingPrinciplesState(0.25);
  const forwardAt75 = computeClosingPrinciplesState(0.75);
  const backTo25 = computeClosingPrinciplesState(0.25);

  assert.deepEqual(forwardAt25, backTo25);
  assert.notDeepEqual(forwardAt25, forwardAt75);
});

test('out-of-range inputs clamp gracefully', () => {
  assert.deepEqual(computeClosingPrinciplesState(-0.5), computeClosingPrinciplesState(0));
  assert.deepEqual(computeClosingPrinciplesState(1.5), computeClosingPrinciplesState(1));
});
