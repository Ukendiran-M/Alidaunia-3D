/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M5: Conceptual Network Pose Logic
 * Calculates 3D coordinates, node elevations, progressive curve draw ranges,
 * and camera trajectory across scroll progress [0, 1].
 */

import {
  M5_NETWORK_NODES,
  M5_NETWORK_CONNECTIONS,
  type NetworkNode,
  type NetworkConnection,
} from '../config/manifestoContent';

export interface Node3DPosition {
  id: string;
  name: string;
  role: string;
  isHub: boolean;
  x: number; // 3D world X on board
  y: number; // 3D world Y (height)
  z: number; // 3D world Z on board
  visibility: number; // 0..1
}

export interface Connection3DData {
  fromId: string;
  toId: string;
  fromPos: [number, number, number];
  toPos: [number, number, number];
  midPos: [number, number, number];
  drawProgress: number; // 0..1
}

export type NetworkPhase = 'board-focus' | 'drawing-network' | 'network-hold';

export interface NetworkState {
  progress: number;
  phase: NetworkPhase;
  boardReveal: number;    // 0..1
  hubFocus: number;       // 0..1 (Foggia prominence)
  nodes: Node3DPosition[];
  connections: Connection3DData[];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  activeNodeId: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Convert 2D schematic percentage coordinates [0, 100] to 3D board coordinates
// Board dimensions: Width 18 units (X: -9 to +9), Depth 13 units (Z: -6.5 to +6.5)
export function mapSchematicTo3D(node: NetworkNode): [number, number, number] {
  const x = -8.5 + (node.x / 100) * 17.0;
  const y = 0.28; // Board surface elevation
  const z = -5.8 + (node.y / 100) * 11.6;
  return [x, y, z];
}

// Connection draw time windows within [0.20, 0.75]
// Staggered sequence connecting out from Foggia hub across the regional network
const CONNECTION_TIMINGS: { start: number; end: number }[] = [
  { start: 0.20, end: 0.35 }, // foggia -> tremiti
  { start: 0.26, end: 0.42 }, // foggia -> vieste
  { start: 0.32, end: 0.48 }, // foggia -> san-giovanni
  { start: 0.42, end: 0.58 }, // vieste -> peschici
  { start: 0.50, end: 0.64 }, // peschici -> tremiti
  { start: 0.56, end: 0.70 }, // san-giovanni -> rete-regionale
  { start: 0.62, end: 0.75 }, // foggia -> rete-regionale
];

/**
 * Computes deterministic 3D state for Section M5.
 */
export function computeNetworkState(rawProgress: number): NetworkState {
  const p = clamp(rawProgress, 0, 1);

  // 1. Phase categorization
  let phase: NetworkPhase = 'board-focus';
  if (p < 0.20) {
    phase = 'board-focus';
  } else if (p < 0.75) {
    phase = 'drawing-network';
  } else {
    phase = 'network-hold';
  }

  // 2. Board reveal & hub focus
  const boardReveal = smoothstep(0.0, 0.20, p);
  const hubFocus = smoothstep(0.05, 0.25, p);

  // Map nodes to 3D with progressive visibilities
  const nodeMap = new Map<string, NetworkNode>();
  for (const n of M5_NETWORK_NODES) {
    nodeMap.set(n.id, n);
  }

  const nodes: Node3DPosition[] = M5_NETWORK_NODES.map((n) => {
    const [x, y, z] = mapSchematicTo3D(n);
    let visibility = 0;
    if (n.isHub) {
      // Hub resolves in first 20%
      visibility = smoothstep(0.0, 0.20, p);
    } else {
      // Regional nodes reveal smoothly between 0.18 and 0.45
      visibility = smoothstep(0.18, 0.45, p);
    }
    return {
      id: n.id,
      name: n.name,
      role: n.role,
      isHub: !!n.isHub,
      x,
      y,
      z,
      visibility,
    };
  });

  // 3. Connections with spatial arcs and absolute draw ranges
  const connections: Connection3DData[] = M5_NETWORK_CONNECTIONS.map((conn, idx) => {
    const fromNode = nodeMap.get(conn.from);
    const toNode = nodeMap.get(conn.to);

    const fromPos = fromNode ? mapSchematicTo3D(fromNode) : [0, 0, 0] as [number, number, number];
    const toPos = toNode ? mapSchematicTo3D(toNode) : [0, 0, 0] as [number, number, number];

    // Compute spatial arc midpoint
    const dx = toPos[0] - fromPos[0];
    const dz = toPos[2] - fromPos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const arcHeight = 0.6 + dist * 0.12;

    const midPos: [number, number, number] = [
      (fromPos[0] + toPos[0]) / 2,
      fromPos[1] + arcHeight,
      (fromPos[2] + toPos[2]) / 2,
    ];

    const timing = CONNECTION_TIMINGS[idx] ?? { start: 0.25, end: 0.70 };
    const drawProgress = p <= timing.start ? 0 : p >= timing.end ? 1 : smoothstep(timing.start, timing.end, p);

    return {
      fromId: conn.from,
      toId: conn.to,
      fromPos,
      toPos,
      midPos,
      drawProgress,
    };
  });

  // 4. Camera trajectory:
  // Starts with low overview framing the board, tilts slightly up into an open architectural review
  let camX = 0;
  let camY = 16.5;
  let camZ = 16.0;

  if (p < 0.20) {
    const t = smoothstep(0, 0.20, p);
    camX = 1.0 * (1 - t);
    camY = 15.0 * (1 - t) + 16.5 * t;
    camZ = 17.5 * (1 - t) + 16.0 * t;
  } else if (p < 0.75) {
    const t = smoothstep(0.20, 0.75, p);
    camX = 0;
    camY = 16.5 * (1 - t) + 18.2 * t;
    camZ = 16.0 * (1 - t) + 14.2 * t;
  } else {
    camX = 0;
    camY = 18.2;
    camZ = 14.2;
  }

  // 5. Active node determination for legend tracking
  let activeNodeId = 'foggia';
  if (p < 0.25) {
    activeNodeId = 'foggia';
  } else if (p < 0.38) {
    activeNodeId = 'tremiti';
  } else if (p < 0.48) {
    activeNodeId = 'vieste';
  } else if (p < 0.58) {
    activeNodeId = 'peschici';
  } else if (p < 0.68) {
    activeNodeId = 'san-giovanni';
  } else {
    activeNodeId = 'rete-regionale';
  }

  return {
    progress: p,
    phase,
    boardReveal,
    hubFocus,
    nodes,
    connections,
    cameraPosition: [camX, camY, camZ],
    cameraTarget: [0, 0, 0],
    activeNodeId,
  };
}
