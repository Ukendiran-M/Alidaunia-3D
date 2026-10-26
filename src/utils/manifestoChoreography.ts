/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Manifesto M2–M6: pure scroll-to-progress mapping and boundary-cue state.
 *
 * Every chapter object and every boundary cue has a track: a monotone list of
 * (progress value, scroll position) pairs measured from the real layout.
 * A mark is written in the page as `track:value@line[/edge]`, meaning "the
 * track reaches `value` when this element's `edge` (0 top, .5 centre, 1 bottom)
 * reaches `line` of the visible viewport below the header". Nothing here adds
 * scroll distance: tracks only describe content that is already in the page.
 */

export type ChapterId = 'M2' | 'M3' | 'M4' | 'M5' | 'M6';
export type BoundaryId = 'M2_M3' | 'M3_M4' | 'M4_M5' | 'M5_M6';
export type TrackId = ChapterId | BoundaryId;

export const CHAPTERS: ChapterId[] = ['M2', 'M3', 'M4', 'M5', 'M6'];
export const BOUNDARIES: BoundaryId[] = ['M2_M3', 'M3_M4', 'M4_M5', 'M5_M6'];
const TRACKS = new Set<string>([...CHAPTERS, ...BOUNDARIES]);

export interface MarkSpec {
  track: TrackId;
  value: number;
  line: number;
  edge: number;
  /** Minimum scroll after the previous mark of the track, in visible heights (`+gap`). */
  gap: number;
}

export interface Mark {
  value: number;
  /** Scroll position relative to the top of the Manifesto M2–M6 wrapper. */
  at: number;
  /** Minimum distance from the previous mark, in px. */
  minGap?: number;
}

export type Track = Mark[];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/**
 * Parses `"M2:0@1, M2:.5@.9+.08"` into mark specs; malformed entries are ignored.
 * The optional `+gap` keeps a step readable on very tall screens, where several
 * reading blocks would otherwise cross their lines within a few pixels.
 */
export function parseMarkSpec(spec: string | undefined): MarkSpec[] {
  if (!spec) return [];
  const out: MarkSpec[] = [];
  for (const part of spec.split(',')) {
    const match = /^\s*([A-Z0-9_]+):([\d.]+)@([\d.]+)(?:\/([\d.]+))?(?:\+([\d.]+))?\s*$/.exec(part);
    if (!match || !TRACKS.has(match[1])) continue;
    const value = Number(match[2]);
    const line = Number(match[3]);
    const edge = match[4] === undefined ? 0 : Number(match[4]);
    const gap = match[5] === undefined ? 0 : Number(match[5]);
    if ([value, line, edge, gap].every(Number.isFinite)) out.push({ track: match[1] as TrackId, value: clamp01(value), line, edge: clamp01(edge), gap });
  }
  return out;
}

/**
 * Scroll position (relative to the wrapper) at which `edge` of an element whose
 * top sits `top` px below the wrapper top reaches `line` of the visible view.
 */
export function markPosition(top: number, height: number, spec: Pick<MarkSpec, 'line' | 'edge'>, view: number, header: number) {
  return top + spec.edge * height - header - spec.line * view;
}

/** Orders marks by value and keeps their scroll positions strictly increasing (and apart by minGap). */
export function buildTrack(marks: Mark[]): Track {
  const sorted = [...marks].sort((a, b) => a.value - b.value || a.at - b.at);
  const out: Track = [];
  for (const mark of sorted) {
    const prev = out[out.length - 1];
    if (prev && mark.value === prev.value) continue;
    out.push({ value: mark.value, at: prev ? Math.max(mark.at, prev.at + Math.max(1, mark.minGap ?? 0)) : mark.at });
  }
  return out;
}

/** Track value at a relative scroll position: linear between marks, held beyond them. */
export function trackValue(track: Track, at: number) {
  if (!track.length) return 0;
  if (at <= track[0].at) return track[0].value;
  for (let i = 1; i < track.length; i++) {
    const b = track[i];
    if (at <= b.at) {
      const a = track[i - 1];
      return a.value + ((at - a.at) / (b.at - a.at)) * (b.value - a.value);
    }
  }
  return track[track.length - 1].value;
}

/** Relative scroll position at which a track reaches `value` (inverse of trackValue). */
export function trackPosition(track: Track, value: number) {
  if (!track.length) return 0;
  if (value <= track[0].value) return track[0].at;
  for (let i = 1; i < track.length; i++) {
    const b = track[i];
    if (value <= b.value) {
      const a = track[i - 1];
      return a.at + ((value - a.value) / (b.value - a.value)) * (b.at - a.at);
    }
  }
  return track[track.length - 1].at;
}

/**
 * The single scrub policy: the scroll position used for every object and cue
 * follows the native scroll exponentially, and snaps for jumps longer than
 * SNAP_VIEWS visible heights (anchor links, restored history, route entry) so
 * that no intermediate section plays on the way.
 */
export const FOLLOW_RATE = 11;
export const SNAP_VIEWS = 1.2;

export function followScroll(current: number, target: number, dt: number, view: number) {
  if (!Number.isFinite(current) || Math.abs(target - current) > SNAP_VIEWS * view) return target;
  const next = current + (target - current) * (1 - Math.exp(-FOLLOW_RATE * Math.max(0, dt)));
  return Math.abs(target - next) < 0.5 ? target : next;
}

// ---------------------------------------------------------------------------
// Boundary transitions. getTransitionState is the kit's
// integration/transitionState.ts; the cue functions below turn it into the four
// distinct boundary events used by the page.
// ---------------------------------------------------------------------------

