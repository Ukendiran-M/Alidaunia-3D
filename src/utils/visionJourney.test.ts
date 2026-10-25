import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_KEYS,
  JOURNEY_LENGTH,
  LAYOUT,
  READ_END,
  ZONE_WINDOWS,
  canopyState,
  normalizeMarks,
  sampleAtmosphere,
  sampleCamera,
  scrollToJourney,
  stepJourney,
  stillJourney,
  sunDirection,
  vaultState,
  zoneVisible,
  type Vec3,
} from './visionJourney';

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const norm = (v: Vec3): Vec3 => {
  const l = len(v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const forward = (s: number) => {
  const p = sampleCamera(s);
  return norm(sub(p.target, p.pos));
};

test('camera keys are ordered and span the whole journey', () => {
  assert.equal(CAMERA_KEYS[0].s, 0);
  assert.equal(CAMERA_KEYS[CAMERA_KEYS.length - 1].s, JOURNEY_LENGTH);
  for (let i = 1; i < CAMERA_KEYS.length; i++) assert.ok(CAMERA_KEYS[i].s > CAMERA_KEYS[i - 1].s);
});

test('camera position and view direction are continuous with no reset at any chapter boundary', () => {
  const ds = 0.0005;
  let maxStep = 0;
  let maxTurn = 0;
  for (let s = 0; s < JOURNEY_LENGTH; s += ds) {
    const a = sampleCamera(s);
    const b = sampleCamera(s + ds);
    maxStep = Math.max(maxStep, len(sub(b.pos, a.pos)));
    const fa = forward(s);
    const fb = forward(s + ds);
    maxTurn = Math.max(maxTurn, Math.acos(Math.min(1, fa[0] * fb[0] + fa[1] * fb[1] + fa[2] * fb[2])));
    assert.ok(Math.abs(b.shift - a.shift) < 0.002, `lens shift jumps at s=${s.toFixed(4)}`);
  }
  // The fastest authored passage stays below ~0.25 m per 0.0005 of journey and 0.6° per step.
  assert.ok(maxStep < 0.25, `largest positional step ${maxStep}`);
  assert.ok(maxTurn < (0.6 * Math.PI) / 180, `largest heading step ${maxTurn}`);
});

test('camera velocity is continuous (C1) across every chapter boundary', () => {
  const e = 1e-4;
  for (let i = 1; i < JOURNEY_LENGTH; i++) {
    const vLeft = sub(sampleCamera(i).pos, sampleCamera(i - e).pos).map((v) => v / e);
    const vRight = sub(sampleCamera(i + e).pos, sampleCamera(i).pos).map((v) => v / e);
    const diff = Math.hypot(vLeft[0] - vRight[0], vLeft[1] - vRight[1], vLeft[2] - vRight[2]);
    const speed = Math.max(1, Math.hypot(vLeft[0], vLeft[1], vLeft[2]));
    assert.ok(diff / speed < 0.02, `velocity discontinuity at V${i}→V${i + 1}: ${diff}`);
  }
});

test('journey starts and ends at rest', () => {
  const e = 1e-4;
  assert.ok(len(sub(sampleCamera(e).pos, sampleCamera(0).pos)) < 1e-3);
  assert.ok(len(sub(sampleCamera(JOURNEY_LENGTH).pos, sampleCamera(JOURNEY_LENGTH - e).pos)) < 1e-3);
});

test('the camera never passes through the authored solid geometry', () => {
  const { heroRib, gallery, glazing, canopy } = LAYOUT;
  for (let s = 0; s <= JOURNEY_LENGTH; s += 0.0005) {
    const [x, y, z] = sampleCamera(s).pos;
    assert.ok(y > 1.2, `camera below eye level at s=${s}`);
    // Hero rib leg (V1 → V2 occluder).
    const nearRib = Math.abs(z - heroRib.z) < heroRib.depth / 2 + 0.3;
    assert.ok(!(nearRib && x > heroRib.legX0 - 0.3 && x < heroRib.legX1 + 0.3), `inside hero rib at s=${s}`);
    // Board-formed wall (solid except the broad opening).
    const inWall = z < gallery.wallZ + 0.3 && z > gallery.wallZ - gallery.wallThickness - 0.3;
    assert.ok(!(inWall && (x < gallery.wallEndX + 0.5 || x > gallery.openingX1 - 0.5)), `inside wall at s=${s}`);
    // Glazed thresholds.
    for (const fin of glazing.fins) {
      const inner = glazing.pathX + fin.side * glazing.finInnerGap;
      const outer = inner + fin.side * glazing.finWidth;
      const lo = Math.min(inner, outer);
      const hi = Math.max(inner, outer);
      const inPlane = Math.abs(z - fin.z) < 0.35;
      assert.ok(!(inPlane && x > lo - 0.3 && x < hi + 0.3), `inside fin at s=${s}`);
    }
    const inScreen = Math.abs(z - glazing.screen.z) < 0.25;
    assert.ok(!(inScreen && x > glazing.screen.x0 && x < glazing.screen.x1 + 0.3), `inside frosted screen at s=${s}`);
    // Masts.
    for (const mast of Object.values(canopy)) assert.ok(Math.hypot(x - mast[0], z - mast[2]) > 3, `at mast at s=${s}`);
  }
});

test('V1 → V2 rib briefly fills the view: the camera passes within 2 m of the leg, looking at it', () => {
  const { heroRib } = LAYOUT;
  let closest = Infinity;
  for (let s = 0.85; s <= 0.95; s += 0.001) {
    const p = sampleCamera(s).pos;
    const legCentre: Vec3 = [(heroRib.legX0 + heroRib.legX1) / 2, p[1], heroRib.z];
    const toLeg = sub(legCentre, p);
    const f = forward(s);
    const facing = (toLeg[0] * f[0] + toLeg[1] * f[1] + toLeg[2] * f[2]) / len(toLeg);
    if (facing > 0.8) closest = Math.min(closest, len(toLeg));
  }
  assert.ok(closest < 2.6, `closest facing distance ${closest}`);
});

test('scroll mapping is absolute, monotonic and reversible', () => {
  const marks = normalizeMarks([
    { s: 1, scroll: 900 },
    { s: 0, scroll: 0 },
    { s: READ_END, scroll: 400 },
    { s: 1 + READ_END, scroll: 880 }, // out of order: forced after the previous mark
  ]);
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i].scroll > marks[i - 1].scroll);
  let prev = -1;
  for (let y = -50; y < 1200; y += 7) {
    const s = scrollToJourney(y, marks);
    assert.ok(s >= prev);
    prev = s;
  }
  // Same scroll value, same state, regardless of the direction of arrival.
  assert.equal(scrollToJourney(512, marks), scrollToJourney(512, marks));
  assert.equal(scrollToJourney(-10, marks), 0);
  assert.equal(scrollToJourney(400, marks), READ_END);
});

