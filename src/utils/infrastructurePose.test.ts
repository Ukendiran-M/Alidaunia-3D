import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHeliportState, HELIPORT_GROUPS } from './infrastructurePose';

test('computeHeliportState at progress 0 is in separated-hold with all groups separated', () => {
  const state = computeHeliportState(0);
  assert.equal(state.phase, 'separated-hold');
  assert.equal(state.activeLayerIndex, 0);
  assert.equal(state.hudOpacity, 1.0);
  assert.equal(state.isAssembled, false);

  for (const g of HELIPORT_GROUPS) {
    assert.equal(state.groupSeparations[g.name], 1.0);
  }
});

test('computeHeliportState at 10% remains in separated-hold', () => {
  const state = computeHeliportState(0.10);
  assert.equal(state.phase, 'separated-hold');
  for (const g of HELIPORT_GROUPS) {
    assert.equal(state.groupSeparations[g.name], 1.0);
  }
});

test('computeHeliportState at 30% has foundation assembled and slab in progress', () => {
  const state = computeHeliportState(0.30);
  assert.equal(state.phase, 'foundation-deck');
  assert.equal(state.groupSeparations['foundation'], 0.0);
  assert.ok(state.groupSeparations['slab'] < 1.0);
  assert.ok(state.groupSeparations['slab'] > 0.0);
  // markings and lighting are still separated
  assert.equal(state.groupSeparations['markings'], 1.0);
  assert.equal(state.groupSeparations['lighting'], 1.0);
});

test('computeHeliportState at 55% has markings assembled', () => {
  const state = computeHeliportState(0.55);
  assert.equal(state.groupSeparations['foundation'], 0.0);
  assert.equal(state.groupSeparations['slab'], 0.0);
  assert.equal(state.groupSeparations['markings'], 0.0);
});

test('computeHeliportState at 80% is in assembled-hold with all groups at zero offset', () => {
  const state = computeHeliportState(0.80);
  assert.equal(state.phase, 'assembled-hold');
  assert.equal(state.isAssembled, true);
  assert.equal(state.hudOpacity, 1.0);

  for (const g of HELIPORT_GROUPS) {
    assert.equal(state.groupSeparations[g.name], 0.0);
  }
});

test('computeHeliportState at 95% is in release with fading hud', () => {
  const state = computeHeliportState(0.95);
  assert.equal(state.phase, 'release');
  assert.equal(state.isAssembled, true);
  assert.ok(state.hudOpacity < 1.0);
  assert.ok(state.hudOpacity >= 0.0);
});

test('reverse progress returns deterministic identical states', () => {
  const forwardAt20 = computeHeliportState(0.20);
  const forwardAt60 = computeHeliportState(0.60);
  const backTo20 = computeHeliportState(0.20);

  assert.deepEqual(forwardAt20, backTo20);
  assert.notDeepEqual(forwardAt20, forwardAt60);
});

test('out-of-range progress settles at valid bounds', () => {
  assert.deepEqual(computeHeliportState(-0.5), computeHeliportState(0));
  assert.deepEqual(computeHeliportState(1.5), computeHeliportState(1));
});
