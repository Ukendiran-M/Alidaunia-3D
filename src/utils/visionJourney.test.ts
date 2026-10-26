import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AW139,
  CAMERA_KEYS,
  JOURNEY_LENGTH,
  LAYOUT,
  READ_END,
  ROTOR_HUB,
  aircraftToWorld,
  dossierAlignment,
  doorLeafX0,
  drawingState,
  fixtureLight,
  normalizeMarks,
  resolveMarks,
  readingWeight,
  sampleAtmosphere,
  sampleCamera,
  sampleCameraMobile,
  scrollToJourney,
  stepJourney,
  stillJourney,
  worldToAircraft,
  type CameraPose,
  type Vec3,
} from './visionJourney';

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
const norm = (v: Vec3): Vec3 => {
  const l = len(v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const forward = (p: CameraPose) => norm(sub(p.target, p.pos));
const STEP = 0.0005;
const PATHS: [string, (s: number) => CameraPose][] = [
  ['desktop', sampleCamera],
  ['mobile', sampleCameraMobile],
];

function distanceToSegment(p: Vec3, a: Vec3, b: Vec3) {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, (sub(p, a)[0] * ab[0] + sub(p, a)[1] * ab[1] + sub(p, a)[2] * ab[2]) / (len(ab) ** 2)));
  return len(sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]));
}
const inBox = (p: Vec3, min: Vec3, max: Vec3, pad: number) =>
  p[0] > min[0] - pad && p[0] < max[0] + pad && p[1] > min[1] - pad && p[1] < max[1] + pad && p[2] > min[2] - pad && p[2] < max[2] + pad;

test('camera keys are ordered and span the whole journey', () => {
  assert.equal(CAMERA_KEYS[0].s, 0);
  assert.equal(CAMERA_KEYS[CAMERA_KEYS.length - 1].s, JOURNEY_LENGTH);
  for (let i = 1; i < CAMERA_KEYS.length; i++) assert.ok(CAMERA_KEYS[i].s > CAMERA_KEYS[i - 1].s);
});

test('aircraft placement round-trips between model and world space', () => {
  const p: Vec3 = [3.2, 1.1, -0.7];
  const back = worldToAircraft(aircraftToWorld(p));
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(back[i] - p[i]) < 1e-9);
  // Nose points towards the apron (+Z).
  const nose = aircraftToWorld([5, 0, 0]);
  assert.ok(nose[2] > LAYOUT.aircraft.z + 4);
});

for (const [name, path] of PATHS) {
  test(`${name}: position, heading and lens shift are continuous everywhere`, () => {
    let maxStep = 0;
    let maxTurn = 0;
    for (let s = 0; s < JOURNEY_LENGTH; s += STEP) {
      const a = path(s);
      const b = path(s + STEP);
      maxStep = Math.max(maxStep, len(sub(b.pos, a.pos)));
      const fa = forward(a);
      const fb = forward(b);
      maxTurn = Math.max(maxTurn, Math.acos(Math.min(1, fa[0] * fb[0] + fa[1] * fb[1] + fa[2] * fb[2])));
      assert.ok(Math.abs(b.shift - a.shift) < 0.003, `lens shift jumps at s=${s.toFixed(4)}`);
    }
    assert.ok(maxStep < 0.12, `largest positional step ${maxStep}`);
    assert.ok(maxTurn < (1.2 * Math.PI) / 180, `largest heading step ${maxTurn}`);
  });
}

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

