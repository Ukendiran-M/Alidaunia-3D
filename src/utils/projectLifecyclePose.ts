/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M3: Project Lifecycle 3D Evolution Pose Logic
 * Calculates state, camera trajectories, and phase reveals for:
 * 01. Analisi (contour lines & site footprint)
 * 02. Progetto (structural wireframe & alignment axes)
 * 03. Realizzazione (material reveal of physical heliport slab & markings)
 * 04. Gestione (service path highlight, active illumination & operational hold)
 */

export interface PhaseTiming {
  index: number;
  id: string;
  name: string;
  start: number;
  holdStart: number;
  holdEnd: number;
  end: number;
}

export const LIFECYCLE_PHASES: PhaseTiming[] = [
  { index: 0, id: 'analisi', name: 'Analisi', start: 0.0, holdStart: 0.04, holdEnd: 0.20, end: 0.25 },
  { index: 1, id: 'progetto', name: 'Progetto', start: 0.25, holdStart: 0.29, holdEnd: 0.45, end: 0.50 },
  { index: 2, id: 'realizzazione', name: 'Realizzazione', start: 0.50, holdStart: 0.54, holdEnd: 0.70, end: 0.75 },
  { index: 3, id: 'gestione', name: 'Gestione', start: 0.75, holdStart: 0.79, holdEnd: 0.94, end: 1.0 },
];

export interface ProjectLifecycleState {
  progress: number;
  activePhaseIndex: number; // 0, 1, 2, 3
  phaseProgress: number;     // 0 to 1 within current phase
  phaseName: string;
  // Visual layer opacities / reveal weights
  contourOpacity: number;       // Topographical survey contours
  blueprintOpacity: number;     // CAD structural wireframe & axes
  physicalReveal: number;       // Material reveal of real heliport (0 = invisible, 1 = fully built)
  managementHighlight: number;  // Operational service path & AVL lighting boost
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  backgroundDarkening: number;  // 0 = #F5F6F7 studio, 1 = dark navy transition for M4
  hudOpacity: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Fixed camera waypoints for the 4 phases
// All look at the same site center [0, 0.35, 0]
const CAMERA_WAYPOINTS: [number, number, number][] = [
  [14.5, 12.0, 14.5],  // Phase 0 Analisi: Higher survey viewpoint
  [13.0, 10.5, 13.0],  // Phase 1 Progetto: Architectural CAD angle
  [12.5, 9.0, 13.5],   // Phase 2 Realizzazione: Volumetric construction angle
  [13.5, 9.5, 14.0],   // Phase 3 Gestione: Operational wide view
];

/**
 * Computes deterministic 3D representation and camera for Section M3 based on progress p in [0, 1].
 */
export function computeLifecycleState(rawProgress: number): ProjectLifecycleState {
  const p = clamp(rawProgress, 0, 1);

  // Determine active phase
  let activePhaseIndex = 0;
  if (p >= 0.75) {
    activePhaseIndex = 3;
  } else if (p >= 0.50) {
    activePhaseIndex = 2;
  } else if (p >= 0.25) {
    activePhaseIndex = 1;
  } else {
    activePhaseIndex = 0;
  }

  const phaseConfig = LIFECYCLE_PHASES[activePhaseIndex];
  const phaseProgress = (p - phaseConfig.start) / (phaseConfig.end - phaseConfig.start);

  // 1. Contour opacity: strongest in Analisi (0..0.25), smoothly fades out during Progetto (0.25..0.40)
  let contourOpacity = 0;
  if (p < 0.25) {
    contourOpacity = 0.85;
  } else if (p < 0.40) {
    contourOpacity = 0.85 * (1 - smoothstep(0.25, 0.40, p));
  }

  // 2. Blueprint / CAD wireframe opacity: rises 0.20..0.28, holds 0.28..0.48, fades out 0.48..0.62
  let blueprintOpacity = 0;
  if (p >= 0.18 && p < 0.28) {
    blueprintOpacity = smoothstep(0.18, 0.28, p);
  } else if (p >= 0.28 && p < 0.48) {
    blueprintOpacity = 1.0;
  } else if (p >= 0.48 && p < 0.65) {
    blueprintOpacity = 1.0 - smoothstep(0.48, 0.65, p);
  }

  // 3. Physical heliport reveal: begins revealing at 0.48, reaches full solid presence by 0.70, stays 1.0
  let physicalReveal = 0;
  if (p < 0.48) {
    physicalReveal = 0;
  } else if (p < 0.70) {
    physicalReveal = smoothstep(0.48, 0.70, p);
  } else {
    physicalReveal = 1.0;
  }

  // 4. Management highlight: active in Gestione (0.75..1.00)
  let managementHighlight = 0;
  if (p >= 0.75) {
    managementHighlight = smoothstep(0.75, 0.88, p);
  }

  // 5. Background darkening: at the very tail of Gestione (0.92..1.00) to blend into M4's navy
  let backgroundDarkening = 0;
  if (p >= 0.90) {
    backgroundDarkening = smoothstep(0.90, 1.0, p);
  }

  // Camera interpolation between waypoints
  const wp0 = CAMERA_WAYPOINTS[0];
  const wp1 = CAMERA_WAYPOINTS[1];
  const wp2 = CAMERA_WAYPOINTS[2];
  const wp3 = CAMERA_WAYPOINTS[3];

  let camX = wp0[0];
  let camY = wp0[1];
  let camZ = wp0[2];

  if (p < 0.25) {
    // slight drift in phase 0
    const blend = smoothstep(0, 0.25, p);
    camX = wp0[0] + (wp1[0] - wp0[0]) * blend * 0.3;
    camY = wp0[1] + (wp1[1] - wp0[1]) * blend * 0.3;
    camZ = wp0[2] + (wp1[2] - wp0[2]) * blend * 0.3;
  } else if (p < 0.50) {
    const blend = smoothstep(0.25, 0.50, p);
    camX = wp0[0] + (wp1[0] - wp0[0]) * blend;
    camY = wp0[1] + (wp1[1] - wp0[1]) * blend;
    camZ = wp0[2] + (wp1[2] - wp0[2]) * blend;
  } else if (p < 0.75) {
    const blend = smoothstep(0.50, 0.75, p);
    camX = wp1[0] + (wp2[0] - wp1[0]) * blend;
    camY = wp1[1] + (wp2[1] - wp1[1]) * blend;
    camZ = wp1[2] + (wp2[2] - wp1[2]) * blend;
  } else {
    const blend = smoothstep(0.75, 1.0, p);
    camX = wp2[0] + (wp3[0] - wp2[0]) * blend;
    camY = wp2[1] + (wp3[1] - wp2[1]) * blend;
    camZ = wp2[2] + (wp3[2] - wp2[2]) * blend;
  }

  // HUD opacity: solid throughout reading, soft fade at exit
  const hudOpacity = p >= 0.95 ? 1.0 - smoothstep(0.95, 1.0, p) : 1.0;

  return {
    progress: p,
    activePhaseIndex,
    phaseProgress,
    phaseName: phaseConfig.name,
    contourOpacity,
    blueprintOpacity,
    physicalReveal,
    managementHighlight,
    cameraPosition: [camX, camY, camZ],
    cameraTarget: [0, 0.35, 0],
    backgroundDarkening,
    hudOpacity,
  };
}
