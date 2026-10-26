/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Connects native document scrolling to the Manifesto M2–M6 objects and the
 * four boundary cues. Positions are measured from the real layout (after
 * fonts settle and on every resize); one follow policy turns scroll into every
 * progress value; the shared renderer draws only visible chapters on demand.
 */

import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BOUNDARIES,
  CHAPTERS,
  boundaryVisuals,
  buildTrack,
  coverRadius,
  datumCue,
  followScroll,
  lensCue,
  markPosition,
  parseMarkSpec,
  registrationCue,
  trackPosition,
  trackValue,
  windCue,
  windRoutePath,
  type BoundaryId,
  type ChapterId,
  type Mark,
  type SlotPoint,
  type Track,
  type TrackId,
} from '../utils/manifestoChoreography';
import type { Insets, ManifestoRenderer } from './createManifestoRenderer';

type SlotState = 'loading' | 'ready' | 'fallback';

type Slot = {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  insets: Insets;
  state: SlotState;
};

const NEIGHBOURS: Record<BoundaryId, [ChapterId, ChapterId]> = {
  M2_M3: ['M2', 'M3'],
  M3_M4: ['M3', 'M4'],
  M4_M5: ['M4', 'M5'],
  M5_M6: ['M5', 'M6'],
};

const NO_INSETS: Insets = { top: 0.06, right: 0.04, bottom: 0.06, left: 0.04 };

function parseInsets(spec: string | undefined): Insets {
  const values = (spec ?? '').split(',').map(Number);
  if (values.length !== 4 || !values.every(Number.isFinite)) return NO_INSETS;
  const [top, right, bottom, left] = values;
  return { top, right, bottom, left };
}

