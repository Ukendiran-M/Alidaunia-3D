import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNetworkState, mapSchematicTo3D } from './networkPose';
import { M5_NETWORK_NODES, M5_NETWORK_CONNECTIONS } from '../config/manifestoContent';

test('all network connections have valid endpoints in node definitions', () => {
  const nodeIds = new Set(M5_NETWORK_NODES.map((n) => n.id));
  assert.equal(nodeIds.size, 6);

  for (const conn of M5_NETWORK_CONNECTIONS) {
    assert.ok(nodeIds.has(conn.from), `Connection from '${conn.from}' must exist in nodes`);
    assert.ok(nodeIds.has(conn.to), `Connection to '${conn.to}' must exist in nodes`);
  }
});

test('computeNetworkState at progress 0 is in board-focus with Foggia resolving', () => {
  const state = computeNetworkState(0);
  assert.equal(state.phase, 'board-focus');
  assert.equal(state.progress, 0);
  assert.equal(state.connections.every((c) => c.drawProgress === 0), true);
  assert.equal(state.nodes.find((n) => n.id === 'foggia')?.isHub, true);
});

test('computeNetworkState at progress 0.40 has active curve progress', () => {
  const state = computeNetworkState(0.40);
  assert.equal(state.phase, 'drawing-network');
  const drawnCount = state.connections.filter((c) => c.drawProgress > 0).length;
  assert.ok(drawnCount >= 2, 'At least 2 connections should be drawing at 40%');
});

test('computeNetworkState at progress 0.85 holds all 7 connections completed', () => {
  const state = computeNetworkState(0.85);
  assert.equal(state.phase, 'network-hold');
  assert.equal(state.connections.length, 7);
  assert.equal(state.connections.every((c) => c.drawProgress === 1), true);
  assert.equal(state.nodes.every((n) => n.visibility === 1), true);
});

test('reverse progress returns exact deterministic states', () => {
  const forwardAt30 = computeNetworkState(0.30);
  const forwardAt70 = computeNetworkState(0.70);
  const backTo30 = computeNetworkState(0.30);

  assert.deepEqual(forwardAt30, backTo30);
  assert.notDeepEqual(forwardAt30, forwardAt70);
});

test('clamping handles out-of-range bounds gracefully', () => {
  assert.deepEqual(computeNetworkState(-0.5), computeNetworkState(0));
  assert.deepEqual(computeNetworkState(1.5), computeNetworkState(1));
});

test('mapSchematicTo3D projects nodes inside the board bounds', () => {
  for (const n of M5_NETWORK_NODES) {
    const [x, y, z] = mapSchematicTo3D(n);
    assert.ok(x >= -9 && x <= 9, `X ${x} within board width`);
    assert.ok(z >= -6.5 && z <= 6.5, `Z ${z} within board depth`);
    assert.equal(y, 0.28);
  }
});
