/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ALIDAUNIA SERVICES - Vision journey state (pure, renderer-independent).
 *
 * The whole page-two world is driven by one number, the journey position `s`
 * in [0, 6]. Chapter i (V1..V6) occupies [i, i + 1]: its reading interval is
 * [i, i + READ_END] and its physical transition into the next environment is
 * [i + READ_END, i + 1]. Every camera pose, material state and light value is
 * a pure function of `s`, so re-entry, resize, anchor jumps and reverse
 * scrolling always reconstruct the same frame.
 */

export type Vec3 = [number, number, number];

export const JOURNEY_LENGTH = 6;
export const CHAPTER_COUNT = 6;
/** Fraction of each chapter reserved for reading before its transition. */
export const READ_END = 0.62;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** Smoothed 0→1 progress of `s` across [a, b]. */
export const phase = (s: number, a: number, b: number) => smoothstep((s - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* -------------------------------------------------------------------------- */
/* World layout. Shared by the scene builders and by the continuity tests.     */
/* Units are metres; the camera travels broadly towards -Z.                    */
/* -------------------------------------------------------------------------- */

export const LAYOUT = {
  hangar: { halfWidth: 14, apex: 15, ribZ: [6, -1, -8, -15, -22, -29, -36, -43], endZ: -45.5 },
  /** Sculptural aluminium rib: its near-vertical leg spans x ∈ [legX0, legX1]. */
  heroRib: { z: -47.5, depth: 0.8, legX0: 2.2, legX1: 4.8 },
  gallery: { wallZ: -60, wallThickness: 1.5, wallX0: -22, wallEndX: 31, jointX: 27, openingX1: 41, farWallX1: 58, height: 13 },
  glazing: {
    pathX: 36.2,
    fins: [
      { z: -70, side: -1 }, { z: -74.5, side: 1 }, { z: -79, side: -1 },
      { z: -88, side: 1 }, { z: -92.5, side: -1 },
      { z: -101.5, side: 1 }, { z: -106, side: -1 },
    ] as { z: number; side: -1 | 1 }[],
    groups: [3, 2, 2],
    finInnerGap: 0.75,
    finWidth: 3.4,
    finHeight: 7.6,
    /** Frosted handoff screen in front of the vault. */
    screen: { z: -112, x0: 30.4, x1: 37.8 },
    sideWallX: [30.2, 42.4] as [number, number],
    endZ: -116,
  },
  vault: { cx: 36, halfSpan: 10, apex: 9.2, z0: -117, z1: -135, pleats: 9 },
  canopy: {
    cliente: [14.5, 12.5, -177] as Vec3,
    progetto: [29.5, 18.5, -147] as Vec3,
    gestione: [57.5, 12.5, -175] as Vec3,
  },
  horizon: { cx: 36, cz: -198.5, radius: 16, height: 14, thickness: 1.3, sweep: 1.3, openingHalfAngle: 0.2 },
} as const;

/* -------------------------------------------------------------------------- */
/* Camera keys                                                                 */
/* -------------------------------------------------------------------------- */

export interface CameraKey {
  s: number;
  pos: Vec3;
  target: Vec3;
  /** Horizontal lens shift as a fraction of the view width (+ = scene centre moves right). */
  shift: number;
}

const R = READ_END;

export const CAMERA_KEYS: CameraKey[] = [
  // V1 — hangar threshold: establish, dolly forward with a slight rise, approach the rib.
  { s: 0, pos: [0, 1.9, 9], target: [1.6, 5.2, -20], shift: 0.14 },
  { s: 0.3, pos: [0.3, 2.25, 0.5], target: [1.4, 5.0, -28], shift: 0.14 },
  { s: R, pos: [0.8, 2.75, -23], target: [2.2, 4.4, -48], shift: 0.12 },
  { s: 0.8, pos: [1.2, 2.6, -40], target: [3.4, 3.1, -60], shift: 0.04 },
  // V1 → V2 rigid occlusion: truck right across the aluminium leg.
  { s: 0.9, pos: [3.3, 2.4, -45.6], target: [4.6, 2.7, -60], shift: 0 },
  { s: 0.95, pos: [6.1, 2.35, -46.3], target: [7.5, 2.9, -60], shift: 0 },
  // V2 — lateral track along the board-formed wall.
  { s: 1, pos: [8.2, 2.3, -49.6], target: [11, 3.6, -60], shift: -0.06 },
  { s: 1.3, pos: [12.5, 2.2, -49.2], target: [15.8, 3.9, -60], shift: -0.13 },
  { s: 1 + R, pos: [18.5, 2.2, -50.2], target: [22.2, 3.8, -60], shift: -0.13 },
  // V2 → V3: follow the deep joint, round the wall end, look through the opening.
  { s: 1.8, pos: [25.2, 2.1, -55], target: [30, 3, -62], shift: -0.04 },
  { s: 1.92, pos: [31.4, 2.05, -57.4], target: [35, 2.8, -66], shift: 0 },
  { s: 2, pos: [35.4, 2.0, -61.6], target: [36.2, 2.6, -75], shift: 0.05 },
  // V3 — one passage between seven glazed thresholds (3 + 2 + 2), quieter while each group is read.
  { s: 2.12, pos: [36.2, 2.0, -64.5], target: [36.4, 2.5, -80], shift: 0.1 },
  { s: 2.22, pos: [36.25, 2.0, -66.2], target: [36.4, 2.5, -82], shift: 0.1 },
  { s: 2.32, pos: [36.2, 2.05, -83.2], target: [36.4, 2.5, -96], shift: 0.1 },
  { s: 2.4, pos: [36.2, 2.05, -84.8], target: [36.3, 2.5, -98], shift: 0.1 },
  { s: 2.48, pos: [36.25, 2.1, -96.2], target: [36.2, 2.6, -110], shift: 0.1 },
  { s: 2 + R, pos: [36.25, 2.1, -98.2], target: [36.0, 2.6, -112], shift: 0.08 },
  // V3 → V4 frosted handoff: the screen fills the view, then the camera slips past its polished edge.
  { s: 2.78, pos: [35.9, 2.1, -109.7], target: [35.9, 2.3, -125], shift: 0 },
  { s: 2.9, pos: [37.9, 2.1, -111.15], target: [37.2, 2.6, -125], shift: 0 },
  { s: 3, pos: [39, 2.15, -115], target: [36.5, 3.6, -128], shift: -0.04 },
  // V4 — composite vault: nearly steady while the folds work.
  { s: 3.2, pos: [38.6, 2.2, -117.4], target: [36.3, 3.9, -129], shift: -0.1 },
  { s: 3.45, pos: [38.2, 2.25, -119.4], target: [36.2, 4.0, -130], shift: -0.1 },
  { s: 3 + R, pos: [37.8, 2.3, -121], target: [36.1, 3.9, -132], shift: -0.08 },
  // V4 → V5: through the opened end fold.
  { s: 3.8, pos: [37.0, 2.4, -127], target: [36.2, 4.4, -150], shift: 0 },
  { s: 3.92, pos: [36.5, 2.5, -134], target: [36.1, 5.2, -160], shift: 0.04 },
  // V5 — tensile canopy: gentle upward tilt as the membrane tightens.
  { s: 4, pos: [36.2, 2.5, -139.5], target: [36.0, 6.4, -165], shift: 0.08 },
  { s: 4.3, pos: [36.4, 2.5, -145.5], target: [35.6, 7.6, -170], shift: 0.12 },
  { s: 4 + R, pos: [36.5, 2.6, -151.5], target: [35.5, 8.8, -175], shift: 0.12 },
  // V5 → V6: the far edge lifts; the camera continues beneath it.
  { s: 4.82, pos: [36.3, 2.9, -164], target: [36.0, 6.2, -200], shift: 0.06 },
  { s: 5, pos: [36.1, 3.1, -177], target: [36.0, 4.9, -212], shift: 0.08 },
  // V6 — slow final rise towards the opening, then complete stillness.
  { s: 5.4, pos: [36.0, 3.6, -185.5], target: [36.0, 5.0, -214], shift: 0.12 },
  { s: 5.75, pos: [36.0, 4.15, -191.5], target: [36.0, 5.0, -216], shift: 0.13 },
  { s: 6, pos: [36.0, 4.3, -193], target: [36.0, 5.0, -216], shift: 0.13 },
];

/**
 * Monotone piecewise-cubic Hermite interpolation (Fritsch–Butland tangents).
 * C1-continuous across every key, never overshoots between keys, and has zero
 * velocity at the first and last key so the journey starts and ends at rest.
 */
export function createMonotoneTrack(xs: number[], ys: number[]) {
  const n = xs.length;
  const m = new Array<number>(n).fill(0);
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else m[i] = (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / d[i - 1] + (h[i] + 2 * h[i - 1]) / d[i]);
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    i = lo;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

export interface CameraPose {
  pos: Vec3;
  target: Vec3;
  shift: number;
}

export function createCameraPath(keys: CameraKey[] = CAMERA_KEYS) {
  const xs = keys.map((k) => k.s);
  const tracks = [0, 1, 2].flatMap((c) => [
    createMonotoneTrack(xs, keys.map((k) => k.pos[c])),
    createMonotoneTrack(xs, keys.map((k) => k.target[c])),
  ]);
  const shift = createMonotoneTrack(xs, keys.map((k) => k.shift));
  return (s: number): CameraPose => ({
    pos: [tracks[0](s), tracks[2](s), tracks[4](s)],
    target: [tracks[1](s), tracks[3](s), tracks[5](s)],
    shift: shift(s),
  });
}

export const sampleCamera = createCameraPath();

/* -------------------------------------------------------------------------- */
/* Scroll → journey mapping                                                    */
/* -------------------------------------------------------------------------- */

export interface JourneyMark {
  /** Absolute document scroll position (window.scrollY) at which `s` is reached. */
  scroll: number;
  s: number;
}

/** Sorts marks by `s` and forces strictly increasing scroll positions. */
export function normalizeMarks(raw: JourneyMark[]): JourneyMark[] {
  const sorted = [...raw].sort((a, b) => a.s - b.s);
  const out: JourneyMark[] = [];
  for (const mark of sorted) {
    const prev = out[out.length - 1];
    if (prev && mark.s === prev.s) continue;
    out.push({ s: mark.s, scroll: prev ? Math.max(mark.scroll, prev.scroll + 1) : mark.scroll });
  }
  return out;
}

/** Piecewise-linear absolute mapping. Reversible and independent of scroll history. */
export function scrollToJourney(scroll: number, marks: JourneyMark[]): number {
  if (marks.length === 0) return 0;
  if (scroll <= marks[0].scroll) return marks[0].s;
  for (let i = 1; i < marks.length; i++) {
    const b = marks[i];
    if (scroll <= b.scroll) {
      const a = marks[i - 1];
      return a.s + ((scroll - a.scroll) / (b.scroll - a.scroll)) * (b.s - a.s);
    }
  }
  return marks[marks.length - 1].s;
}

/**
 * The single smoothing policy: one exponential follow of the displayed journey
 * position towards the scroll-derived target. A jump of more than `snapDistance`
 * (anchor link, route entry, Home/End) cuts directly to the destination instead
 * of flying through the intermediate rooms.
 */
export function stepJourney(current: number, target: number, dtSeconds: number, rate = 7, snapDistance = 0.85): number {
  const delta = target - current;
  if (Math.abs(delta) > snapDistance) return target;
  const next = current + delta * (1 - Math.exp(-rate * Math.max(0, dtSeconds)));
  return Math.abs(target - next) < 1e-4 ? target : next;
}

/** Reduced motion: a completed, still composition per chapter. */
export function stillJourney(s: number): number {
  const chapter = Math.min(CHAPTER_COUNT - 1, Math.max(0, Math.floor(s + 0.5 - READ_END * 0.5)));
  return chapter === CHAPTER_COUNT - 1 ? JOURNEY_LENGTH : chapter + READ_END * 0.55;
}

export const chapterAt = (s: number) => Math.min(CHAPTER_COUNT - 1, Math.max(0, Math.floor(s)));

/** Which environments need to be in the scene graph at `s` (current + transition neighbours). */
export const ZONE_WINDOWS: [number, number][] = [
  [-1, 1.25],
  [-1, 2.25],
  [1.5, 3.2],
  [2.5, 4.2],
  [3.5, 5.3],
  [4.5, 7],
];
export const zoneVisible = (zone: number, s: number) => s >= ZONE_WINDOWS[zone][0] && s <= ZONE_WINDOWS[zone][1];

/* -------------------------------------------------------------------------- */
/* Per-environment authored state                                              */
/* -------------------------------------------------------------------------- */

/** V2: the daylight band glides along the wall, then settles while copy is read. */
export const galleryBandX = (s: number) => lerp(4, 17, phase(s, 1.0, 1.42)) + lerp(0, 12, phase(s, 1 + R, 2.0));

/** V4: four calibrated structural adjustments, then the end fold opens. */
export function vaultState(s: number) {
  return {
    support: phase(s, 2.85, 3.14), // Esperienza
    seam: phase(s, 3.14, 3.3), // Tecnologia
    fold: phase(s, 3.3, 3.46), // Dinamismo
    resolve: phase(s, 3.46, 3 + R), // Modernità
    open: phase(s, 3 + R, 3.9), // V4 → V5 reveal
  };
}

/** V5: deterministic tightening around the anchors, then the far edge lifts away. */
export function canopyState(s: number) {
  return {
    tension: phase(s, 3.75, 4 + R),
    lift: phase(s, 4.68, 5.0),
  };
}

/* -------------------------------------------------------------------------- */
/* Shared atmosphere: one exposure/sky/fog track for the whole world.          */
/* -------------------------------------------------------------------------- */

export interface AtmosphereKey {
  s: number;
  skyTop: Vec3;
  skyHorizon: Vec3;
  exposure: number;
  envIntensity: number;
  sun: number;
  hemi: number;
}

const rgb = (hex: number): Vec3 => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

export const ATMOSPHERE_KEYS: AtmosphereKey[] = [
  { s: 0, skyTop: rgb(0x0a1a2e), skyHorizon: rgb(0x3b4d63), exposure: 1.0, envIntensity: 0.32, sun: 1.1, hemi: 0.35 },
  { s: 0.9, skyTop: rgb(0x31465f), skyHorizon: rgb(0x8f9aa6), exposure: 1.0, envIntensity: 0.4, sun: 2.2, hemi: 0.8 },
  { s: 1.6, skyTop: rgb(0x5e7590), skyHorizon: rgb(0xc4c8cc), exposure: 1.0, envIntensity: 0.45, sun: 2.6, hemi: 0.95 },
  { s: 2.5, skyTop: rgb(0x8ea6bf), skyHorizon: rgb(0xe3e6e8), exposure: 1.02, envIntensity: 0.5, sun: 1.9, hemi: 0.7 },
  { s: 3.3, skyTop: rgb(0x52677f), skyHorizon: rgb(0xb7bfc8), exposure: 1.0, envIntensity: 0.55, sun: 1.6, hemi: 0.45 },
  { s: 4.2, skyTop: rgb(0x9db6cf), skyHorizon: rgb(0xeef0ef), exposure: 1.03, envIntensity: 0.5, sun: 2.4, hemi: 0.75 },
  { s: 6, skyTop: rgb(0xa9c3dc), skyHorizon: rgb(0xf6f4ef), exposure: 1.04, envIntensity: 0.5, sun: 2.3, hemi: 0.8 },
];

export function createAtmosphereTrack(keys: AtmosphereKey[] = ATMOSPHERE_KEYS) {
  const xs = keys.map((k) => k.s);
  const t = (pick: (k: AtmosphereKey) => number) => createMonotoneTrack(xs, keys.map(pick));
  const top = [0, 1, 2].map((c) => t((k) => k.skyTop[c]));
  const hor = [0, 1, 2].map((c) => t((k) => k.skyHorizon[c]));
  const exposure = t((k) => k.exposure);
  const env = t((k) => k.envIntensity);
  const sun = t((k) => k.sun);
  const hemi = t((k) => k.hemi);
  return (s: number) => ({
    skyTop: top.map((f) => f(s)) as Vec3,
    skyHorizon: hor.map((f) => f(s)) as Vec3,
    exposure: exposure(s),
    envIntensity: env(s),
    sun: sun(s),
    hemi: hemi(s),
  });
}

export const sampleAtmosphere = createAtmosphereTrack();

/** Sun direction (towards the light), continuous along the journey. */
const SUN_KEYS: { s: number; dir: Vec3 }[] = [
  { s: 0, dir: [0.35, 0.8, 0.5] },
  { s: 1.0, dir: [-0.85, 0.42, 0.32] }, // raking across the V2 wall
  { s: 1.8, dir: [-0.7, 0.62, 0.35] },
  { s: 2.6, dir: [0.25, 0.9, 0.35] },
  { s: 3.5, dir: [0.4, 0.82, 0.4] },
  { s: 4.4, dir: [0.15, 0.56, 0.82] }, // low, behind the camera: the membrane shadow travels ahead onto V6
  { s: 5.3, dir: [-0.2, 0.52, 0.83] },
  { s: 6, dir: [-0.66, 0.42, 0.62] }, // grazing across the curved ceramic
];
const sunTracks = [0, 1, 2].map((c) => createMonotoneTrack(SUN_KEYS.map((k) => k.s), SUN_KEYS.map((k) => k.dir[c])));
export function sunDirection(s: number): Vec3 {
  const v = sunTracks.map((f) => f(s));
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Smooth 0..1 weight of an environment's local lights. */
export function zoneWeight(zone: number, s: number) {
  const centre = zone + 0.45;
  const d = Math.abs(s - centre);
  return 1 - smoothstep((d - 0.45) / 0.45);
}
