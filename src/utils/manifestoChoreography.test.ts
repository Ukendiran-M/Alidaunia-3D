import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BOUNDARIES,
  CHAPTERS,
  SNAP_VIEWS,
  boundaryVisuals,
  buildTrack,
  coverRadius,
  datumCue,
  followScroll,
  getTransitionState,
  lensCue,
  markPosition,
  parseMarkSpec,
  registrationCue,
  trackPosition,
  trackValue,
  windCue,
  windRoutePath,
} from './manifestoChoreography';

const page = readFileSync(new URL('../pages/ManifestoPage.tsx', import.meta.url), 'utf8');

test('mark specs parse track, value, line and edge; malformed entries are ignored', () => {
  assert.deepEqual(parseMarkSpec('M2:0@1, M2:0.43@0.1+0.08, M5:1@0.4/0.5'), [
    { track: 'M2', value: 0, line: 1, edge: 0, gap: 0 },
    { track: 'M2', value: 0.43, line: 0.1, edge: 0, gap: 0.08 },
    { track: 'M5', value: 1, line: 0.4, edge: 0.5, gap: 0 },
  ]);
  assert.deepEqual(parseMarkSpec('M9:1@0.5, M2:x@1, nonsense'), []);
  assert.deepEqual(parseMarkSpec(undefined), []);
});

test('a mark is reached when the element edge meets the line of the visible view', () => {
  // Element 1200px below the wrapper, 300px tall; header 97, visible view 803.
  const at = markPosition(1200, 300, { line: 0.5, edge: 0.5 }, 803, 97);
  // At that scroll, the element centre sits at header + half the view.
  assert.equal(1200 + 150 - at, 97 + 0.5 * 803);
});

test('tracks are monotone, hold beyond their ends and invert exactly', () => {
  const track = buildTrack([
    { value: 1, at: 900 },
    { value: 0, at: 100 },
    { value: 0.5, at: 400 },
    { value: 0.6, at: 380 }, // out of order in scroll space: pushed after its predecessor
  ]);
  for (let i = 1; i < track.length; i++) {
    assert.ok(track[i].value > track[i - 1].value);
    assert.ok(track[i].at > track[i - 1].at);
  }
  assert.equal(trackValue(track, -500), 0);
  assert.equal(trackValue(track, 5000), 1);
  for (const v of [0, 0.2, 0.5, 0.55, 0.8, 1]) assert.ok(Math.abs(trackValue(track, trackPosition(track, v)) - v) < 1e-9);
});

test('a minimum gap keeps steps apart when their reading blocks cross the line together', () => {
  // Very tall screen: five blocks reach their lines within 4px of each other.
  const track = buildTrack([0.44, 0.5, 0.57, 0.64, 0.71].map((value, i) => ({ value, at: 224 + i, minGap: 100 })));
  for (let i = 1; i < track.length; i++) assert.ok(track[i].at - track[i - 1].at >= 100);
});

test('one follow policy: eases short moves, snaps long jumps, settles exactly, reverses exactly', () => {
  const view = 800;
  // Long jump (anchor link, restored history): applied at once, nothing plays on the way.
  assert.equal(followScroll(0, SNAP_VIEWS * view + 10, 1 / 60, view), SNAP_VIEWS * view + 10);
  assert.equal(followScroll(Number.NaN, 4321, 1 / 60, view), 4321);
  // Short move: eased, never overshooting, and settling on the exact target.
  let y = 0;
  let frames = 0;
  while (y !== 600 && frames < 600) {
    const next = followScroll(y, 600, 1 / 60, view);
    assert.ok(next >= y && next <= 600);
    y = next;
    frames++;
  }
  assert.equal(y, 600);
  assert.ok(frames < 60, `settles within a second (${frames} frames)`);
  while (y !== 0) y = followScroll(y, 0, 1 / 60, view);
  assert.equal(y, 0);
});

test('transition state reproduces the kit helper', () => {
  for (const boundary of BOUNDARIES) {
    const start = getTransitionState(boundary, 0);
    const end = getTransitionState(boundary, 1);
    assert.equal(start.outgoingOpacity, 1);
    assert.equal(start.incomingOpacity, 0);
    assert.equal(end.outgoingOpacity, 0);
    assert.equal(end.incomingOpacity, 1);
    assert.deepEqual(getTransitionState(boundary, 0.3, true), end);
  }
  assert.equal(getTransitionState('M3_M4', 0.5).irisRadius, 1);
});

test('boundary visuals stay restrained: outgoing objects never vanish in place, reduced motion is static', () => {
  for (const boundary of BOUNDARIES) {
    for (let p = 0; p <= 1; p += 0.05) {
      const v = boundaryVisuals(boundary, p);
      assert.ok(v.outgoing.opacity >= 0.3 - 1e-9 && v.outgoing.opacity <= 1);
      assert.ok(Math.abs(v.outgoing.offset) <= 0.06 + 1e-9 && Math.abs(v.incoming.offset) <= 0.06 + 1e-9);
    }
    assert.deepEqual(boundaryVisuals(boundary, 0.4, true), { outgoing: { opacity: 1, offset: 0 }, incoming: { opacity: 1, offset: 0 } });
  }
});

