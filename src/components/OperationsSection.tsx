/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M4: Operations Section
 * "Affidati all'esperienza."
 * Full-width navy composition with one large operations photograph,
 * spacious typography, and a shallow 3D architectural reveal where two solid
 * bevelled panels part along the horizontal axis to expose the operations photo.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MANIFESTO_SECTIONS } from '../config/manifestoContent';
import { BRAND_ASSETS } from '../config/assets';
import { computeOperationsRevealState } from '../utils/operationsRevealPose';
import type { createOperationsRevealStage } from '../three/createOperationsRevealStage';

gsap.registerPlugin(ScrollTrigger);

export const OperationsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const fallbackImgRef = useRef<HTMLDivElement>(null);

  const [is3DReady, setIs3DReady] = useState(false);
  const [has3DError, setHas3DError] = useState(false);

  const m4 = MANIFESTO_SECTIONS[3];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stageContainer = stageContainerRef.current;
    if (!section || !stageContainer) return;

    const media = gsap.matchMedia();

    media.add(
      {
        desktop: '(min-width: 768px)',
        mobile: '(max-width: 767px)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { mobile, reduced } = context.conditions as Record<string, boolean>;
        let active = true;
        let stage: ReturnType<typeof createOperationsRevealStage> | undefined;
        let tween: gsap.core.Tween | undefined;
        const driver = { progress: reduced ? 1.0 : 0 };

        const updateState = () => {
          stage?.setProgress(driver.progress);
          section.dataset.m4Progress = driver.progress.toFixed(3);
        };

        import('../three/createOperationsRevealStage')
          .then(({ createOperationsRevealStage }) => {
            if (!active) return;
            stage = createOperationsRevealStage(stageContainer, {
              imageUrl: BRAND_ASSETS.operationsReference.url,
              mobile,
              reducedMotion: reduced,
              onReady: () => {
                if (!active) return;
                setIs3DReady(true);
                updateState();
              },
              onError: (err, fatal) => {
                console.warn('Operations 3D stage fallback notice:', err);
                if (fatal) setHas3DError(true);
              },
            });
            updateState();
          })
          .catch((err) => {
            console.warn('Could not initialize operations 3D reveal stage:', err);
            setHas3DError(true);
          });

        if (!reduced) {
          // Controlled shallow reveal across entry scroll
          tween = gsap.to(driver, {
            progress: 1.0,
            ease: 'none',
            onUpdate: updateState,
            scrollTrigger: {
              id: 'manifesto-m4-operations',
              trigger: section,
              start: 'top 75%',
              end: 'top 15%',
              scrub: 0.25,
              invalidateOnRefresh: true,
            },
          });
        } else {
          updateState();
        }

        return () => {
          active = false;
          tween?.scrollTrigger?.kill(true);
          tween?.kill();
          stage?.dispose();
        };
      },
      section
    );

    return () => media.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="m4"
      className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#081C33] text-white relative overflow-hidden border-b border-white/10"
      aria-labelledby="m4-heading"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Title Block in normal document flow */}
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#F5F6F7]/70 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
            {m4.kicker}
          </div>
          <h2
            id="m4-heading"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08]"
          >
            {m4.title}
          </h2>
          <p className="text-xl sm:text-2xl text-white/90 font-light leading-relaxed">
            {m4.subtitle}
          </p>
        </div>

        {/* 3D Architectural Frame Stage / Photograph Aperture */}
        <div className="w-full max-w-6xl mx-auto relative">
          <div className="relative w-full aspect-[2.11/1] min-h-[260px] sm:min-h-[420px] max-h-[620px] bg-[#051324] border border-white/20 shadow-2xl overflow-hidden">
            {/* 3D WebGL Canvas Container */}
            <div
              ref={stageContainerRef}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                is3DReady && !has3DError ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />

            {/* Static HTML Photograph Fallback (Always rendered beneath / as fallback) */}
            {(!is3DReady || has3DError) && (
              <div ref={fallbackImgRef} className="absolute inset-0 w-full h-full">
                <img
                  src={BRAND_ASSETS.operationsReference.url}
                  alt={BRAND_ASSETS.operationsReference.alt}
                  className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05]"
                  loading="lazy"
                />
              </div>
            )}

            {/* Subtle gradient scrim & technical caption in negative space */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 sm:p-6 bg-gradient-to-t from-[#081C33]/90 via-transparent to-transparent flex items-center justify-between z-10">
              <div className="text-[11px] font-mono-tech text-white/80 bg-[#081C33]/85 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                OPERAZIONI AERONAUTICHE DI TERRA // COORDINAMENTO SUL CAMPO
              </div>
              <div className="hidden sm:block text-[10px] font-mono-tech text-white/50 bg-[#081C33]/60 px-2.5 py-1">
                EVIDENZA OPERATIVA CONTINUA
              </div>
            </div>
          </div>
        </div>

        {/* Both Body Paragraphs in Spacious Normal Document Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-base sm:text-lg text-white/80 leading-relaxed font-sans pt-4">
          <p>{m4.body[0]}</p>
          <p>{m4.body[1]}</p>
        </div>
      </div>
    </section>
  );
};