for (const [name, path] of PATHS) {
  test(`${name}: the camera clears the aircraft — airframe, tail and all five blades`, () => {
    const hub = ROTOR_HUB;
    const tips = AW139.bladeTips.map(aircraftToWorld);
    for (let s = 0; s <= JOURNEY_LENGTH; s += STEP) {
      const p = path(s).pos;
      const m = worldToAircraft(p);
      assert.ok(!inBox(m, AW139.airframe.min, AW139.airframe.max, 0.45), `inside airframe at s=${s.toFixed(4)}`);
      assert.ok(!inBox(m, AW139.tail.min, AW139.tail.max, 0.45), `inside tail at s=${s.toFixed(4)}`);
      for (const [i, tip] of tips.entries()) {
        const d = distanceToSegment(p, [hub[0], AW139.bladeY, hub[2]], [tip[0], AW139.bladeY, tip[2]]);
        assert.ok(d > 0.55, `within ${d.toFixed(2)} m of blade ${i + 1} at s=${s.toFixed(4)}`);
      }
    }
  });

  test(`${name}: the camera only passes walls, glazing and the door through real openings`, () => {
    const { hangar, door, annex, draftingTable, sideWorktops, briefingTable, stand, fixture } = LAYOUT;
    let prev = path(0).pos;
    for (let s = STEP; s <= JOURNEY_LENGTH; s += STEP) {
      const p = path(s).pos;
      const at = `s=${s.toFixed(4)}`;
      assert.ok(p[1] > 0.55, `camera too low at ${at}`);
      // Hangar ↔ annex wall (x = 16): ground-floor door or the open upper mezzanine only.
      if ((prev[0] - annex.x0) * (p[0] - annex.x0) <= 0 && p[2] < 0) {
        const groundDoor = p[2] > annex.groundDoorZ[0] + 0.3 && p[2] < annex.groundDoorZ[1] - 0.3 && p[1] < 2.3;
        const mezzanine = p[2] > annex.z0 && p[2] < annex.studioEndZ - 0.3 && p[1] > annex.upper + 1.25;
        assert.ok(groundDoor || mezzanine, `through the annex wall at ${at}`);
      }
      // Annex front façade (z = −4).
      if ((prev[2] - annex.z1) * (p[2] - annex.z1) <= 0 && p[0] > annex.x0 && p[0] < annex.x1) {
        const ground = p[0] > annex.groundFrontDoorX[0] + 0.3 && p[0] < annex.groundFrontDoorX[1] - 0.3 && p[1] < 2.3;
        const upper = p[0] > annex.upperFrontDoorX[0] + 0.3 && p[0] < annex.upperFrontDoorX[1] - 0.3 && p[1] > annex.upper + 0.3 && p[1] < annex.upper + 2.3;
        assert.ok(ground || upper, `through the annex front at ${at}`);
      }
      // Studio end wall (z = −20, upper floor).
      if ((prev[2] - annex.studioEndZ) * (p[2] - annex.studioEndZ) <= 0 && p[0] > annex.x0 && p[0] < annex.x1 && p[1] > annex.upper) {
        assert.ok(p[0] > annex.studioEndDoorX[0] + 0.3 && p[0] < annex.studioEndDoorX[1] - 0.3 && p[1] < annex.upper + 2.3, `through the studio end wall at ${at}`);
      }
      // Never through the intermediate slab inside the annex.
      if (p[0] > annex.x0 && p[0] < annex.x1 && p[2] > annex.z0 && p[2] < annex.z1) {
        const crossed = (prev[1] - annex.slab) * (p[1] - annex.slab) <= 0 || (prev[1] - annex.upper) * (p[1] - annex.upper) <= 0;
        assert.ok(!crossed, `through the annex slab at ${at}`);
      }
      // Hangar side and back walls.
      assert.ok(!(p[2] < hangar.zFront && (p[0] < hangar.x0 + 0.4 || p[2] < hangar.zBack + 0.4)), `outside the hangar shell at ${at}`);
      // Door plane: never through the moving leaf or the stacked leaves.
      if (Math.abs(p[2] - door.trackZ) < 0.8 && p[0] < hangar.x1) {
        const x0 = doorLeafX0(s);
        assert.ok(!(p[0] > x0 - 0.5 && p[0] < x0 + door.leafWidth + 0.5), `through the moving door leaf at ${at}`);
        assert.ok(p[0] > -9.5, `through the stacked leaves at ${at}`);
        assert.ok(p[1] < hangar.doorHeight - 0.5, `through the door header at ${at}`);
      }
      // Furniture and fixtures.
      const table = (b: { x0: number; x1: number; z0: number; z1: number; top: number }, base: number) =>
        p[0] > b.x0 - 0.25 && p[0] < b.x1 + 0.25 && p[2] > b.z0 - 0.25 && p[2] < b.z1 + 0.25 && p[1] > base && p[1] < b.top + 0.35;
      assert.ok(!table(draftingTable, annex.upper), `inside the drafting table at ${at}`);
      for (const w of sideWorktops) assert.ok(!table(w, annex.upper), `inside a worktop at ${at}`);
      assert.ok(!table(briefingTable, 0), `inside the briefing table at ${at}`);
      const onStand = Math.abs(p[0] - stand.x) < stand.halfX + 0.3 && Math.abs(p[2] - stand.z) < stand.halfZ + 0.3 && p[1] < stand.rail + 0.4;
      assert.ok(!onStand, `inside the maintenance stand at ${at}`);
      assert.ok(len(sub(p, [fixture[0], 0.2, fixture[2]])) > 1.2, `too close to the edge light at ${at}`);
      prev = p;
    }
  });
}

