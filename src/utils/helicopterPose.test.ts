import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAssemblyState, ASSEMBLY_GROUPS } from './helicopterPose';

test('computeAssemblyState at progress 0 has fully assembled helicopter', () => {
  const state = computeAssemblyState(0);
  assert.equal(state.headingOpacity, 1.0);
  assert.equal(state.stageName, 'assembled-intro');
  assert.equal(state.departureProgress, 0);
  assert.equal(state.rotorAngle, 0);

  for (const g of ASSEMBLY_GROUPS) {
    assert.equal(state.groupFactors[g.name], 0);
  }
});

test('computeAssemblyState at 10% holds heading and assembled state', () => {
  const state = computeAssemblyState(0.10);
  assert.equal(state.headingOpacity, 1.0);
  assert.equal(state.stageName, 'assembled-intro');
  for (const g of ASSEMBLY_GROUPS) {
    assert.equal(state.groupFactors[g.name], 0);
  }
});

test('computeAssemblyState at 47% is in exploded-hold', () => {
  const state = computeAssemblyState(0.47);
  assert.equal(state.headingOpacity, 0.0);
  assert.equal(state.stageName, 'exploded-hold');
  for (const g of ASSEMBLY_GROUPS) {
    assert.equal(state.groupFactors[g.name], 1.0);
  }
});

test('computeAssemblyState at 85% is in reassembled-hold with zero offsets', () => {
  const state = computeAssemblyState(0.85);
  assert.equal(state.stageName, 'reassembled-hold');
  assert.equal(state.departureProgress, 0);
  for (const g of ASSEMBLY_GROUPS) {
    assert.equal(state.groupFactors[g.name], 0.0);
  }
});

test('computeAssemblyState at 95% is in departure with positive rotor spin and lift', () => {
  const state = computeAssemblyState(0.95);
  assert.equal(state.stageName, 'departure');
  assert.ok(state.departureProgress > 0);
  assert.ok(state.rotorAngle > 0);
  assert.ok(state.liftPosition[1] > 0);
  // Groups themselves are completely reassembled (factor 0) during departure
  for (const g of ASSEMBLY_GROUPS) {
    assert.equal(state.groupFactors[g.name], 0.0);
  }
});

test('reverse progress returns state deterministically', () => {
  const forwardAt10 = computeAssemblyState(0.10);
  const forwardAt50 = computeAssemblyState(0.50);
  const backTo10 = computeAssemblyState(0.10);

  assert.deepEqual(forwardAt10, backTo10);
  assert.notDeepEqual(forwardAt10, forwardAt50);
});

test('prepared AW139 pose data contains five independent main blades', () => {
  assert.equal(ASSEMBLY_GROUPS.filter((g) => /^mainBlade\d+$/.test(g.name)).length, 5);
  assert.equal(ASSEMBLY_GROUPS.length, 21);
});

test('out-of-range progress settles at valid scene endpoints', () => {
  assert.deepEqual(computeAssemblyState(-1), computeAssemblyState(0));
  assert.deepEqual(computeAssemblyState(2), computeAssemblyState(1));
});

test('landing gear remains above the floor while components separate', () => {
  const state = computeAssemblyState(0.47);
  for (const g of ASSEMBLY_GROUPS.filter((group) => group.name.startsWith('landingGear'))) {
    assert.ok(state.explosionLift + g.offset[1] * state.groupFactors[g.name] >= 0);
  }
});
