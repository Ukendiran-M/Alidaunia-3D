/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ALIDAUNIA SERVICES - Vision journey state (pure, renderer-independent).
 *
 * The whole page-two world is driven by one number, the journey position `s`
 * in [0, 6]. Chapter i (V1..V6) occupies [i, i + 1]: its reading interval is
 * [i, i + READ_END] and its physical transition into the next space is
 * [i + READ_END, i + 1]. Every camera pose, object state and light value is
 * a pure function of `s`, so re-entry, resize, anchor jumps and reverse
 * scrolling always reconstruct the same frame.
 *
 * The world is one conceptual operating base: a hangar with the parked AW139,
 * its apron edge, and a two-storey glazed annex (planning studio above,
 * briefing room below) that looks into the aircraft bay.
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
/* World layout. Shared by the scene builders and by the clearance tests.      */
/* Metres; +Z points out of the hangar towards the apron.                      */
/* -------------------------------------------------------------------------- */

export const LAYOUT = {
  hangar: {
    x0: -16,
    x1: 16,
    zBack: -34,
    zFront: 0,
    doorHeight: 10,
    eave: 11.2,
    ridge: 12.8,
    trussZ: [-3, -9, -15, -21, -27, -33],
  },
  /** Tracked door: one moving leaf; the remaining leaves are stacked at the left. */
  door: {
    trackZ: 1.0,
    thickness: 0.32,
    leafWidth: 8,
    closedX0: 8,
    openX0: -10,
    stack: [[-16, -10.4, 0.36], [-15.6, -10, 0.68]] as [number, number, number][],
  },
  /** The parked AW139: model origin on the floor, model +X (nose) rotated towards the apron. */
  aircraft: { x: 5, z: -11, yaw: -Math.PI / 2 + 0.25 },
  annex: {
    x0: 16,
    x1: 24.5,
    z0: -26,
    z1: -4,
    slab: 3.4,
    upper: 3.7,
    roof: 7.2,
    groundDoorZ: [-14, -11.4] as [number, number],
    groundFrontDoorX: [19.3, 21.9] as [number, number],
    upperFrontDoorX: [21.5, 23.7] as [number, number],
    studioEndZ: -20,
    studioEndDoorX: [16.2, 18.1] as [number, number],
    landing: { x0: 21.1, x1: 24.4, z0: -4, z1: -2.2 },
  },
  /** Drafting table in the studio: board footprint and height. */
  draftingTable: { x0: 16.55, x1: 17.95, z0: -15.8, z1: -13.0, top: 4.95 },
  sideWorktops: [
    { x0: 16.55, x1: 17.8, z0: -12.6, z1: -11.2, top: 4.62 },
    { x0: 16.55, x1: 17.8, z0: -17.6, z1: -16.2, top: 4.62 },
  ],
  briefingTable: { x0: 19.3, x1: 21.0, z0: -18.8, z1: -14.9, top: 0.75 },
  dossier: [19.95, 0.76, -15.75] as Vec3,
  /** Mobile maintenance stand beside the cabin, between two blades. */
  stand: { x: 8.7, z: -8.5, halfX: 0.85, halfZ: 1.15, deck: 2.0, rail: 3.1 },
  /** Elevated airside edge light at a paving joint, beside the slot drain. */
  fixture: [21.5, 0, 9] as Vec3,
  drainZ: 6,
  apron: { x0: -34, x1: 46, z0: 0, z1: 48 },
} as const;

/** AW139 reference geometry in model space (from the prepared GLB). */
export const AW139 = {
  hub: [1.21, 3.13, -0.05] as Vec3,
  bladeY: 3.03,
  bladeTips: [
    [1.25, 2.98, -5.68],
    [-4.13, 2.98, -1.82],
    [-2.12, 2.98, 4.49],
    [4.5, 2.98, 4.53],
    [6.58, 2.98, -1.75],
  ] as Vec3[],
  airframe: { min: [-6.3, 0, -1.95] as Vec3, max: [5.2, 3.35, 1.85] as Vec3 },
  tail: { min: [-7.05, 1.85, -0.6] as Vec3, max: [-4.7, 4.2, 0.6] as Vec3 },
};

/** Model space → world space for the parked aircraft (rotation about Y, then translation). */
export function aircraftToWorld(p: Vec3): Vec3 {
  const { x, z, yaw } = LAYOUT.aircraft;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x + p[0] * c + p[2] * s, p[1], z - p[0] * s + p[2] * c];
}

/** World space → model space (inverse of aircraftToWorld). */
export function worldToAircraft(p: Vec3): Vec3 {
  const { x, z, yaw } = LAYOUT.aircraft;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const dx = p[0] - x;
  const dz = p[2] - z;
  return [dx * c - dz * s, p[1], dx * s + dz * c];
}