test('four distinct cues: each starts empty, completes, and leaves only what should remain', () => {
  // Datum: the line becomes M3's permanent survey rule.
  assert.deepEqual(datumCue(0), { line: 0, datums: 0, register: 0 });
  assert.deepEqual(datumCue(1), { line: 1, datums: 1, register: 1 });
  // Lens: ring forms and closes again; the iris opens monotonically and completes.
  const lens = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(lensCue);
  assert.equal(lens[0].ring, 0);
  assert.ok(Math.abs(lens[10].ring) < 1e-9);
  assert.ok(Math.max(...lens.map((c) => c.ring)) > 0.9);
  for (let i = 1; i < lens.length; i++) assert.ok(lens[i].iris >= lens[i - 1].iris);
  assert.equal(lens[0].iris, 0);
  assert.equal(lens[10].iris, 1);
  assert.equal(lens[10].outgoing, 1);
  // Wind route: the line arrives before it clears.
  assert.equal(windCue(0).line, 0);
  assert.equal(windCue(0.86).line, 1);
  assert.equal(windCue(0.86).end, 1);
  assert.equal(windCue(1).fade, 0);
  // Registration: guides and cross clear before the mark holds still.
  assert.equal(registrationCue(0).guides, 0);
  assert.equal(registrationCue(0.66).cross, 1);
  assert.equal(registrationCue(1).fade, 0);
});

test('cue geometry: the iris covers its section and the airflow path joins its two ends', () => {
  for (const [cx, w, h] of [[300, 1440, 1100], [1300, 1440, 900], [20, 390, 1400]]) {
    const r = coverRadius(cx, 0, w, h);
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) assert.ok(Math.hypot(x - cx, y) <= r + 1e-9);
  }
  const d = windRoutePath({ x: 1200, y: 300 }, { x: 1, y: 0.2 }, { x: 80, y: 1100 });
  assert.match(d, /^M1200\.0 300\.0C/);
  assert.match(d, / 80\.0 1100\.0$/);
  // With a lane, the line runs down the lane (clear of the copy) before turning to its mark.
  const laned = windRoutePath({ x: 900, y: 300 }, { x: 1, y: 0.1 }, { x: 720, y: 1400 }, 1300);
  assert.match(laned, /^M900\.0 300\.0C.* 1300\.0 460\.0L1300\.0 1220\.0C.* 720\.0 1400\.0$/);
});

test('the page measures a track for every chapter and boundary, from content already in the page', () => {
  const specs = [...page.matchAll(/data-mf(?:-sm)?=(?:"([^"]+)"|\{`([^`]+)`\})/g)].map((m) => m[1] ?? m[2]);
  const tracks = new Set(specs.flatMap((s) => s.split(',').map((part) => part.trim().split(':')[0])));
  for (const id of [...CHAPTERS, ...BOUNDARIES]) assert.ok(tracks.has(id), `no marks for ${id}`);
  // No spacer elements: every mark sits on a section, stage, visual wrapper or reading block.
  assert.doesNotMatch(page, /mf-spacer|min-h-\[\d+vh\]|height:\s*['"]?\d{3}vh/);
  // Chapter object marks complete at 1; boundary marks run 0 → 1.
  for (const id of CHAPTERS) assert.ok(specs.some((s) => new RegExp(`${id}:1@`).test(s)), `${id} never completes`);
  for (const id of BOUNDARIES) {
    assert.ok(specs.some((s) => s.includes(`${id}:0@`)) && specs.some((s) => s.includes(`${id}:1@`)), `${id} boundary incomplete`);
  }
});

test('M2 systems and M3 phases follow the clip order', () => {
  const systems = /M2_SYSTEM_STARTS = \[([^\]]+)\]/.exec(page)![1].split(',').map(Number);
  const phases = /M3_PHASE_STARTS = \[([^\]]+)\]/.exec(page)![1].split(',').map(Number);
  assert.equal(systems.length, 5);
  assert.equal(phases.length, 4);
  for (const list of [systems, phases]) for (let i = 1; i < list.length; i++) assert.ok(list[i] > list[i - 1]);
  // Systems begin after the unroll mark (.43) and before the settled hold.
  assert.ok(systems[0] > 0.43 && systems[4] < 0.95);
});

test('text entrances use known kinds, and the actions never wait for an animation', () => {
  const kinds = [...page.matchAll(/data-reveal="([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(kinds.length > 10);
  for (const kind of kinds) assert.ok(['lines', 'words', 'plane', 'block', 'block-x', 'rule', 'connect', 'register', 'rise'].includes(kind), kind);
  // Five distinct heading motifs: lines (M2), plane (M3), words (M4), connect (M5), register (M6).
  for (const motif of ['lines', 'plane', 'words', 'connect', 'register']) assert.ok(kinds.includes(motif), motif);
  const actions = page.slice(page.indexOf('className="mf-actions'), page.indexOf('</section>', page.indexOf('className="mf-actions')));
  assert.doesNotMatch(actions, /data-reveal/);
});

test('progress-synced accents follow the clip windows in order', () => {
  const windows = (name: string) => {
    const start = page.indexOf(`${name} = `);
    const source = page.slice(start, page.indexOf('];', start));
    return [...source.matchAll(/(\d*\.?\d+), (\d*\.?\d+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
  };
  const m2 = windows('M2_SYSTEM_WINDOWS');
  assert.equal(m2.length, 5);
  for (let i = 0; i < m2.length; i++) {
    assert.ok(m2[i][0] < m2[i][1] && m2[i][1] <= 1);
    if (i) assert.ok(m2[i][0] > m2[i - 1][0]);
  }
});
