/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Heliport Infrastructure 3D Assembly Pose Logic
 * Calculates deterministic explosion, mating, and camera trajectories for Section M2.
 */

export interface HeliportGroupTiming {
  name: string;
  start: number; // progress where assembly starts
  end: number;   // progress where assembly completes
  initialOffset: [number, number, number];
}

export const HELIPORT_GROUPS: HeliportGroupTiming[] = [
  {
    name: 'foundation',
    start: 0.15,
    end: 0.28,
    initialOffset: [0, -2.0, 0],
  },
  {
    name: 'slab',
    start: 0.22,
    end: 0.35,
    initialOffset: [0, -0.9, 0],
  },
  {
    name: 'markings',
    start: 0.35,
    end: 0.55,
    initialOffset: [0, 1.4, 0],
  },
  {
    name: 'lighting',
    start: 0.55,
    end: 0.68,
    initialOffset: [0, 1.8, 0],
  },
  {
    name: 'serviceZone',
    start: 0.60,
    end: 0.75,
    initialOffset: [0, 1.2, 0],
  },
];

export type InfrastructurePhase =
  | 'separated-hold'
  | 'foundation-deck'
  | 'surface-markings'
  | 'systems-perimeter'
  | 'assembled-hold'
  | 'release';

export interface HeliportAssemblyState {
  progress: number;
  phase: InfrastructurePhase;
  activeLayerIndex: number; // 0 to 4 corresponding to M2_INFRASTRUCTURE_LAYERS
  groupSeparations: Record<string, number>; // 1 = fully separated, 0 = fully assembled
  cameraOffset: [number, number, number]; // subtle camera movement during hold/assembly
  hudOpacity: number; // opacity of floating HUD layer indicators
  isAssembled: boolean;
}

// Smooth cubic ease-in-out
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Computes deterministic heliport group positions, active layer index, and camera state.
 * Absolute progress in [0, 1].
 */
export function computeHeliportState(rawProgress: number): HeliportAssemblyState {
  const p = clamp(rawProgress, 0, 1);

  // Group separation factors (1.0 = exploded, 0.0 = assembled at rest)
  const groupSeparations: Record<string, number> = {};

  for (const group of HELIPORT_GROUPS) {
    if (p <= group.start) {
      groupSeparations[group.name] = 1.0;
    } else if (p >= group.end) {
      groupSeparations[group.name] = 0.0;
    } else {
      const normalized = (p - group.start) / (group.end - group.start);
      // As p increases from start to end, separation decreases from 1 to 0
      groupSeparations[group.name] = 1.0 - easeInOutCubic(normalized);
    }
  }

  // Phase and active layer mapping
  let phase: InfrastructurePhase = 'separated-hold';
  let activeLayerIndex = 0;
  let hudOpacity = 1.0;

  if (p < 0.15) {
    phase = 'separated-hold';
    activeLayerIndex = 0; // Overview / Foundation
    hudOpacity = 1.0;
  } else if (p < 0.35) {
    phase = 'foundation-deck';
    // Transition between layer 0 (foundation) and layer 1 (slab)
    activeLayerIndex = p < 0.25 ? 0 : 1;
    hudOpacity = 1.0;
  } else if (p < 0.55) {
    phase = 'surface-markings';
    activeLayerIndex = 2; // Markings
    hudOpacity = 1.0;
  } else if (p < 0.75) {
    phase = 'systems-perimeter';
    // Transition between layer 3 (lighting) and layer 4 (perimeter & windsock)
    activeLayerIndex = p < 0.65 ? 3 : 4;
    hudOpacity = 1.0;
  } else if (p < 0.90) {
    phase = 'assembled-hold';
    activeLayerIndex = 4; // Complete system overview
    hudOpacity = 1.0;
  } else {
    phase = 'release';
    activeLayerIndex = 4;
    // Fade HUD out gently as page releases into section M3
    hudOpacity = 1.0 - easeInOutCubic((p - 0.90) / 0.10);
  }

  // Camera subtle volume accentuation between 0.75 and 0.90
  let cameraOffset: [number, number, number] = [0, 0, 0];
  if (p >= 0.75 && p <= 0.90) {
    const holdProgress = (p - 0.75) / 0.15;
    const wave = Math.sin(holdProgress * Math.PI);
    // Gentle rotation/elevation orbit to highlight 3D depth and finish
    cameraOffset = [wave * 0.45, wave * 0.2, wave * 0.35];
  }

  return {
    progress: p,
    phase,
    activeLayerIndex,
    groupSeparations,
    cameraOffset,
    hudOpacity,
    isAssembled: p >= 0.75,
  };
}