test('V1 → V2: the leaf covers the sightline, then its edge sweeps past before the camera reaches the track', () => {
  const { door } = LAYOUT;
  // Before the slide, the closed leaf fills the forward view.
  const before = sampleCamera(0.85);
  assert.ok(doorLeafX0(0.85) > before.pos[0] - door.leafWidth && doorLeafX0(0.85) < before.pos[0], 'leaf should be in front of the camera');
  assert.ok(door.trackZ - before.pos[2] < 4.5 && forward(before)[2] > 0.6, 'camera should face the leaf at close range');
  // The leaf's trailing edge crosses the camera's x while the camera is still inside.
  let crossing = -1;
  for (let s = 0.83; s <= 1; s += 0.001) {
    if (doorLeafX0(s) + door.leafWidth < sampleCamera(s).pos[0]) {
      crossing = s;
      break;
    }
  }
  assert.ok(crossing > 0 && sampleCamera(crossing).pos[2] < door.trackZ - 0.8, 'edge must clear the sightline before the camera reaches the track');
  // The leaf never reaches the aircraft (it runs on the outer track).
  assert.ok(door.trackZ - door.thickness > aircraftToWorld([5.2, 0, 0])[2] + 4);
});

test('V4 holds a measured 20–30° arc around the rotor hub at reading distance', () => {
  const bearing = (s: number) => {
    const p = sampleCamera(s).pos;
    return (Math.atan2(p[2] - ROTOR_HUB[2], p[0] - ROTOR_HUB[0]) * 180) / Math.PI;
  };
  const sweep = bearing(3 + READ_END) - bearing(3.15);
  assert.ok(sweep > 20 && sweep < 35, `arc ${sweep.toFixed(1)}°`);
  for (let s = 3.15; s <= 3 + READ_END; s += 0.01) {
    const p = sampleCamera(s);
    const d = len(sub(p.pos, ROTOR_HUB));
    assert.ok(d > 3 && d < 5.6, `distance ${d.toFixed(2)} at s=${s.toFixed(2)}`);
    const toHub = norm(sub(ROTOR_HUB, p.pos));
    const f = forward(p);
    assert.ok(toHub[0] * f[0] + toHub[1] * f[1] + toHub[2] * f[2] > 0.97, 'the hub stays near the centre of the view');
  }
});

test('V4 → V5 passes beneath blade 01 with clearance', () => {
  const tip = aircraftToWorld(AW139.bladeTips[0]);
  let under = false;
  for (let s = 3.8; s <= 4; s += 0.001) {
    const p = sampleCamera(s).pos;
    const horizontal = distanceToSegment([p[0], 0, p[2]], [ROTOR_HUB[0], 0, ROTOR_HUB[2]], [tip[0], 0, tip[2]]);
    if (horizontal < 0.3) {
      under = true;
      assert.ok(p[1] < AW139.bladeY - 0.6, `beneath the blade with only ${(AW139.bladeY - p[1]).toFixed(2)} m clearance`);
    }
  }
  assert.ok(under, 'the camera should pass beneath the blade');
});

