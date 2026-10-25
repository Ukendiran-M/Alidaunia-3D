/** ALIDAUNIA SERVICES — AW139 scroll assembly hero. See ASSET_CREDITS.md. */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRAND_ASSETS, HERO_ASSETS } from '../config/assets';
import { computeAssemblyState } from '../utils/helicopterPose';
import type { createAw139Stage } from '../three/createAw139Stage';

gsap.registerPlugin(ScrollTrigger);

const goToChapter = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  event.preventDefault();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapter = document.getElementById(id);
  if (!chapter) return;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 81;
  window.scrollTo({ top: window.scrollY + chapter.getBoundingClientRect().top - header - 20, behavior: reduced ? 'auto' : 'smooth' });
};

export const HelicopterAssemblyHero: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    const heading = headingRef.current;
    if (!section || !pin || !canvas || !heading) return;

    const media = gsap.matchMedia();
    media.add({
      mobile: '(max-width: 767px)',
      desktop: '(min-width: 768px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const { mobile, reduced } = context.conditions as Record<string, boolean>;
      let active = true;
      let stage: ReturnType<typeof createAw139Stage> | undefined;
      let tween: gsap.core.Tween | undefined;
      let refreshFrame = 0;
      const driver = { progress: 0 };
      setStatus('loading');

      const update = () => {
        const state = computeAssemblyState(driver.progress);
        stage?.setProgress(driver.progress);
        heading.style.opacity = String(state.headingOpacity);
        heading.style.transform = `translateY(${-18 * (1 - state.headingOpacity)}px)`;
        heading.style.pointerEvents = state.headingOpacity > 0.1 ? 'auto' : 'none';
        heading.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
          link.tabIndex = state.headingOpacity > 0.1 ? 0 : -1;
        });
        progressRef.current?.style.setProperty('--hero-progress', String(driver.progress));
        section.dataset.progress = driver.progress.toFixed(4);
        section.dataset.phase = state.stageName;
      };

      const releasePin = () => {
        tween?.scrollTrigger?.kill(true);
        tween?.kill();
        tween = undefined;
        delete section.dataset.scrollStart;
        delete section.dataset.scrollEnd;
      };

      const showFallback = (error: unknown) => {
        if (!active) return;
        console.warn('The opening scene could not be displayed.', error);
        releasePin();
        stage?.dispose();
        stage = undefined;
        driver.progress = 0;
        update();
        setStatus('fallback');
        refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
      };

      try {
        import('../three/createAw139Stage').then(({ createAw139Stage }) => {
          if (!active) return;
          stage = createAw139Stage(canvas, {
          mobile,
          reducedMotion: reduced,
          modelUrl: HERO_ASSETS.model,
          environmentUrl: mobile ? HERO_ASSETS.mobileEnvironment : HERO_ASSETS.environment,
          onReady: () => {
            if (!active) return;
            setStatus('ready');
            update();
            refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
          },
          onError: (error, fatal) => {
            if (fatal) showFallback(error);
            else console.warn('The studio lighting could not be loaded; using scene lights.', error);
          },
          });
          update();
        }).catch(showFallback);

        if (!reduced) {
          tween = gsap.to(driver, {
            progress: 1,
            ease: 'none',
            onUpdate: update,
            scrollTrigger: {
              id: 'manifesto-aw139',
              trigger: section,
              pin,
              pinSpacing: true,
              start: () => `top top+=${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')) || 81}`,
              end: () => `+=${pin.clientHeight * (mobile ? 2.4 : 3.5)}`,
              scrub: 0.35,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: (self) => {
                section.dataset.scrollStart = String(self.start);
                section.dataset.scrollEnd = String(self.end);
              },
            },
          });
        }
      } catch (error) {
        showFallback(error);
      }
      update();

      return () => {
        active = false;
        cancelAnimationFrame(refreshFrame);
        releasePin();
        stage?.dispose();
        heading.style.opacity = '';
        heading.style.transform = '';
        heading.style.pointerEvents = '';
        heading.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
      };
    }, section);

    return () => media.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="m1"
      className="aw139-hero"
      aria-labelledby="manifesto-title"
      data-hero-status={status}
    >
      <div ref={pinRef} className="aw139-hero__stage">
        <div ref={canvasRef} className="aw139-hero__canvas" aria-hidden="true" />

        {status === 'fallback' && (
          <img className="aw139-hero__fallback" src={BRAND_ASSETS.manifestoStill.url} alt="Elicottero su una piattaforma di atterraggio" />
        )}

        <div className="aw139-hero__shade" aria-hidden="true" />
        <div ref={headingRef} className="aw139-hero__copy">
          <span className="aw139-hero__eyebrow font-mono-tech">
            <span aria-hidden="true" /> MANIFESTO
          </span>
          <h1 id="manifesto-title" className="font-display">Prima del volo,<br />c’è un progetto.</h1>
          <p>Soluzioni complete e personalizzate per eliporti, elisuperfici e vertiporti, dal progetto alla gestione.</p>
          <a href="#m3" onClick={(event) => goToChapter(event, 'm3')} className="aw139-hero__approach font-mono-tech">
            Il nostro approccio <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>

        <div className="aw139-hero__bottom">
          <a href="#m2" onClick={(event) => goToChapter(event, 'm2')} className="aw139-hero__scroll font-mono-tech">
            <span>Scorri per esplorare</span><ArrowDown size={16} aria-hidden="true" />
          </a>
          <span className="aw139-hero__sectors font-mono-tech">ELIPORTI · ELISUPERFICI · VERTIPORTI</span>
        </div>
        <div ref={progressRef} className="aw139-hero__progress" aria-hidden="true"><span /></div>

        <p className="aw139-hero__status font-mono-tech" role="status" aria-live="polite">
          {status === 'loading' ? 'Preparazione della scena…' : status === 'fallback' ? 'Puoi continuare a esplorare la pagina.' : ''}
        </p>
      </div>
    </section>
  );
};