export const ROTOR_HUB = aircraftToWorld(AW139.hub);

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
const H = ROTOR_HUB;
/** Point around the rotor hub at bearing `deg` (0° = +X, 90° = +Z), radius `r`, height `y`. */
const aroundHub = (deg: number, r: number, y: number): Vec3 => {
  const a = (deg * Math.PI) / 180;
  return [H[0] + Math.cos(a) * r, y, H[2] + Math.sin(a) * r];
};
/** Point along blade 01 at radius `r`, offset sideways by `side` metres. */
const alongBlade = (r: number, side: number, y: number): Vec3 => {
  const tip = aircraftToWorld(AW139.bladeTips[0]);
  const dx = tip[0] - H[0];
  const dz = tip[2] - H[2];
  const len = Math.hypot(dx, dz);
  const ux = dx / len;
  const uz = dz / len;
  return [H[0] + ux * r - uz * side, y, H[2] + uz * r + ux * side];
};
const D = LAYOUT.dossier;
const aroundDossier = (deg: number, r: number, y: number): Vec3 => {
  const a = (deg * Math.PI) / 180;
  return [D[0] + Math.cos(a) * r, y, D[2] + Math.sin(a) * r];
};

export const CAMERA_KEYS: CameraKey[] = [
  // V1 — the AW139 in the hangar: three-quarter view, slow lateral dolly with a slight pullback.
  { s: 0, pos: [-3.3, 1.55, -2.9], target: [4.7, 1.95, -10.3], shift: 0.15 },
  { s: 0.3, pos: [-2.75, 1.66, -2.3], target: [4.85, 2.0, -10.3], shift: 0.15 },
  { s: R, pos: [-1.9, 1.82, -1.35], target: [5.0, 2.05, -10.4], shift: 0.13 },
  // V1 → V2: pass in front of the nose towards the closed door leaf; the leaf slides away.
  { s: 0.74, pos: [2.2, 2.0, -1.5], target: [9.8, 2.3, -3.0], shift: 0.04 },
  { s: 0.84, pos: [8.4, 2.05, -2.7], target: [11.4, 2.3, 4], shift: 0 },
  { s: 0.93, pos: [11.4, 1.85, -0.7], target: [15.6, 1.3, 8], shift: 0 },
  // V2 — the airside edge: lower towards the surface and track along the joint to the light.
  { s: 1, pos: [14.1, 1.3, 3.9], target: [19.6, 0.4, 9.3], shift: -0.06 },
  { s: 1.25, pos: [16.9, 0.78, 8.0], target: [21.5, 0.22, 9.0], shift: -0.12 },
  { s: 1.45, pos: [18.4, 0.62, 8.55], target: [21.5, 0.2, 9.0], shift: -0.12 },
  { s: 1 + R, pos: [19.15, 0.56, 8.72], target: [21.5, 0.2, 9.02], shift: -0.12 },
  // V2 → V3: follow the service line to the annex, rise past the stair and through the door jamb.
  { s: 1.74, pos: [20.2, 1.1, 7.2], target: [22.4, 2.6, -3], shift: -0.04 },
  { s: 1.84, pos: [22.3, 2.75, 1.5], target: [22.5, 4.7, -6], shift: 0 },
  { s: 1.92, pos: [22.6, 5.0, -1.7], target: [21.4, 5.1, -8], shift: 0 },
  { s: 2, pos: [21.9, 5.4, -6.6], target: [18.0, 4.65, -11.6], shift: 0.06 },
  // V3 — planning studio: drift along the drafting surface, resting on each Mission group.
  { s: 2.12, pos: [18.8, 5.62, -10.9], target: [17.2, 4.62, -12.2], shift: 0.12 },
  { s: 2.22, pos: [18.75, 5.62, -11.5], target: [17.2, 4.65, -12.8], shift: 0.12 },
  { s: 2.32, pos: [18.9, 5.66, -13.5], target: [17.25, 4.75, -14.25], shift: 0.12 },
  { s: 2.4, pos: [18.85, 5.66, -14.0], target: [17.25, 4.75, -14.6], shift: 0.12 },
  { s: 2.48, pos: [18.8, 5.6, -15.5], target: [17.2, 4.68, -16.4], shift: 0.12 },
  { s: 2 + R, pos: [18.75, 5.58, -15.95], target: [17.2, 4.66, -16.75], shift: 0.1 },
  // V3 → V4: round the studio's end jamb; the rotor is seen through the glazing, then in the open.
  { s: 2.76, pos: [17.4, 5.25, -18.5], target: [13.0, 4.5, -15.5], shift: 0.02 },
  { s: 2.86, pos: [17.1, 5.2, -21.1], target: [10.0, 4.0, -15.0], shift: 0 },
  { s: 2.94, pos: [14.6, 5.15, -20.6], target: [7.0, 3.6, -12.0], shift: -0.02 },
  { s: 3, pos: aroundHub(-40, 8.4, 5.4), target: [H[0], 3.2, H[2] - 0.4], shift: -0.1 },
  // V4 — rotor head: a measured ~30° arc at a stable reading distance.
  { s: 3.15, pos: aroundHub(-8, 4.75, 5.4), target: [H[0] - 0.3, 3.0, H[2] - 0.6], shift: -0.2 },
  { s: 3.35, pos: aroundHub(6, 4.5, 5.3), target: [H[0] - 0.3, 3.0, H[2] - 0.5], shift: -0.21 },
  { s: 3.55, pos: aroundHub(19, 4.35, 5.25), target: [H[0] - 0.3, 3.0, H[2] - 0.4], shift: -0.21 },
  { s: 3 + R, pos: aroundHub(23, 4.3, 5.22), target: [H[0] - 0.3, 3.0, H[2] - 0.4], shift: -0.2 },
  // V4 → V5: alongside, then beneath blade 01 towards the briefing room's glazed door.
  // V4 → V5: drop below the rotor plane beside blade 01, so its silhouette crosses the top of the frame,
  // then pass beneath it towards the briefing room's glazed door.
  { s: 3.67, pos: aroundHub(15, 4.2, 4.7), target: alongBlade(3.6, 0, 3.0), shift: -0.14 },
  { s: 3.73, pos: aroundHub(5, 4.6, 3.9), target: alongBlade(6.5, -1.2, 2.6), shift: -0.05 },
  { s: 3.8, pos: alongBlade(4.5, 1.55, 2.3), target: [17.0, 2.2, -13.2], shift: 0 },
  { s: 3.87, pos: alongBlade(4.85, -0.05, 2.2), target: [17.6, 1.7, -13.4], shift: 0 },
  { s: 3.94, pos: alongBlade(5.0, -1.7, 1.95), target: [19.2, 1.2, -14.4], shift: 0 },
  { s: 4, pos: [15.0, 1.72, -12.7], target: [20.0, 0.95, -15.4], shift: 0.02 },
  // V5 — briefing room: a gentle arc around the desk corner, revealing the aircraft bay.
  { s: 4.12, pos: aroundDossier(134, 2.4, 1.55), target: [D[0], 0.8, D[2]], shift: 0.08 },
  { s: 4.3, pos: aroundDossier(100, 1.85, 1.5), target: [D[0] - 0.05, 0.8, D[2] - 0.05], shift: 0.12 },
  { s: 4.45, pos: aroundDossier(64, 1.7, 1.48), target: [D[0] - 0.12, 0.82, D[2] - 0.12], shift: 0.14 },
  { s: 4 + R, pos: aroundDossier(42, 1.7, 1.5), target: [D[0] - 0.2, 0.84, D[2] - 0.18], shift: 0.14 },
  // V5 → V6: out through the glazed front door; the roof's shade recedes into daylight.
  { s: 4.71, pos: [21.9, 1.62, -12.9], target: [19.6, 1.2, -10.5], shift: 0.08 },
  { s: 4.79, pos: [21.5, 1.8, -8.8], target: [20.6, 1.9, -1], shift: 0.04 },
  { s: 4.87, pos: [20.6, 1.95, -4.0], target: [17.5, 2.5, 6], shift: 0 },
  { s: 4.94, pos: [18.6, 2.5, 2.6], target: [10.5, 3.0, 0], shift: 0.04 },
  { s: 5, pos: [17.1, 3.0, 8.0], target: [6.6, 3.35, -6], shift: 0.08 },
  // V6 — the apron: pull back and rise once, then hold completely still.
  { s: 5.4, pos: [15.2, 3.4, 13.5], target: [5.4, 3.9, -7.5], shift: 0.12 },
  { s: 5.75, pos: [13.2, 3.7, 17.5], target: [4.9, 4.55, -8], shift: 0.14 },
  { s: 6, pos: [12.9, 3.78, 18.6], target: [4.8, 4.7, -8], shift: 0.14 },
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
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }
    const i = lo;
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