test('scroll mapping is absolute, monotonic and reversible', () => {
  const marks = normalizeMarks([
    { s: 1, scroll: 900 },
    { s: 0, scroll: 0 },
    { s: READ_END, scroll: 400 },
    { s: 1 + READ_END, scroll: 880 },
  ]);
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i].scroll > marks[i - 1].scroll);
  let prev = -1;
  for (let y = -50; y < 1200; y += 7) {
    const s = scrollToJourney(y, marks);
    assert.ok(s >= prev);
    prev = s;
  }
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
  assert.equal(stepJourney(0.3, 4.2, 1 / 60), 4.2);
  assert.equal(stepJourney(4.2, 0.3, 1 / 60), 0.3);
});

test('reduced motion maps every position to a still chapter composition', () => {
  for (let s = 0; s <= JOURNEY_LENGTH; s += 0.05) {
    const still = stillJourney(s);
    assert.equal(stillJourney(still), still);
  }
  assert.equal(stillJourney(JOURNEY_LENGTH), JOURNEY_LENGTH);
  // Every still shows its chapter's authored state completed.
  assert.equal(fixtureLight(stillJourney(1.3)), 1);
  assert.equal(drawingState(stillJourney(2.3)).review, 1);
  assert.equal(dossierAlignment(stillJourney(4.3)), 1);
});

test('mobile damping only acts while reading, never during transitions', () => {
  for (let i = 0; i < 5; i++) {
    for (let s = i + READ_END; s <= i + 1; s += 0.005) assert.equal(readingWeight(s), 0, `weight during transition at s=${s}`);
  }
  assert.ok(readingWeight(0.3) > 0.9);
});

test('authored object states are ordered and complete', () => {
  assert.equal(doorLeafX0(0.5), LAYOUT.door.closedX0);
  assert.equal(doorLeafX0(1), LAYOUT.door.openX0);
  assert.equal(fixtureLight(1), 0);
  assert.equal(fixtureLight(1 + READ_END), 1);
  const d1 = drawingState(2.12);
  const d3 = drawingState(2 + READ_END);
  assert.equal(d1.construction, 0);
  assert.equal(d1.review, 0);
  assert.equal(d3.construction, 1);
  assert.equal(d3.review, 1);
  for (let s = 2; s <= 3; s += 0.005) if (drawingState(s).review > 0) assert.equal(drawingState(s).construction, 1);
  assert.equal(dossierAlignment(4), 0);
  assert.equal(dossierAlignment(4 + READ_END), 1);
});

test('exposure adapts continuously between interior and daylight', () => {
  for (let s = 0; s < JOURNEY_LENGTH; s += 0.001) {
    const a = sampleAtmosphere(s);
    const b = sampleAtmosphere(s + 0.001);
    assert.ok(Math.abs(a.exposure - b.exposure) < 0.002);
  }
});

test('measured marks keep the final pose reachable and respect a local minimum distance', () => {
  const view = 800;
  // The settle mark sits only 50 px after the V6 mark: it is moved to the 0.25-view minimum.
  const near = resolveMarks([{ s: 5, scroll: 1000 }, { s: 6, scroll: 1050, minGap: 0.25 }], view, 5000);
  assert.equal(near[1].scroll, 1200);
  // A settle mark beyond the end of the document is pulled back so it can be reached.
  const far = resolveMarks([{ s: 5, scroll: 1000 }, { s: 6, scroll: 1900, minGap: 0.25 }], view, 1500);
  assert.equal(far[1].scroll, 1500);
  // Earlier marks are untouched by the cap, and order stays strictly increasing.
  const marks = resolveMarks([{ s: 0, scroll: 0 }, { s: 1, scroll: 900 }, { s: 6, scroll: 4000 }], view, 2000);
  assert.deepEqual(marks.map((m) => m.scroll), [0, 900, 2000]);
});