export function useManifestoChoreography(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;
    const root: HTMLElement = host;
    const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Development-only switches so the still and fallback states can be inspected.
      Boolean(devParams?.has('reduced-motion'));
    const forceFallback = Boolean(devParams?.has('fallback'));
    const smallQuery = window.matchMedia('(max-width: 767px)');
    // Short desktop/landscape screens: the stages run in normal flow (no sticky figure).
    const shortQuery = window.matchMedia('(min-width: 768px) and (max-height: 700px), (max-width: 767px) and (max-height: 620px)');
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';

    const svg = root.querySelector<SVGSVGElement>('.mf-cues');
    const q = <T extends Element>(selector: string) => root.querySelector<T>(selector);
    const cue = {
      datumMain: q<SVGPathElement>('[data-cue-part="datum-main"]'),
      datumLeft: q<SVGPathElement>('[data-cue-part="datum-left"]'),
      datumInk: q<SVGLinearGradientElement>('#mf-datum-ink'),
      windInk: q<SVGLinearGradientElement>('#mf-wind-ink'),
      datums: q<SVGPathElement>('[data-cue-part="datums"]'),
      register: q<SVGPathElement>('[data-cue-part="register"]'),
      lensIn: q<SVGPathElement>('[data-cue-part="lens-in"]'),
      lensRing: q<SVGCircleElement>('[data-cue-part="lens-ring"]'),
      lensCore: q<SVGCircleElement>('[data-cue-part="lens-core"]'),
      lensOut: q<SVGPathElement>('[data-cue-part="lens-out"]'),
      wind: q<SVGPathElement>('[data-cue-part="wind-route"]'),
      windStart: q<SVGCircleElement>('[data-cue-part="wind-start"]'),
      windEnd: q<SVGCircleElement>('[data-cue-part="wind-end"]'),
      regDatum: q<SVGPathElement>('[data-cue-part="reg-datum"]'),
      regGuides: q<SVGPathElement>('[data-cue-part="reg-guides"]'),
      regCross: q<SVGPathElement>('[data-cue-part="reg-cross"]'),
    };
    const iris = q<HTMLElement>('.mf-m4__navy');
    const m4 = q<HTMLElement>('#m4');
    const m4Visual = q<HTMLElement>('.mf-m4__visual');
    const m6Copy = q<HTMLElement>('.mf-m6__top .mf-head');
    const m5Mark = q<HTMLElement>('#m5 .mf-kicker__route-end');
    const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-mf-node]'));
    const m2EndRule = q<HTMLElement>('.mf-m2__end-rule');
    const m4Band = q<HTMLElement>('.mf-band--m4');
    // Read-only accents that follow an object's progress: `track:from:to` → idle | active | done.
    const synced = Array.from(root.querySelectorAll<HTMLElement>('[data-mf-sync]')).map((el) => {
      const [track, from, to] = el.dataset.mfSync!.split(':');
      return { el, track: track as TrackId, from: Number(from), to: Number(to) };
    });

    const slots = new Map<ChapterId, Slot>();
    let tracks: Partial<Record<TrackId, Track>> = {};
    let header = 0;
    let view = 1;
    let smoothed = Number.NaN;
    let frame = 0;
    let lastTime = 0;
    let cancelled = false;
    let renderer: ManifestoRenderer | null = null;
    let rendererPromise: Promise<ManifestoRenderer | null> | null = null;

    const value = (track: TrackId) => {
      const t = tracks[track];
      return t ? trackValue(t, smoothed) : 1;
    };

    function setState(id: ChapterId, state: SlotState) {
      const slot = slots.get(id);
      if (!slot || slot.state === state) return;
      slot.state = state;
      slot.el.dataset.state = state;
    }

    function measure() {
      const headerEl = document.querySelector('header');
      header = headerEl ? headerEl.getBoundingClientRect().height : 0;
      view = Math.max(1, window.innerHeight - header);
      const small = smallQuery.matches;
      // Short screens (landscape, small laptops, very short phones): figures run in normal flow.
      const short = shortQuery.matches;
      const rootTop = root.getBoundingClientRect().top;
      const marks: Partial<Record<TrackId, Mark[]>> = {};
      root.querySelectorAll<HTMLElement>('[data-mf], [data-mf-sm], [data-mf-flow]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const d = el.dataset;
        const specs = short ? (d.mfFlow ?? (small ? d.mfSm ?? d.mf : d.mf)) : small ? (d.mfSm ?? d.mf) : d.mf;
        for (const spec of parseMarkSpec(specs)) {
          (marks[spec.track] ??= []).push({ value: spec.value, at: markPosition(rect.top - rootTop, rect.height, spec, view, header), minGap: spec.gap * view });
        }
      });
      tracks = {};
      for (const [track, list] of Object.entries(marks)) tracks[track as TrackId] = buildTrack(list!);

      root.querySelectorAll<HTMLElement>('[data-mf-slot]').forEach((el) => {
        const id = el.dataset.mfSlot as ChapterId;
        const canvas = el.querySelector('canvas');
        if (!canvas) return;
        const slot = slots.get(id) ?? { el, canvas, width: 0, height: 0, insets: NO_INSETS, state: 'loading' as SlotState };
        slot.width = canvas.clientWidth;
        slot.height = canvas.clientHeight;
        slot.insets = { ...parseInsets((small && el.dataset.mfInsetsSm) || el.dataset.mfInsets) };
        slots.set(id, slot);
        if (!el.dataset.state) el.dataset.state = slot.state;
        renderer?.setSlot(id, canvas, slot.width, slot.height, slot.insets);
      });
      svg?.setAttribute('viewBox', `0 0 ${root.clientWidth} ${root.clientHeight}`);
      smoothed = Number.NaN; // a new layout is applied completely, never eased into
      invalidate();
    }

    function invalidate() {
      if (!frame && !cancelled) frame = requestAnimationFrame(tick);
    }

    function tick(now: number) {
      frame = 0;
      const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;
      const target = -root.getBoundingClientRect().top;
      smoothed = reducedMotion ? target : followScroll(smoothed, target, dt, view);
      apply();
      if (smoothed !== target) invalidate();
      else lastTime = 0;
    }

    function loadChapter(id: ChapterId) {
      const slot = slots.get(id);
      if (!slot || slot.state !== 'loading' || slot.el.dataset.requested) return;
      slot.el.dataset.requested = 'true';
      if (forceFallback) {
        setState(id, 'fallback');
        return;
      }
      rendererPromise ??= import('./createManifestoRenderer')
        .then(({ createManifestoRenderer }) => {
          if (cancelled) return null;
          renderer = createManifestoRenderer({
            mobile: smallQuery.matches,
            onContextLost: () => CHAPTERS.forEach((chapter) => setState(chapter, 'fallback')),
          });
          for (const [chapter, s] of slots) renderer.setSlot(chapter, s.canvas, s.width, s.height, s.insets);
          return renderer;
        })
        .catch((error) => {
          console.warn('[manifesto] 3D objects unavailable, using still images', error);
          return null;
        });
      rendererPromise
        .then((r) => {
          if (cancelled) return;
          if (!r) {
            setState(id, 'fallback');
            return;
          }
          return r.load(id).then(() => {
            if (cancelled) return;
            r.setSlot(id, slot.canvas, slot.width, slot.height, slot.insets);
            // Draw the current pose before revealing the canvas over the poster.
            r.render(id, reducedMotion ? 1 : value(id), reducedMotion);
            setState(id, 'ready');
            invalidate();
          });
        })
        .catch((error) => {
          console.warn(`[manifesto] ${id} object could not be loaded`, error);
          if (!cancelled) setState(id, 'fallback');
        });
    }

    /** A point inside a slot, in wrapper coordinates (projected from the object when it is live). */
    function slotPoint(id: ChapterId, anchor: string, fallback: SlotPoint, rootRect: DOMRect): SlotPoint {
      const slot = slots.get(id);
      if (!slot) return { x: 0, y: 0 };
      const rect = slot.canvas.getBoundingClientRect();
      const local = (slot.state === 'ready' && renderer?.project(id, anchor)) || { x: fallback.x * rect.width, y: fallback.y * rect.height };
      // The slot may be offset by its transition transform; the rect already includes it.
      const scale = slot.width ? rect.width / slot.width : 1;
      return { x: rect.left - rootRect.left + local.x * scale, y: rect.top - rootRect.top + local.y * scale };
    }

    function dash(path: SVGPathElement | null, drawn: number, total: number) {
      if (!path) return;
      path.style.strokeDasharray = `${Math.max(0, drawn).toFixed(1)} ${Math.max(1, total + 1).toFixed(1)}`;
      // A zero-length dash still paints its round caps as a dot.
      path.style.visibility = drawn < 0.5 ? 'hidden' : '';
    }

    function apply() {
      const rootRect = root.getBoundingClientRect();
      const vh = window.innerHeight;

      // Boundary visuals: outgoing objects lift slightly and recede; incoming ones settle in.
      const look = new Map<ChapterId, { opacity: number; offset: number }>();
      for (const id of CHAPTERS) look.set(id, { opacity: 1, offset: 0 });
      for (const boundary of BOUNDARIES) {
        const [out, inc] = NEIGHBOURS[boundary];
        const v = boundaryVisuals(boundary, value(boundary), reducedMotion);
        const a = look.get(out)!;
        const b = look.get(inc)!;
        a.opacity *= v.outgoing.opacity;
        a.offset += v.outgoing.offset;
        b.opacity *= v.incoming.opacity;
        b.offset += v.incoming.offset;
      }

      for (const id of CHAPTERS) {
        const slot = slots.get(id);
        if (!slot) continue;
        const l = look.get(id)!;
        slot.el.style.opacity = l.opacity >= 0.999 ? '' : l.opacity.toFixed(3);
        slot.el.style.transform = Math.abs(l.offset) < 1e-4 ? '' : `translate3d(0, ${(l.offset * slot.height).toFixed(1)}px, 0)`;
        const rect = slot.el.getBoundingClientRect();
        const visible = rect.bottom > -40 && rect.top < vh + 40 && l.opacity > 0.01;
        if (visible && slot.state === 'ready') renderer?.render(id, value(id), reducedMotion);
      }

      for (const item of synced) {
        const v = value(item.track);
        const state = v < item.from ? 'idle' : v < item.to ? 'active' : 'done';
        if (item.el.dataset.syncState !== state) item.el.dataset.syncState = state;
      }

      if (!svg) return;
      const wrap = q<HTMLElement>('.mf-wrap');
      const wrapRect = wrap?.getBoundingClientRect();
      const left = wrapRect ? wrapRect.left - rootRect.left : 24;
      const right = wrapRect ? wrapRect.right - rootRect.left : root.clientWidth - 24;
      const sectionTop = (id: string) => {
        const el = q<HTMLElement>(`#${id}`);
        return el ? el.getBoundingClientRect().top - rootRect.top : 0;
      };
      const show = (el: Element | null, opacity: number) => {
        if (el) (el as SVGElement).style.opacity = opacity.toFixed(3);
      };

      // M2 → M3: drawing datum.
      {
        const c = datumCue(reducedMotion ? 1 : value('M2_M3'));
        const corner = slotPoint('M2', 'datum', { x: 0.62, y: 0.82 }, rootRect);
        // The datum leaves M2's final text rule, on the folio corner's vertical.
        let start = corner;
        if (m2EndRule) {
          const r = m2EndRule.getBoundingClientRect();
          start = { x: Math.min(Math.max(corner.x, r.left - rootRect.left), r.right - rootRect.left), y: r.top - rootRect.top };
        }
        const boundary = sectionTop('m3');
        const y = boundary + (smallQuery.matches ? 28 : 40);
        const x = Math.min(Math.max(start.x, left), right);
        const drop = Math.max(0, y - start.y);
        const toRight = right - x;
        const toLeft = x - left;
        cue.datumMain?.setAttribute('d', `M${x.toFixed(1)} ${start.y.toFixed(1)}V${y.toFixed(1)}H${right.toFixed(1)}`);
        cue.datumLeft?.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}H${left.toFixed(1)}`);
        const travelled = c.line * (drop + Math.max(toRight, toLeft));
        dash(cue.datumMain, travelled, drop + toRight);
        dash(cue.datumLeft, travelled - drop, toLeft);
        cue.datumInk?.setAttribute('y1', String(boundary - 1));
        cue.datumInk?.setAttribute('y2', String(boundary + 1));
        if (cue.datums) {
          const marks = [0.14, 0.5, 0.86].map((f) => left + (right - left) * f);
          const s = 14 * c.datums;
          cue.datums.setAttribute('d', marks.map((mx) => `M${mx} ${y - s}V${y + s}M${mx - s} ${y}H${mx + s}`).join(''));
          show(cue.datums, c.datums);
        }
        if (cue.register) {
          const mx = (left + right) / 2;
          const w = 22 * c.register;
          cue.register.setAttribute('d', `M${mx - w} ${y + 26}H${mx + w}`);
          show(cue.register, c.register);
        }
      }

      // M3 → M4: lens on the boundary, iris into M4's navy.
      {
        const p = reducedMotion ? 1 : value('M3_M4');
        const c = lensCue(p);
        const lens = slotPoint('M3', 'light', { x: 0.36, y: 0.7 }, rootRect);
        const x = Math.min(Math.max(lens.x, left + 40), right - 40);
        const y = sectionTop('m4');
        const r = (smallQuery.matches ? 16 : 22) * c.ring;
        cue.lensIn?.setAttribute('d', `M${left} ${y}H${x}`);
        dash(cue.lensIn, c.incoming * Math.max(0, x - left - r), x - left);
        cue.lensOut?.setAttribute('d', `M${x} ${y}H${right}`);
        dash(cue.lensOut, c.outgoing * (right - x), right - x);
        cue.lensRing?.setAttribute('cx', String(x));
        cue.lensRing?.setAttribute('cy', String(y));
        cue.lensRing?.setAttribute('r', String(Math.max(0.01, r)));
        cue.lensCore?.setAttribute('cx', String(x));
        cue.lensCore?.setAttribute('cy', String(y));
        cue.lensCore?.setAttribute('r', String(Math.max(0.01, 5 * c.ring)));
        show(cue.lensIn, c.fade);
        show(cue.lensRing, c.ring);
        show(cue.lensCore, c.ring);
        if (iris && m4) {
          if (reducedMotion || c.iris >= 1) {
            iris.style.clipPath = '';
            if (m4Visual) m4Visual.style.clipPath = '';
          } else {
            const m4Rect = m4.getBoundingClientRect();
            const cx = x - (m4Rect.left - rootRect.left);
            const radius = c.iris * coverRadius(cx, 0, m4Rect.width, m4Rect.height);
            iris.style.clipPath = `circle(${radius.toFixed(1)}px at ${cx.toFixed(1)}px 0px)`;
            // The instrument belongs to the navy composition, so it shares the iris. Copy never does.
            if (m4Visual) {
              const v = m4Visual.getBoundingClientRect();
              m4Visual.style.clipPath = `circle(${radius.toFixed(1)}px at ${(cx - (v.left - m4Rect.left)).toFixed(1)}px ${(m4Rect.top - v.top).toFixed(1)}px)`;
            }
          }
        }
      }

      // M4 → M5: airflow line from the settled windsock to M5's first connection mark.
      {
        const c = windCue(reducedMotion ? 1 : value('M4_M5'));
        const tail = slotPoint('M4', 'tail', { x: 0.82, y: 0.2 }, rootRect);
        const inlet = slotPoint('M4', 'inlet', { x: 0.5, y: 0.16 }, rootRect);
        let end: SlotPoint = { x: left, y: sectionTop('m5') + 80 };
        if (m5Mark) {
          const r = m5Mark.getBoundingClientRect();
          end = { x: r.left + r.width / 2 - rootRect.left, y: r.top + r.height / 2 - rootRect.top };
        }
        if (cue.wind) {
          // Down the gutter beside M4's paragraph band, never across it.
          let lane: number | undefined;
          if (m4Band) {
            const band = m4Band.getBoundingClientRect();
            const bandRight = band.right - rootRect.left;
            lane = bandRight + Math.max(10, (right - bandRight) / 2);
            if (smallQuery.matches) lane = root.clientWidth - 10;
          }
          cue.wind.setAttribute('d', windRoutePath(tail, { x: tail.x - inlet.x, y: tail.y - inlet.y }, end, lane));
          const total = cue.wind.getTotalLength();
          dash(cue.wind, c.line * total, total);
          show(cue.wind, c.fade);
        }
        cue.windStart?.setAttribute('cx', String(tail.x));
        cue.windStart?.setAttribute('cy', String(tail.y));
        show(cue.windStart, c.start * c.fade);
        cue.windEnd?.setAttribute('cx', String(end.x));
        cue.windEnd?.setAttribute('cy', String(end.y));
        show(cue.windEnd, c.end * c.fade);
        const m5Top = sectionTop('m5');
        cue.windInk?.setAttribute('y1', String(m5Top - 1));
        cue.windInk?.setAttribute('y2', String(m5Top + 1));
        root.dataset.windArrived = c.end > 0.5 ? 'true' : 'false';
      }

      // M5 → M6: registration guides around the incoming signature.
      {
        const c = registrationCue(reducedMotion ? 1 : value('M5_M6'));
        const a = slotPoint('M6', 'markMin', { x: 0.25, y: 0.85 }, rootRect);
        const b = slotPoint('M6', 'markMax', { x: 0.75, y: 0.12 }, rootRect);
        const x0 = Math.min(a.x, b.x) - 18;
        const x1 = Math.max(a.x, b.x) + 18;
        const y0 = Math.min(a.y, b.y) - 18;
        const y1 = Math.max(a.y, b.y) + 18;
        const cy = (y0 + y1) / 2;
        const cx = (x0 + x1) / 2;
        if (cue.regDatum) {
          // Never run through M6's copy: the left datum starts beyond the copy column when they share a row.
          const copy = m6Copy?.getBoundingClientRect();
          const sharesRow = copy && copy.top - rootRect.top < cy && copy.bottom - rootRect.top > cy;
          const from = sharesRow && copy.right - rootRect.left < x0 ? Math.max(left, copy.right - rootRect.left + 24) : left;
          const inLeft = Math.max(0, x0 - from);
          const inRight = Math.max(0, right - x1);
          const dl = c.datum * inLeft;
          const dr = c.datum * inRight;
          cue.regDatum.setAttribute('d', `M${from} ${cy}H${from + dl}M${right} ${cy}H${right - dr}`);
          show(cue.regDatum, c.fade);
        }
        if (cue.regGuides) {
          const g = 40 * c.guides;
          cue.regGuides.setAttribute('d', `M${x0} ${y0 + g}V${y0}H${x0 + g}M${x1} ${y1 - g}V${y1}H${x1 - g}`);
          show(cue.regGuides, c.guides * c.fade);
        }
        if (cue.regCross) {
          const s = 12 * c.cross;
          cue.regCross.setAttribute('d', `M${cx - s} ${cy}H${cx + s}M${cx} ${cy - s}V${cy + s}`);
          show(cue.regCross, c.cross * c.fade);
        }
      }

      // M5 labels sit beside their nodes and appear as each node rises.
      if (labels.length) {
        const m5 = slots.get('M5');
        const live = m5?.state === 'ready' && renderer;
        for (const label of labels) {
          const node = label.dataset.mfNode!;
          const point = live ? renderer!.project('M5', node) : null;
          if (point) label.style.transform = `translate3d(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px, 0)`;
          const on = live ? renderer!.nodeScale('M5', `M5_node_${node}`) > 0.55 : false;
          label.dataset.on = on ? 'true' : 'false';
        }
      }
    }

    // Keeps the reader's place across viewport changes (rotation, window resizing). M1's pinned
    // length scales with the viewport, so everything after it moves and the browser's own scroll
    // anchoring cannot follow; the place is held as a fraction of the section in view and
    // restored after each layout event that follows a resize.
    let place: { id: string; frac: number } | null = null;
    let restoreUntil = 0;
    const SECTIONS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
    function notePlace() {
      if (performance.now() < restoreUntil) return;
      const line = header + 1;
      place = null;
      for (const id of SECTIONS) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.bottom > line) {
          place = { id, frac: Math.max(0, (line - rect.top) / Math.max(1, rect.height)) };
          return;
        }
      }
    }
    function restorePlace() {
      if (!place || performance.now() > restoreUntil) return;
      const rect = document.getElementById(place.id)?.getBoundingClientRect();
      if (!rect) return;
      const y = window.scrollY + rect.top + place.frac * rect.height - (header + 1);
      if (Math.abs(y - window.scrollY) > 1) window.scrollTo(0, y);
    }

    const onScroll = () => {
      notePlace();
      invalidate();
    };
    const onResize = () => {
      // The layout has already changed here: restore the place noted at the last scroll.
      restoreUntil = performance.now() + 1200;
      measure();
      restorePlace();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(() => {
      measure();
      restorePlace();
    });
    resizeObserver.observe(root);

    // Objects load as their chapter approaches; a direct visit loads only what is near.
    const loadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadChapter((entry.target as HTMLElement).dataset.mfSlot as ChapterId);
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );

    // Fresh entry with a fragment (e.g. /#m5): the chapters exist only after React renders and
    // M1's pin spacer is inserted, so honour the anchor again until the reader moves.
    const hash = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
    const anchor = hash ? document.getElementById(hash) : null;
    let anchoredAt = -1;
    const toAnchor = () => {
      if (!anchor || !root.contains(anchor)) return;
      if (anchoredAt >= 0 && Math.abs(window.scrollY - anchoredAt) > 2) return;
      anchor.scrollIntoView({ block: 'start' });
      anchoredAt = window.scrollY;
    };
    const onRefresh = () => {
      toAnchor();
      restorePlace();
      invalidate();
    };
    ScrollTrigger.addEventListener('refresh', onRefresh);

    measure();
    notePlace();
    root.querySelectorAll<HTMLElement>('[data-mf-slot]').forEach((el) => loadObserver.observe(el));
    toAnchor();
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      measure();
      toAnchor();
    });

    if (import.meta.env.DEV) {
      // Development inspection only.
      (window as unknown as { __manifesto?: unknown }).__manifesto = {
        tracks: () => tracks,
        value: (track: TrackId) => value(track),
        /** Absolute scrollY at which a track reaches `v`. */
        scrollFor: (track: TrackId, v: number) => {
          const t = tracks[track];
          return t ? trackPosition(t, v) + root.getBoundingClientRect().top + window.scrollY : null;
        },
        renderer: () => renderer?.info(),
        states: () => Object.fromEntries([...slots].map(([id, s]) => [id, s.state])),
      };
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      resizeObserver.disconnect();
      loadObserver.disconnect();
      renderer?.dispose();
      renderer = null;
      rendererPromise?.then((r) => r?.dispose());
      if (import.meta.env.DEV) delete (window as unknown as { __manifesto?: unknown }).__manifesto;
    };
  }, [rootRef]);
}
