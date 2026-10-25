/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M4: Operations Reveal Pose Logic
 * Calculates structural bevelled panel parting, image aperture widening (78% -> 100%),
 * and perspective settling across scroll progress [0, 1].
 */

export interface OperationsRevealState {
  progress: number;
  revealFactor: number;     // 0 = closed aperture, 1 = fully opened
  panelOffsetLeft: number;  // X position of left bevelled panel
  panelOffsetRight: number; // X position of right bevelled panel
  imageScale: number;       // 0.78 -> 1.0
  tiltRotation: [number, number, number]; // [pitch, yaw, roll]
  isSettled: boolean;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const INITIAL_IMAGE_SCALE = 0.78;
const SETTLED_IMAGE_SCALE = 1.0;

// Panel positions in Three.js world units
// Closed: aperture width ~6 units (partially covering the 16-unit wide photo)
// Open: aperture width > 17 units (completely cleared outside the photo)
const PANEL_TRAVEL_DISTANCE = 5.8;

/**
 * Computes deterministic reveal pose for Section M4.
 * Opening reveal occurs across progress [0.0, 0.65], then rests fully settled for reading [0.65, 1.0].
 */
export function computeOperationsRevealState(rawProgress: number): OperationsRevealState {
  const p = clamp(rawProgress, 0, 1);

  // Reveal factor completes by 0.65 of the scrub trigger
  const revealFactor = smoothstep(0.0, 0.65, p);

  // Structural bevelled panels parting to the left and right
  const panelOffsetLeft = revealFactor === 0 ? 0 : -revealFactor * PANEL_TRAVEL_DISTANCE;
  const panelOffsetRight = revealFactor * PANEL_TRAVEL_DISTANCE;

  // Image scales up from 78% to 100%
  const imageScale = INITIAL_IMAGE_SCALE + (SETTLED_IMAGE_SCALE - INITIAL_IMAGE_SCALE) * revealFactor;

  // Perspective tilt relaxes to level [0, 0, 0]
  const tiltPitch = (1 - revealFactor) * 0.055;
  const tiltYaw = (1 - revealFactor) === 0 ? 0 : (1 - revealFactor) * -0.045;
  const tiltRoll = 0;

  const isSettled = revealFactor >= 0.999;

  return {
    progress: p,
    revealFactor,
    panelOffsetLeft,
    panelOffsetRight,
    imageScale,
    tiltRotation: [tiltPitch, tiltYaw, tiltRoll],
    isSettled,
  };
}
