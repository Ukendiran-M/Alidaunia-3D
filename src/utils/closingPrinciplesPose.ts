/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M6: Closing Principles Pose Logic
 * Calculates a single gentle camera settle during section entry,
 * bringing the finished architectural heliport into a quiet, balanced three-quarter view.
 */

export interface ClosingPrinciplesState {
  progress: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  modelRotationY: number;
  modelScale: number;
  isSettled: boolean;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Camera positions in Three.js world units
const CAM_START: [number, number, number] = [2.5, 10.8, 16.5];
const CAM_SETTLED: [number, number, number] = [5.4, 9.2, 13.6];

/**
 * Computes deterministic camera and model orientation for Section M6 closing scene.
 * Settles gently between 0.0 and 1.0 of the entry scrub, then remains stationary.
 */
export function computeClosingPrinciplesState(rawProgress: number): ClosingPrinciplesState {
  const p = clamp(rawProgress, 0, 1);
  const t = smoothstep(0.0, 1.0, p);

  const camX = CAM_START[0] * (1 - t) + CAM_SETTLED[0] * t;
  const camY = CAM_START[1] * (1 - t) + CAM_SETTLED[1] * t;
  const camZ = CAM_START[2] * (1 - t) + CAM_SETTLED[2] * t;

  const modelRotationY = (1 - t) === 0 ? 0 : (1 - t) * -0.08;
  const modelScale = 0.65; // Quiet architectural scale

  return {
    progress: p,
    cameraPosition: [camX, camY, camZ],
    cameraTarget: [0, 0.4, 0],
    modelRotationY,
    modelScale,
    isSettled: p >= 0.999,
  };
}
