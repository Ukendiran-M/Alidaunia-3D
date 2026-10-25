/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Pure Helicopter Pose and Assembly Calculations
 */

export interface GroupConfig {
  name: string;
  offset: [number, number, number];
  order: number;
}

export const ASSEMBLY_GROUPS: GroupConfig[] = [
  { name: 'cabinInterior', offset: [0, -0.22, 0], order: 0 },
  { name: 'landingGear', offset: [0, -1, 0], order: 1 },
  { name: 'cabinShell', offset: [0, 0.55, 0], order: 2 },
  { name: 'tailAssembly', offset: [-2.6, 0.35, 0], order: 3 },
  { name: 'glazingLeft', offset: [0, 0.25, -1.65], order: 4 },
  { name: 'glazingRight', offset: [0, 0.25, 1.65], order: 4 },
  { name: 'engineLeft', offset: [0, 1.35, -1.45], order: 5 },
  { name: 'engineRight', offset: [0, 1.35, 1.45], order: 5 },
  { name: 'transmission', offset: [0, 1.65, 0], order: 6 },
  { name: 'tailRotor', offset: [0, 0, -0.55], order: 7 },
  { name: 'mainRotor', offset: [0, 2.2, 0], order: 8 },
  { name: 'rotorHub', offset: [0, 0, 0], order: 8 },
  { name: 'rotorBlade01', offset: [-0.6933, 0.08, -0.9797], order: 10 },
  { name: 'rotorBlade02', offset: [-0.9797, 0.08, 0.6934], order: 11 },
  { name: 'rotorBlade03', offset: [0.6934, 0.08, 0.9797], order: 12 },
  { name: 'rotorBlade04', offset: [0.9797, 0.08, -0.6934], order: 13 },
];

export interface HelicopterAssemblyState {
  headingOpacity: number;
  // Per-group explosion factor from 0.0 (assembled) to 1.0 (fully exploded)
  groupFactors: Record<string, number>;
  // Global departure factor 0.0 to 1.0 (lift and fly away)
  departureProgress: number;
  rotorAngle: number;
  liftPosition: [number, number, number];
  bankRotation: [number, number, number];
  stageName: 'assembled-intro' | 'exploding' | 'exploded-hold' | 'reassembling' | 'reassembled-hold' | 'departure';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Computes deterministic poses for all groups from scroll progress [0, 1].
 */
export function computeAssemblyState(progress: number): HelicopterAssemblyState {
  const p = clamp(progress, 0, 1);

  // 1. Heading Opacity: 1.0 during 0..0.12, fades to 0 by 0.22
  let headingOpacity = 1.0;
  if (p > 0.12 && p <= 0.22) {
    headingOpacity = 1.0 - smoothstep(0.12, 0.22, p);
  } else if (p > 0.22 && p < 0.88) {
    headingOpacity = 0.0;
  } else if (p >= 0.88) {
    headingOpacity = 0.0;
  }

  // Determine stage
  let stageName: HelicopterAssemblyState['stageName'] = 'assembled-intro';
  if (p > 0.12 && p <= 0.43) stageName = 'exploding';
  else if (p > 0.43 && p <= 0.51) stageName = 'exploded-hold';
  else if (p > 0.51 && p <= 0.80) stageName = 'reassembling';
  else if (p > 0.80 && p <= 0.88) stageName = 'reassembled-hold';
  else if (p > 0.88) stageName = 'departure';

  // Compute per-group explosion factor [0..1]
  const groupFactors: Record<string, number> = {};

  if (p <= 0.12) {
    // 0 - 12%: Fully assembled
    for (const g of ASSEMBLY_GROUPS) {
      groupFactors[g.name] = 0;
    }
  } else if (p <= 0.43) {
    // 12 - 43%: Explode outward
    // Optional slight stagger based on order (0 to 13)
    const tGlobal = (p - 0.12) / (0.43 - 0.12);
    for (const g of ASSEMBLY_GROUPS) {
      // stagger range: start slightly offset by order
      const startT = (g.order / 14) * 0.25;
      const t = clamp((tGlobal - startT) / (1 - startT), 0, 1);
      groupFactors[g.name] = smoothstep(0, 1, t);
    }
  } else if (p <= 0.51) {
    // 43 - 51%: Hold fully exploded view
    for (const g of ASSEMBLY_GROUPS) {
      groupFactors[g.name] = 1.0;
    }
  } else if (p <= 0.80) {
    // 51 - 80%: Reassemble with restrained stagger
    const tGlobal = (p - 0.51) / (0.80 - 0.51);
    for (const g of ASSEMBLY_GROUPS) {
      // reverse order or staggered return
      const revOrder = 13 - g.order;
      const startT = (revOrder / 14) * 0.25;
      const t = clamp((tGlobal - startT) / (1 - startT), 0, 1);
      // factor goes from 1.0 back to 0.0
      groupFactors[g.name] = 1.0 - smoothstep(0, 1, t);
    }
  } else {
    // 80 - 100%: Reassembled
    for (const g of ASSEMBLY_GROUPS) {
      groupFactors[g.name] = 0.0;
    }
  }

  // 88 - 100%: Rotor spin and departure flight
  let departureProgress = 0.0;
  let rotorAngle = 0.0;
  const liftPosition: [number, number, number] = [0, 0, 0];
  const bankRotation: [number, number, number] = [0, 0, 0];

  if (p > 0.88) {
    departureProgress = smoothstep(0.88, 1.0, p);
    // Rotor spins several full rotations as it takes off
    rotorAngle = departureProgress * Math.PI * 16;
    // Lift vertically, bank, and depart along controlled trajectory
    liftPosition[0] = departureProgress * 4.2;
    liftPosition[1] = departureProgress * 5.8;
    liftPosition[2] = -departureProgress * 4.6;
    // Slight nose dip (pitch X) and slight roll (bank Z)
    bankRotation[0] = departureProgress * 0.12;
    bankRotation[1] = departureProgress * 0.08;
    bankRotation[2] = -departureProgress * 0.15;
  }

  return {
    headingOpacity,
    groupFactors,
    departureProgress,
    rotorAngle,
    liftPosition,
    bankRotation,
    stageName,
  };
}
