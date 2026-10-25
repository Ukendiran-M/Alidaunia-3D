import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProjectDrawingState, DRAWING_SYSTEMS } from './projectDrawingPose';

test('computeProjectDrawingState at progress 0 is in rolled-hold with unrollProgress 0', () => {
  const state = computeProjectDrawingState(0);
  assert.equal(state.phase, 'rolled-hold');
  assert.equal(state.unrollProgress, 0);
  assert.equal(state.drawingProgress, 0);
  assert.equal(state.systemVisibilities.every((v) => v === 0), true);
});

test('computeProjectDrawingState at 30% is unrolling paper smoothly', () => {
  const state = computeProjectDrawingState(0.30);
  assert.equal(state.phase, 'unrolling');
  assert.ok(state.unrollProgress > 0 && state.unrollProgress < 1);
  assert.equal(state.drawingProgress, 0);
});

test('computeProjectDrawingState at 45% has paper fully flattened', () => {
  const state = computeProjectDrawingState(0.45);
  assert.equal(state.unrollProgress, 1.0);
  assert.equal(state.drawingProgress, 0);
});

test('computeProjectDrawingState at 60% has progressive linework visible', () => {
  const state = computeProjectDrawingState(0.60);
  assert.equal(state.phase, 'linework-reveal');
  assert.equal(state.unrollProgress, 1.0);
  assert.ok(state.drawingProgress > 0 && state.drawingProgress < 1);
  assert.ok(state.systemVisibilities[0] > 0);
  assert.ok(state.systemVisibilities[1] > 0);
});

test('computeProjectDrawingState at 80% is in completed-hold with all 5 systems visible', () => {
  const state = computeProjectDrawingState(0.80);
  assert.equal(state.phase, 'completed-hold');
  assert.equal(state.unrollProgress, 1.0);
  assert.equal(state.drawingProgress, 1.0);
  assert.equal(state.systemVisibilities.every((v) => v === 1), true);
});

test('reverse progress returns exact deterministic states', () => {
  const forwardAt25 = computeProjectDrawingState(0.25);
  const forwardAt65 = computeProjectDrawingState(0.65);
  const backTo25 = computeProjectDrawingState(0.25);

  assert.deepEqual(forwardAt25, backTo25);
  assert.notDeepEqual(forwardAt25, forwardAt65);
});

test('clamping handles out-of-range bounds gracefully', () => {
  assert.deepEqual(computeProjectDrawingState(-0.5), computeProjectDrawingState(0));
  assert.deepEqual(computeProjectDrawingState(1.5), computeProjectDrawingState(1));
});
