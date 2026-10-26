/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Short text entrances for Manifesto M2–M6.
 *
 * Text is complete and visible by default. Only groups that are still below
 * the view when this runs are set to their entry state, and each plays once
 * as it reaches the reading area, then every inline transform is cleared so
 * the settled text is flat and crisp. Groups reached by a jump (anchor link,
 * restored history) appear at once. Reduced motion skips all of it.
 *
 * Markup: a `[data-reveal-group]` holds `[data-reveal="kind"]` items, played
 * at `data-reveal-at` seconds into the group's timeline.
 */

import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';

type Kind = 'lines' | 'words' | 'plane' | 'block' | 'block-x' | 'rule' | 'connect' | 'register' | 'rise';

const CLEAR = 'transform,opacity,visibility';
/** Reveal when the group's top passes this share of the viewport. */
const ENTRY = 0.88;

function words(el: HTMLElement) {
  return Array.from(el.querySelectorAll<HTMLElement>('.mf-w__i'));
}

/** Groups split words into their rendered lines (after fonts and at the current width). */
function lines(el: HTMLElement) {
  const groups: HTMLElement[][] = [];
  let lastTop = Number.NaN;
  for (const inner of words(el)) {
    const top = Math.round((inner.parentElement as HTMLElement).offsetTop);
    if (!groups.length || Math.abs(top - lastTop) > 4) groups.push([]);
    groups[groups.length - 1].push(inner);
    lastTop = top;
  }
  return groups;
}

function parts(el: HTMLElement, selector: string) {
  return Array.from(el.querySelectorAll<HTMLElement>(selector));
}

/** Entry state per kind. Only transforms and opacity: nothing reflows while text moves. */
function hide(el: HTMLElement) {
  const kind = el.dataset.reveal as Kind;
  switch (kind) {
    case 'lines':
      el.classList.add('is-masked');
      gsap.set(words(el), { yPercent: 118, rotationX: Number(el.dataset.revealTilt ?? 6), opacity: 0, transformPerspective: 1000, transformOrigin: '50% 100%' });
      break;
    case 'words':
      gsap.set(words(el), { x: -22, rotationY: -12, opacity: 0, transformPerspective: 1100, transformOrigin: '0% 50%' });
      break;
    case 'plane':
      gsap.set(el, { y: 18, rotationX: 9, opacity: 0, transformPerspective: 1100, transformOrigin: '50% 100%' });
      break;
    case 'block':
      gsap.set(el, { y: 14, opacity: 0 });
      break;
    case 'rise':
      gsap.set(el, { y: 12, rotationX: 6, opacity: 0, transformPerspective: 1000, transformOrigin: '50% 100%' });
      break;
    case 'block-x':
      gsap.set(el, { x: -18, opacity: 0 });
      break;
    case 'rule':
      gsap.set(el, { scaleX: 0, transformOrigin: el.dataset.revealOrigin ?? '0% 50%' });
      break;
    case 'connect':
      gsap.set(parts(el, '.mf-connect__dot'), { scale: 0 });
      gsap.set(parts(el, '.mf-connect__line'), { scaleX: 0, transformOrigin: '0% 50%' });
      break;
    case 'register':
      gsap.set(parts(el, '.mf-register__red'), { x: -40, opacity: 0 });
      gsap.set(parts(el, '.mf-register__blue'), { x: 40, opacity: 0 });
      break;
  }
}

function targets(el: HTMLElement): HTMLElement[] {
  switch (el.dataset.reveal as Kind) {
    case 'lines':
    case 'words':
      return words(el);
    case 'connect':
      return parts(el, '.mf-connect__dot, .mf-connect__line');
    case 'register':
      return parts(el, '.mf-register__red, .mf-register__blue');
    default:
      return [el];
  }
}

