/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M3: Project Lifecycle 3D Section
 * "Scegli un approccio integrato."
 * In-place 3D evolution across Analisi, Progetto, Realizzazione and Gestione.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { CheckCircle2, Compass, PenTool, Wrench, Activity } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MANIFESTO_SECTIONS, M3_PROJECT_PHASES } from '../config/manifestoContent';
import { computeLifecycleState, LIFECYCLE_PHASES } from '../utils/projectLifecyclePose';
import type { createProjectLifecycleStage } from '../three/createProjectLifecycleStage';

gsap.registerPlugin(ScrollTrigger);

const PHASE_ICONS = [Compass, PenTool, Wrench, Activity];

export const ProjectLifecycleSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const phaseNumberRef = useRef<HTMLSpanElement>(null);
  const phaseTitleRef = useRef<HTMLHeadingElement>(null);
  const phaseDescRef = useRef<HTMLParagraphElement>(null);

  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const m3 = MANIFESTO_SECTIONS[2];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!section || !pin || !canvasContainer) return;

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
        let stage: ReturnType<typeof createProjectLifecycleStage> | undefined;
        let tween: gsap.core.Tween | undefined;
        let refreshId = 0;
        const driver = { progress: reduced ? 0.85 : 0 };

        const updateState = () => {
          const state = computeLifecycleState(driver.progress);
          stage?.setProgress(driver.progress);

          setActivePhaseIndex(state.activePhaseIndex);

          if (hudRef.current) {
            hudRef.current.style.opacity = String(state.hudOpacity);
          }

          const currentPhase = M3_PROJECT_PHASES[state.activePhaseIndex];
          if (currentPhase) {
            if (phaseNumberRef.current) {
              phaseNumberRef.current.textContent = `FASE ${currentPhase.number} // ${state.phaseName.toUpperCase()}`;
            }
            if (phaseTitleRef.current) {
              phaseTitleRef.current.textContent = currentPhase.title;
            }
            if (phaseDescRef.current) {
              phaseDescRef.current.textContent = currentPhase.description;
            }
          }

          section.dataset.m3Progress = driver.progress.toFixed(3);
          section.dataset.m3Phase = state.phaseName;
        };

        import('../three/createProjectLifecycleStage')
          .then(({ createProjectLifecycleStage }) => {
            if (!active) return;
            stage = createProjectLifecycleStage(canvasContainer, {
              mobile,
              reducedMotion: reduced,
              onReady: () => {
                if (!active) return;
                setIsReady(true);
                updateState();
                refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());
              },
              onError: (err, fatal) => {
                console.warn('Project lifecycle stage notice:', err, fatal);
              },
            });
            updateState();
          })
          .catch((err) => {
            console.warn('Could not initialize project lifecycle stage:', err);
          });

        if (!reduced) {
          const scrollDistance = pin.clientHeight * (mobile ? 1.5 : 2.2);

          tween = gsap.to(driver, {
            progress: 1,
            ease: 'none',
            onUpdate: updateState,
            scrollTrigger: {
              id: 'manifesto-m3-lifecycle',
              trigger: pin,
              pin,
              pinSpacing: true,
              start: () =>
                `top top+=${
                  parseFloat(
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--site-header-height'
                    )
                  ) || 81
                }`,
              end: () => `+=${scrollDistance}`,
              scrub: 0.3,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        updateState();

        return () => {
          active = false;
          cancelAnimationFrame(refreshId);
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
      id="m3"
      className="w-full bg-white text-[#081C33] relative border-b border-[#081C33]/10"
      aria-labelledby="m3-heading"
    >
      {/* Part A: Introductory Section in normal document flow */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-24 sm:pt-32 pb-14 space-y-8">
        <div className="max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
            {m3.kicker}
          </div>
          <h2
            id="m3-heading"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]"
          >
            {m3.title}
          </h2>
          <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
            {m3.subtitle}
          </p>

          <div className="space-y-4 pt-2 text-base sm:text-lg text-[#081C33]/85 leading-relaxed font-sans">
            <p>{m3.body[0]}</p>
            <p>{m3.body[1]}</p>
          </div>
        </div>
      </div>

      {/* Part B: Pinned 3D Site Lifecycle Stage */}
      <div
        ref={pinRef}
        className="relative w-full h-[85vh] min-h-[580px] max-h-[880px] bg-[#F5F6F7] border-y border-[#081C33]/10 overflow-hidden flex flex-col justify-between"
      >
        {/* Full-width 3D Canvas container */}
        <div
          ref={canvasContainerRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />

        {/* Top Header Overlay: 4 Phase Chapters Progress Bar */}
        <div className="relative z-10 p-6 sm:p-10 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="bg-white/90 backdrop-blur-sm border border-[#081C33]/15 px-3.5 py-2 shadow-sm">
            <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[#0B4584] font-bold">
              EVOLUZIONE IN SITO // APPROCCIO INTEGRATO
            </span>
          </div>

          {/* Explicit 4 Phase Chapters Pills */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-[#081C33]/15 p-1 shadow-sm">
            {LIFECYCLE_PHASES.map((phase, idx) => {
              const isCurrent = idx === activePhaseIndex;
              return (
                <div
                  key={phase.id}
                  className={`px-3 py-1.5 text-xs font-mono-tech tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-[#0B4584] text-white font-bold'
                      : 'text-[#081C33]/60'
                  }`}
                >
                  <span>0{idx + 1}</span>
                  <span className="hidden sm:inline">{phase.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Active Phase Card (Bottom Left, in clear negative space) */}
        <div
          ref={hudRef}
          className="relative z-10 p-6 sm:p-10 pointer-events-none transition-opacity duration-300 max-w-lg"
        >
          <div className="bg-white/95 backdrop-blur-md p-6 border-l-4 border-[#0B4584] border-y border-r border-[#081C33]/15 shadow-xl space-y-3 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span
                ref={phaseNumberRef}
                className="text-xs font-mono-tech uppercase tracking-widest text-[#E31E24] font-bold"
              >
                FASE 01 // ANALISI
              </span>
              <span className="text-[10px] font-mono-tech text-[#081C33]/50">
                PROCESSO CONTINUATIVO
              </span>
            </div>

            <h3
              ref={phaseTitleRef}
              className="font-display font-bold text-2xl sm:text-3xl text-[#081C33]"
            >
              Analisi
            </h3>

            <p
              ref={phaseDescRef}
              className="text-sm text-[#081C33]/80 leading-relaxed font-sans"
            >
              Studio di fattibilità tecnico-aeronautica e valutazione del contesto territoriale.
            </p>

            {/* Stepper bar */}
            <div className="pt-3 border-t border-[#081C33]/10 flex items-center gap-1.5">
              {LIFECYCLE_PHASES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 transition-all duration-300 ${
                    idx === activePhaseIndex
                      ? 'bg-[#0B4584]'
                      : idx < activePhaseIndex
                      ? 'bg-[#0B4584]/40'
                      : 'bg-[#081C33]/15'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Vertical progression indicator on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 z-10">
          <div className="text-[9px] font-mono-tech text-[#081C33]/40 [writing-mode:vertical-lr] tracking-widest uppercase">
            CICLO DI VITA INFRASTRUTTURALE
          </div>
          <div className="w-1 h-24 bg-[#081C33]/10 relative rounded-full overflow-hidden">
            <div
              className="w-full bg-[#0B4584] transition-all duration-150"
              style={{ height: `${((activePhaseIndex + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Part C: Four-Step HTML Breakdown in normal document flow below the scene */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-bold">
            IL METODO INTEGRATO
          </span>
          <h3 className="font-display font-bold text-2xl sm:text-4xl text-[#081C33]">
            Le 4 fasi operative del ciclo di vita
          </h3>
          <p className="text-base text-[#081C33]/75 font-sans">
            Ogni fase prepara e protegge la successiva, garantendo coerenza ingegneristica e sostenibilità operativa sul lungo termine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {M3_PROJECT_PHASES.map((phase, idx) => {
            const Icon = PHASE_ICONS[idx] ?? Compass;
            return (
              <div
                key={phase.number}
                className="p-6 bg-[#F5F6F7] border-t-4 border-[#0B4584] border-x border-b border-[#081C33]/10 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-xs uppercase tracking-widest text-[#0B4584] font-bold">
                      FASE {phase.number}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white border border-[#081C33]/10 flex items-center justify-center text-[#0B4584]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-xl text-[#081C33] mb-1">
                      {phase.title}
                    </h4>
                    <p className="text-xs text-[#081C33]/75 font-sans leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-3 border-t border-[#081C33]/10 text-xs text-[#081C33]/70">
                    {phase.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B4584] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[10px] font-mono-tech text-[#0B4584]/60 pt-2 border-t border-[#081C33]/10">
                  METODO INTEGRATO // 0{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
