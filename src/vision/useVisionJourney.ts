/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Connects native document scrolling to the page-two world. Chapter
 * boundaries are measured from the real HTML after layout and fonts settle;
 * the journey position is derived from absolute scroll, never from callbacks.
 */

import { useEffect, useState, type RefObject } from 'react';
import {
  chapterAt,
  resolveMarks,
  scrollToJourney,
  stillJourney,
  type JourneyMark,
} from '../utils/visionJourney';
import type { VisionWorld } from './createVisionWorld';

export type WorldStatus = 'loading' | 'ready' | 'fallback';

export function useVisionJourney(rootRef: RefObject<HTMLElement | null>, hostRef: RefObject<HTMLElement | null>) {
  const [status, setStatus] = useState<WorldStatus>('loading');

  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    if (!root || !host) return;
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Development-only override so the still compositions can be inspected without OS settings.
      (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'));
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    let world: VisionWorld | null = null;
    let cancelled = false;
    let marks: JourneyMark[] = [];

    const measure = () => {
      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const view = window.innerHeight - headerHeight;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      marks = resolveMarks(
        Array.from(root.querySelectorAll<HTMLElement>('[data-journey-mark]')).map((el) => ({
          s: Number(el.dataset.journeyMark),
          scroll: el.getBoundingClientRect().top + window.scrollY - headerHeight - Number(el.dataset.journeyLine ?? 0) * view,
          minGap: el.dataset.journeyMin ? Number(el.dataset.journeyMin) : undefined,
        })),
        view,
        maxScroll,
      );
    };

    const update = (immediate = false) => {
      const s = scrollToJourney(window.scrollY, marks);
      root.dataset.chapter = String(chapterAt(s) + 1);
      world?.setJourney(reducedMotion ? stillJourney(s) : s, immediate || reducedMotion);
    };

    if (import.meta.env.DEV) {
      // Development inspection only: scroll to the document position of a journey value.
      (window as unknown as { __visionJourney?: unknown }).__visionJourney = {
        marks: () => marks,
        scrollFor: (s: number) => {
          const i = marks.findIndex((m) => m.s >= s);
          if (i <= 0) return marks[0]?.scroll ?? 0;
          const a = marks[i - 1];
          const b = marks[i];
          return a.scroll + ((s - a.s) / (b.s - a.s)) * (b.scroll - a.scroll);
        },
      };
    }

    const onScroll = () => update();
    const onLayout = () => {
      measure();
      update(true);
    };
    // Direct entry with a fragment (e.g. /vision-mission-valori#v6): the sections are rendered by
    // React after the browser's own fragment scroll, so honour the anchor once they exist — and
    // once more after fonts settle, unless the reader has already moved.
    const anchor = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
    let anchoredAt = -1;
    const toAnchor = () => {
      if (!anchor || !root.contains(anchor)) return;
      if (anchoredAt >= 0 && Math.abs(window.scrollY - anchoredAt) > 2) return;
      anchor.scrollIntoView({ block: 'start' });
      anchoredAt = window.scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onLayout);
    const resizeObserver = new ResizeObserver(onLayout);
    resizeObserver.observe(root);
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      toAnchor();
      onLayout();
    });
    toAnchor();
    onLayout();

    // Development-only switch to inspect the static fallback compositions.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('fallback')) {
      setStatus('fallback');
      return () => {
        cancelled = true;
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onLayout);
        resizeObserver.disconnect();
      };
    }

    import('./createVisionWorld')
      .then(({ createVisionWorld }) => {
        if (cancelled) return;
        try {
          world = createVisionWorld(host, {
            mobile,
            onReady: () => !cancelled && setStatus('ready'),
            onError: (error, fatal) => {
              console.warn('[vision] world asset issue', error);
              if (fatal && !cancelled) setStatus('fallback');
            },
          });
          onLayout();
        } catch (error) {
          console.warn('[vision] WebGL unavailable, using static compositions', error);
          setStatus('fallback');
        }
      })
      .catch(() => !cancelled && setStatus('fallback'));

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onLayout);
      resizeObserver.disconnect();
      world?.dispose();
      world = null;
    };
  }, [rootRef, hostRef]);

  return status;
}