/**
 * Phones: the same path with shorter travel while reading. Within each
 * reading interval the pose is drawn towards that chapter's reference pose;
 * the weight is zero at every transition, so continuity is preserved.
 */
const MOBILE_DAMPING = 0.55;
export function readingWeight(s: number) {
  const chapter = Math.min(CHAPTER_COUNT - 1, Math.floor(s));
  const f = s - chapter;
  if (chapter === CHAPTER_COUNT - 1) return phase(f, 0.03, 0.15) * (1 - phase(f, 0.55, 0.9));
  return phase(f, 0.03, 0.15) * (1 - phase(f, R - 0.1, R));
}
export function sampleCameraMobile(s: number): CameraPose {
  const pose = sampleCamera(s);
  const w = readingWeight(s) * MOBILE_DAMPING;
  if (w === 0) return { ...pose, shift: 0 };
  const chapter = Math.min(CHAPTER_COUNT - 1, Math.floor(s));
  const ref = sampleCamera(chapter + (chapter === CHAPTER_COUNT - 1 ? 0.6 : R * 0.5));
  const mix = (a: Vec3, b: Vec3): Vec3 => [lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w)];
  return { pos: mix(pose.pos, ref.pos), target: mix(pose.target, ref.target), shift: 0 };
}

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
 * of flying through the intermediate spaces.
 */
