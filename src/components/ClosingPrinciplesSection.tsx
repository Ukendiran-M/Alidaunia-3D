/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M6: Closing Principles Section
 * "I principi che guidano ogni progetto."
 * Sits quietly on a spacious off-white architectural background.
 * Reuses the finished 3D heliport model at a quiet, smaller architectural scale
 * with a single gentle camera move that settles into a balanced 3/4 view during entry,
 * stopping completely while the editorial three-part principles and actions remain accessible.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MANIFESTO_SECTIONS } from '../config/manifestoContent';
import { EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import { ArrowRight, ArrowUpRight, ShieldCheck, Ruler, Clock } from 'lucide-react';
import type { createClosingHeliportStage } from '../three/createClosingHeliportStage';

gsap.registerPlugin(ScrollTrigger);

interface ClosingPrinciplesSectionProps {
  onNavigate?: (route: typeof ROUTES.VISION) => void;
}

const PRINCIPLES = [
  {
    number: 'PRINCIPIO 01',
    title: 'Sicurezza Senza Compromessi',
    description:
      'Priorità all\'analisi attenta degli spazi operativi, alla regolarità dei flussi e all\'efficienza dei presidi di sicurezza a terra.',
    accentColor: '#0B4584',
    icon: ShieldCheck,
  },
  {
    number: 'PRINCIPIO 02',
    title: 'Rigore Progettuale & Precisione',
    description:
      'Metodo ingegneristico accurato, dai primi rilievi geometrici fino al collaudo operativo e all\'avvio in esercizio.',
    accentColor: '#E31E24',
    icon: Ruler,
  },
  {
    number: 'PRINCIPIO 03',
    title: 'Continuità del Servizio',
    description:
      'Accompagnamento costante degli approdi attraverso protocolli di manutenzione e coordinamento operativo di terra.',
    accentColor: '#081C33',
    icon: Clock,
  },
];

export const ClosingPrinciplesSection: React.FC<ClosingPrinciplesSectionProps> = ({
  onNavigate,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [is3DReady, setIs3DReady] = useState(false);
  const [has3DError, setHas3DError] = useState(false);

  const m6 = MANIFESTO_SECTIONS[5];

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
        let stage: ReturnType<typeof createClosingHeliportStage> | undefined;
        let tween: gsap.core.Tween | undefined;
        const driver = { progress: reduced ? 1.0 : 0 };

        const updateState = () => {
          stage?.setProgress(driver.progress);
          section.dataset.m6Progress = driver.progress.toFixed(3);
        };

        import('../three/createClosingHeliportStage')
          .then(({ createClosingHeliportStage }) => {
            if (!active) return;
            stage = createClosingHeliportStage(stageContainer, {
              mobile,
              reducedMotion: reduced,
              onReady: () => {
                if (!active) return;
                setIs3DReady(true);
                updateState();
              },
              onError: (err, fatal) => {
                console.warn('Closing heliport stage notice:', err);
                if (fatal) setHas3DError(true);
              },
            });
            updateState();
          })
          .catch((err) => {
            console.warn('Could not initialize closing heliport stage:', err);
            setHas3DError(true);
          });

        if (!reduced) {
          // Gentle entry settle across entry scroll (no pin)
          tween = gsap.to(driver, {
            progress: 1.0,
            ease: 'none',
            onUpdate: updateState,
            scrollTrigger: {
              id: 'manifesto-m6-principles',
              trigger: section,
              start: 'top 85%',
              end: 'top 25%',
              scrub: 0.3,
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
      id="m6"
      className="w-full py-24 sm:py-36 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] text-[#081C33] border-t border-[#081C33]/10 relative"
      aria-labelledby="m6-heading"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Block in normal document flow */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
            {m6.kicker}
          </div>
          <h2
            id="m6-heading"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]"
          >
            {m6.title}
          </h2>
          <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
            {m6.subtitle}
          </p>
          <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans pt-2">
            <p>{m6.body[0]}</p>
            <p>{m6.body[1]}</p>
          </div>
        </div>

        {/* Finished 3D Heliport Stage at Quiet Architectural Scale */}
        <div className="w-full max-w-5xl mx-auto relative rounded-none overflow-hidden border border-[#081C33]/15 shadow-md bg-white">
          <div className="relative w-full h-[280px] sm:h-[380px] overflow-hidden">
            {/* WebGL Canvas */}
            <div
              ref={stageContainerRef}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                is3DReady && !has3DError ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />

            {/* Static SVG Fallback if WebGL unavailable */}
            {(!is3DReady || has3DError) && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6 bg-white">
                <svg viewBox="0 0 400 240" className="w-full h-full max-w-md opacity-80" aria-hidden="true">
                  <ellipse cx="200" cy="140" rx="140" ry="60" fill="#E2E8F0" />
                  <ellipse cx="200" cy="135" rx="130" ry="55" fill="#182433" />
                  <ellipse cx="200" cy="135" rx="90" ry="38" fill="none" stroke="#FFFFFF" strokeWidth="6" />
                  <text x="200" y="145" textAnchor="middle" fill="#FFFFFF" fontSize="36" fontFamily="sans-serif" fontWeight="bold">H</text>
                  <circle cx="90" cy="135" r="4" fill="#10B981" />
                  <circle cx="310" cy="135" r="4" fill="#10B981" />
                  <path d="M200 95 L190 110 L210 110 Z" fill="#E31E24" />
                </svg>
              </div>
            )}

            {/* Quiet architectural caption badge */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 pointer-events-none z-10">
              <div className="text-[11px] font-mono-tech text-[#081C33]/70 bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-[#081C33]/10 shadow-sm">
                INFRASTRUTTURA COMPLETATA // STATO OPERATIVO
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Three-Part Layout for Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {PRINCIPLES.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <div
                key={idx}
                className="p-8 bg-white border border-[#081C33]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative"
                style={{ borderTop: `4px solid ${principle.accentColor}` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono-tech text-xs uppercase tracking-widest font-bold"
                      style={{ color: principle.accentColor }}
                    >
                      {principle.number}
                    </span>
                    <Icon className="w-4 h-4 text-[#081C33]/40" />
                  </div>

                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[#081C33] leading-snug">
                    {principle.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#081C33]/75 font-sans leading-relaxed">
                    {principle.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#081C33]/10 text-[10px] font-mono-tech text-[#081C33]/50">
                  STANDARD OPERATIVO // ALIDAUNIA
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions & Next Step Navigation in Normal Document Flow */}
        <div className="pt-12 border-t border-[#081C33]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono-tech text-[#081C33]/60 uppercase tracking-widest block mb-1">
              APPROFONDIMENTO STRATEGICO
            </span>
            <p className="font-display font-bold text-lg text-[#081C33]">
              Scopri i valori e la missione aziendale
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onNavigate?.(ROUTES.VISION);
              }}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 text-xs font-mono-tech uppercase tracking-wider font-bold bg-[#0B4584] hover:bg-[#081C33] text-white transition-colors shadow-sm"
            >
              <span>Vision, Mission e Valori</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={EXTERNAL_LINKS.CONTACTS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 text-xs font-mono-tech uppercase tracking-wider font-bold border border-[#081C33]/30 hover:border-[#081C33] text-[#081C33] hover:bg-[#081C33] hover:text-white transition-colors"
            >
              <span>Contatta il Team Tecnico</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