export function getTransitionState(boundary: BoundaryId, progress: number, reducedMotion = false) {
  const p = reducedMotion ? 1 : clamp01(progress);
  const out = 1 - smoothstep(0.35, 0.78, p);
  const incoming = smoothstep(0.28, 0.72, p);
  const common = { outgoingOpacity: out, incomingOpacity: incoming, cueProgress: p };
  switch (boundary) {
    case 'M2_M3': return { ...common, cue: 'datum-line' as const, outgoingOffsetY: -0.12 * p, incomingOffsetY: 0.12 * (1 - p), irisRadius: 0 };
    case 'M3_M4': return { ...common, cue: 'lens-iris' as const, outgoingOffsetY: 0, incomingOffsetY: 0, irisRadius: Math.sin(Math.PI * p) };
    case 'M4_M5': return { ...common, cue: 'wind-route' as const, outgoingOffsetY: -0.08 * p, incomingOffsetY: 0.08 * (1 - p), irisRadius: 0 };
    case 'M5_M6': return { ...common, cue: 'registration' as const, outgoingOffsetY: -0.1 * p, incomingOffsetY: 0.1 * (1 - p), irisRadius: 0 };
  }
}

/** How far the outgoing/incoming visuals move, as a share of the kit's offsets. */
const OFFSET_SCALE = 0.5;
/** Outgoing visuals never fade below this: they leave the view, they do not vanish in place. */
const OUTGOING_FLOOR = 0.3;

export interface BoundaryVisuals {
  outgoing: { opacity: number; offset: number };
  incoming: { opacity: number; offset: number };
}

export function boundaryVisuals(boundary: BoundaryId, p: number, reducedMotion = false): BoundaryVisuals {
  if (reducedMotion) return { outgoing: { opacity: 1, offset: 0 }, incoming: { opacity: 1, offset: 0 } };
  const t = getTransitionState(boundary, p);
  return {
    outgoing: { opacity: OUTGOING_FLOOR + (1 - OUTGOING_FLOOR) * t.outgoingOpacity, offset: t.outgoingOffsetY * OFFSET_SCALE },
    incoming: { opacity: t.incomingOpacity, offset: t.incomingOffsetY * OFFSET_SCALE },
  };
}

/** M2 → M3: one drawing line drops from the folio and becomes M3's survey datum. */
export function datumCue(p: number) {
  return {
    line: smoothstep(0, 0.6, p),
    datums: smoothstep(0.42, 0.78, p),
    register: smoothstep(0.62, 0.92, p),
  };
}

/** M3 → M4: a perimeter-light lens forms on the boundary and opens M4's navy as an iris. */
export function lensCue(p: number) {
  const t = getTransitionState('M3_M4', p);
  return {
    incoming: smoothstep(0, 0.3, p),
    ring: smoothstep(0.14, 0.34, p) * (p < 0.5 ? 1 : t.irisRadius),
    iris: smoothstep(0.26, 0.86, p),
    outgoing: smoothstep(0.62, 1, p),
    fade: 1 - smoothstep(0.86, 1, p),
  };
}

/** M4 → M5: an airflow line leaves the settled windsock and lands on M5's first connection mark. */
export function windCue(p: number) {
  return {
    start: smoothstep(0, 0.12, p),
    line: smoothstep(0.06, 0.78, p),
    end: smoothstep(0.7, 0.86, p),
    fade: 1 - smoothstep(0.9, 1, p),
  };
}

/** M5 → M6: datum lines and corner guides register around the incoming brand mark, then clear. */
export function registrationCue(p: number) {
  return {
    datum: smoothstep(0, 0.42, p),
    guides: smoothstep(0.22, 0.6, p),
    cross: smoothstep(0.36, 0.66, p),
    fade: 1 - smoothstep(0.78, 1, p),
  };
}

/** Projected positions inside a slot, as CSS pixels. */
export interface SlotPoint {
  x: number;
  y: number;
}

/**
 * The airflow path: it leaves the windsock along its axis and settles onto `end` from above.
 * With a `lane` (an x position clear of the copy), it carries on downwind into that lane,
 * runs down it past the paragraphs, and only then turns towards `end`.
 */
export function windRoutePath(start: SlotPoint, direction: SlotPoint, end: SlotPoint, lane?: number) {
  const f = (n: number) => n.toFixed(1);
  const length = Math.hypot(direction.x, direction.y) || 1;
  const ux = direction.x / length;
  const uy = direction.y / length;
  if (lane === undefined || lane <= start.x + 24 || end.y - start.y < 320) {
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const lead = Math.max(80, Math.min(560, distance * 0.55));
    const settle = Math.max(80, Math.min(420, distance * 0.45));
    return `M${f(start.x)} ${f(start.y)}C${f(start.x + ux * lead)} ${f(start.y + uy * lead)} ${f(end.x)} ${f(end.y - settle)} ${f(end.x)} ${f(end.y)}`;
  }
  const lead = Math.min(220, (lane - start.x) * 0.8);
  const enter = start.y + 160;
  const leave = Math.max(enter, end.y - 180);
  const turn = Math.min(180, Math.abs(lane - end.x) * 0.6);
  return (
    `M${f(start.x)} ${f(start.y)}C${f(start.x + ux * lead)} ${f(start.y + uy * lead)} ${f(lane)} ${f(enter - 90)} ${f(lane)} ${f(enter)}` +
    `L${f(lane)} ${f(leave)}` +
    `C${f(lane)} ${f(leave + 110)} ${f(end.x + Math.sign(lane - end.x) * turn)} ${f(end.y)} ${f(end.x)} ${f(end.y)}`
  );
}

/** Radius that covers every corner of a w×h box from (cx, cy). */
export function coverRadius(cx: number, cy: number, w: number, h: number) {
  return Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
}