export function stepJourney(current: number, target: number, dtSeconds: number, rate = 7, snapDistance = 0.85): number {
  const delta = target - current;
  if (Math.abs(delta) > snapDistance) return target;
  const next = current + delta * (1 - Math.exp(-rate * Math.max(0, dtSeconds)));
  return Math.abs(target - next) < 1e-4 ? target : next;
}

/**
 * Reduced motion: one completed, still composition per chapter — the end of
 * its reading interval, where every authored state (door, light, drawing,
 * dossier) has resolved. Fallback posters are rendered from the same poses.
 */
export const STILL_OFFSET = READ_END - 0.02;
export function stillJourney(s: number): number {
  const chapter = Math.min(CHAPTER_COUNT - 1, Math.max(0, Math.floor(s + 0.5 - READ_END * 0.5)));
  return chapter === CHAPTER_COUNT - 1 ? JOURNEY_LENGTH : chapter + STILL_OFFSET;
}

export const chapterAt = (s: number) => Math.min(CHAPTER_COUNT - 1, Math.max(0, Math.floor(s)));

/* -------------------------------------------------------------------------- */
/* Authored object state                                                       */
/* -------------------------------------------------------------------------- */

/** V1 → V2: the tracked door leaf's left edge x position. */
export const doorLeafX0 = (s: number) => lerp(LAYOUT.door.closedX0, LAYOUT.door.openX0, phase(s, 0.845, 1.0));

/** V2: the edge light comes on while the durability copy is read. */
export const fixtureLight = (s: number) => phase(s, 1.26, 1.42);

/** V3: the drawing develops with the three Mission groups. */
export function drawingState(s: number) {
  return {
    context: 1,
    construction: phase(s, 2.25, 2.33),
    review: phase(s, 2.42, 2.5),
  };
}

/** V5: requirements, project drawing and handover record slide into one dossier. */
export const dossierAlignment = (s: number) => phase(s, 4.1, 4.5);

/* -------------------------------------------------------------------------- */
/* Shared atmosphere: one exposure/sky track for the whole base.               */
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

const SKY_TOP = rgb(0x8fb1d2);
const SKY_HORIZON = rgb(0xe6ebee);

/** Exposure adapts gradually between the hangar interior and open daylight. */
export const ATMOSPHERE_KEYS: AtmosphereKey[] = [
  { s: 0, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 1.05, envIntensity: 0.6, sun: 3.0, hemi: 0.35 },
  { s: 0.7, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 1.02, envIntensity: 0.58, sun: 3.0, hemi: 0.45 },
  { s: 1.1, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 0.92, envIntensity: 0.5, sun: 3.0, hemi: 0.75 },
  { s: 1.8, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 0.95, envIntensity: 0.5, sun: 3.0, hemi: 0.75 },
  { s: 2.2, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 1.0, envIntensity: 0.6, sun: 3.0, hemi: 0.55 },
  { s: 3.2, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 1.0, envIntensity: 0.62, sun: 3.0, hemi: 0.45 },
  { s: 4.3, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 0.98, envIntensity: 0.6, sun: 3.0, hemi: 0.5 },
  { s: 5.1, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 0.93, envIntensity: 0.5, sun: 3.0, hemi: 0.78 },
  { s: 6, skyTop: SKY_TOP, skyHorizon: SKY_HORIZON, exposure: 0.93, envIntensity: 0.5, sun: 3.0, hemi: 0.78 },
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

/** One sun for the whole base: late-morning, low enough to rake across paving and reach into the hangar. */
const SUN: Vec3 = (() => {
  const v: Vec3 = [0.52, 0.5, 0.69];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
export const sunDirection = (): Vec3 => SUN;
