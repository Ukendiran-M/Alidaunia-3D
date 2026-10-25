/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M2: Architectural Project Drawing Pose Logic
 * Calculates paper unrolling curvature, progressive linework reveals,
 * active system indicators, and camera positioning across scroll progress [0, 1].
 */

export interface DrawingSystemInfo {
  index: number;
  id: string;
  name: string;
  start: number; // progress where this system begins drawing
  end: number;   // progress where this system is fully drawn
}

export const DRAWING_SYSTEMS: DrawingSystemInfo[] = [
  { index: 0, id: 'layer-1', name: '01. Base Geotecnica & Drenaggio', start: 0.45, end: 0.53 },
  { index: 1, id: 'layer-2', name: '02. Piastra Strutturale FATO', start: 0.51, end: 0.59 },
  { index: 2, id: 'layer-3', name: '03. Cerchio TLOF & Marcatura H', start: 0.57, end: 0.65 },
  { index: 3, id: 'layer-4', name: '04. Circuito Luci Perimetrali & Antincendio', start: 0.63, end: 0.71 },
  { index: 4, id: 'layer-5', name: '05. Fascia di Sicurezza & Vie di Transito', start: 0.69, end: 0.75 },
];

export type DrawingPhase =
  | 'rolled-hold'       // 0 - 15%
  | 'unrolling'         // 15 - 45%
  | 'linework-reveal'   // 45 - 75%
  | 'completed-hold'    // 75 - 90%
  | 'release';          // 90 - 100%

export interface ProjectDrawingState {
  progress: number;
  phase: DrawingPhase;
  unrollProgress: number;     // 0 = partially rolled coil, 1 = fully flattened sheet
  drawingProgress: number;    // 0 = clean ivory paper, 1 = fully drawn linework
  activeSystemIndex: number;  // 0 to 4
  systemVisibilities: number[]; // opacity/reveal for each of the 5 systems (0..1)
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  hudOpacity: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Computes deterministic state for Section M2 architectural project drawing.
 */
export function computeProjectDrawingState(rawProgress: number): ProjectDrawingState {
  const p = clamp(rawProgress, 0, 1);

  // Phase categorization
  let phase: DrawingPhase = 'rolled-hold';
  if (p < 0.15) {
    phase = 'rolled-hold';
  } else if (p < 0.45) {
    phase = 'unrolling';
  } else if (p < 0.75) {
    phase = 'linework-reveal';
  } else if (p < 0.90) {
    phase = 'completed-hold';
  } else {
    phase = 'release';
  }

  // 1. Unroll progress: 0 at p <= 0.15, 1 at p >= 0.45
  const unrollProgress = p <= 0.15 ? 0 : p >= 0.45 ? 1 : smoothstep(0.15, 0.45, p);

  // 2. Drawing linework progress: 0 at p <= 0.45, 1 at p >= 0.75
  const drawingProgress = p <= 0.45 ? 0 : p >= 0.75 ? 1 : smoothstep(0.45, 0.75, p);

  // 3. System visibilities & active index
  const systemVisibilities: number[] = DRAWING_SYSTEMS.map((sys) => {
    if (p <= sys.start) return 0;
    if (p >= sys.end) return 1;
    return smoothstep(sys.start, sys.end, p);
  });

  let activeSystemIndex = 0;
  if (p < 0.45) {
    activeSystemIndex = 0;
  } else if (p < 0.52) {
    activeSystemIndex = 0;
  } else if (p < 0.58) {
    activeSystemIndex = 1;
  } else if (p < 0.64) {
    activeSystemIndex = 2;
  } else if (p < 0.70) {
    activeSystemIndex = 3;
  } else {
    activeSystemIndex = 4;
  }

  // 4. Camera positioning:
  // Starts at controlled 3/4 perspective to highlight the rolled cylinder and paper curvature
  // Subtly settles into a balanced drafting review view as linework reveals
  let camX = 0;
  let camY = 16.5;
  let camZ = 13.5;

  if (p < 0.15) {
    camX = 4.2;
    camY = 14.5;
    camZ = 12.0;
  } else if (p < 0.45) {
    // Unrolling: camera glides smoothly from dynamic 3/4 perspective to centered review
    const t = smoothstep(0.15, 0.45, p);
    camX = 4.2 * (1 - t) + 0.5 * t;
    camY = 14.5 * (1 - t) + 15.5 * t;
    camZ = 12.0 * (1 - t) + 12.5 * t;
  } else if (p < 0.75) {
    // Linework reveal: steady drafting review view
    const t = smoothstep(0.45, 0.75, p);
    camX = 0.5 * (1 - t) + 0 * t;
    camY = 15.5 * (1 - t) + 15.8 * t;
    camZ = 12.5 * (1 - t) + 12.2 * t;
  } else {
    // Hold & release: steady framing
    camX = 0;
    camY = 15.8;
    camZ = 12.2;
  }

  // 5. HUD opacity
  const hudOpacity = p >= 0.92 ? 1.0 - smoothstep(0.92, 1.0, p) : 1.0;

  return {
    progress: p,
    phase,
    unrollProgress,
    drawingProgress,
    activeSystemIndex,
    systemVisibilities,
    cameraPosition: [camX, camY, camZ],
    cameraTarget: [0, 0, 0],
    hudOpacity,
  };
}