function play(el: HTMLElement, tl: gsap.core.Timeline, at: number) {
  switch (el.dataset.reveal as Kind) {
    case 'lines':
      // Line by line through a mask, with a shallow tilt that registers onto the baseline.
      lines(el).forEach((line, i) => {
        tl.to(line, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.62, ease: 'power3.out' }, at + i * 0.07);
      });
      break;
    case 'words': {
      // Short word groups travel one way, like air along the sock, and stop.
      const list = words(el);
      for (let i = 0; i < list.length; i += 2) {
        tl.to(list.slice(i, i + 2), { x: 0, rotationY: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, at + (i / 2) * 0.06);
      }
      break;
    }
    case 'plane':
      tl.to(el, { y: 0, rotationX: 0, opacity: 1, duration: 0.66, ease: 'power3.out' }, at);
      break;
    case 'block':
      tl.to(el, { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, at);
      break;
    case 'rise':
      tl.to(el, { y: 0, rotationX: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, at);
      break;
    case 'block-x':
      tl.to(el, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, at);
      break;
    case 'rule':
      tl.to(el, { scaleX: 1, duration: Number(el.dataset.revealDuration ?? 0.5), ease: 'power2.inOut' }, at);
      break;
    case 'connect': {
      const [a, b] = parts(el, '.mf-connect__dot');
      tl.to(a, { scale: 1, duration: 0.18, ease: 'back.out(2)' }, at)
        .to(parts(el, '.mf-connect__line'), { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, at + 0.1)
        .to(b, { scale: 1, duration: 0.18, ease: 'back.out(2)' }, at + 0.5);
      break;
    }
    case 'register':
      tl.to(parts(el, '.mf-register__red, .mf-register__blue'), { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, at);
      break;
  }
}

export function useManifestoReveals(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;
    const root: HTMLElement = host;
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'));
    if (reducedMotion) return;

    const ctx = gsap.context(() => undefined, root);
    const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-group]'));
    const itemsOf = (group: HTMLElement) =>
      Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]')).filter((el) => el.closest('[data-reveal-group]') === group);

    // A large scroll step between two events is a jump: whatever it lands on is shown at once.
    let lastY = window.scrollY;
    let jumpedAt = -Infinity;
    let sweep = 0;
    const onScroll = () => {
      if (Math.abs(window.scrollY - lastY) > 1.2 * window.innerHeight) jumpedAt = performance.now();
      lastY = window.scrollY;
      if (!sweep) sweep = requestAnimationFrame(settleSkipped);
    };
    // A jump can carry a group from below the view to above it without the observer ever
    // seeing it intersect; such a group is shown at once rather than left waiting.
    function settleSkipped() {
      sweep = 0;
      for (const group of groups) {
        if (group.dataset.revealState === 'pending' && group.getBoundingClientRect().bottom < 0) {
          observer.unobserve(group);
          reveal(group, true);
        }
      }
    }

    function settle(group: HTMLElement) {
      const items = itemsOf(group);
      gsap.set(items.flatMap(targets), { clearProps: CLEAR });
      for (const el of items) el.classList.remove('is-masked');
      group.dataset.revealState = 'done';
    }

    function reveal(group: HTMLElement, instant: boolean) {
      if (group.dataset.revealState !== 'pending') return;
      group.dataset.revealState = 'playing';
      if (instant) {
        settle(group);
        return;
      }
      ctx.add(() => {
        const tl = gsap.timeline({ onComplete: () => settle(group) });
        itemsOf(group).forEach((el, i) => play(el, tl, Number(el.dataset.revealAt ?? i * 0.08)));
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;
          const group = entry.target as HTMLElement;
          observer.unobserve(group);
          const jumped = performance.now() - jumpedAt < 400 || entry.boundingClientRect.bottom < 0;
          reveal(group, jumped);
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - ENTRY) * 100)}% 0px` },
    );

    ctx.add(() => {
      for (const group of groups) {
        // Already in view or above (direct entry, restored position): leave it as it is.
        if (group.getBoundingClientRect().top < window.innerHeight * ENTRY) {
          group.dataset.revealState = 'done';
          continue;
        }
        group.dataset.revealState = 'pending';
        for (const el of itemsOf(group)) hide(el);
        observer.observe(group);
      }
    });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(sweep);
      observer.disconnect();
      ctx.revert();
      for (const group of groups) {
        delete group.dataset.revealState;
        for (const el of itemsOf(group)) el.classList.remove('is-masked');
      }
    };
  }, [rootRef]);
}