test('a single smoothing policy settles promptly, never overshoots and cuts on anchor jumps', () => {
  let s = 0;
  for (let i = 0; i < 60; i++) s = stepJourney(s, 0.5, 1 / 60);
  assert.ok(Math.abs(s - 0.5) < 0.01, `not settled after 1 s: ${s}`);
  s = 0.2;
  for (let i = 0; i < 200; i++) {
    s = stepJourney(s, 0.6, 1 / 60);
    assert.ok(s <= 0.6);
  }
  assert.equal(stepJourney(0.3, 4.2, 1 / 60), 4.2, 'anchor jump should not fly through the rooms between');
  assert.equal(stepJourney(4.2, 0.3, 1 / 60), 0.3);
});

test('both environments of every transition are present for the whole overlap', () => {
  for (let i = 0; i < 5; i++) {
    for (let s = i + READ_END - 0.05; s <= i + 1.05; s += 0.01) {
      assert.ok(zoneVisible(i, s), `V${i + 1} missing at s=${s}`);
      assert.ok(zoneVisible(i + 1, s), `V${i + 2} missing at s=${s}`);
    }
  }
  assert.equal(ZONE_WINDOWS.length, 6);
});

test('reduced motion maps every position to a still chapter composition', () => {
  for (let s = 0; s <= JOURNEY_LENGTH; s += 0.05) {
    const still = stillJourney(s);
    assert.equal(stillJourney(still), still, 'still pose should be a fixed point');
  }
  assert.equal(stillJourney(JOURNEY_LENGTH), JOURNEY_LENGTH);
  assert.ok(stillJourney(0) < READ_END);
});

test('V4 performs four ordered calibrated adjustments, then opens; V5 tightens, then lifts', () => {
  const before = vaultState(2.8);
  assert.deepEqual(Object.values(before), [0, 0, 0, 0, 0]);
  const after = vaultState(4);
  assert.deepEqual(Object.values(after), [1, 1, 1, 1, 1]);
  // Each adjustment completes before the next begins.
  const order = ['support', 'seam', 'fold', 'resolve', 'open'] as const;
  for (let s = 2.8; s <= 4; s += 0.005) {
    const v = vaultState(s);
    for (let i = 1; i < order.length; i++) if (v[order[i]] > 0) assert.equal(v[order[i - 1]], 1);
  }
  assert.equal(canopyState(3.7).tension, 0);
  assert.equal(canopyState(5).lift, 1);
  for (let s = 3.5; s <= 5; s += 0.005) if (canopyState(s).lift > 0) assert.equal(canopyState(s).tension, 1);
});

test('exposure and sun direction are continuous across the shared world', () => {
  for (let s = 0; s < JOURNEY_LENGTH; s += 0.001) {
    const a = sampleAtmosphere(s);
    const b = sampleAtmosphere(s + 0.001);
    assert.ok(Math.abs(a.exposure - b.exposure) < 0.002);
    const da = sunDirection(s);
    const db = sunDirection(s + 0.001);
    assert.ok(len(sub(da, db)) < 0.01);
  }
});
