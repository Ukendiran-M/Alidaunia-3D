/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M2: Architectural Project Drawing
 * "Ogni infrastruttura è un sistema."
 * Real curved 3D paper mesh that unrolls physically across a deep navy drafting table,
 * progressively drawing the 5 coordinated technical systems in fine blue and red linework.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Layers, ShieldCheck, Compass, Zap, Anchor, FileText } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MANIFESTO_SECTIONS, M2_INFRASTRUCTURE_LAYERS } from '../config/manifestoContent';
import { computeProjectDrawingState, DRAWING_SYSTEMS } from '../utils/projectDrawingPose';
import type { createProjectDrawingStage } from '../three/createProjectDrawingStage';

gsap.registerPlugin(ScrollTrigger);

const LAYER_ICONS = [
  Anchor,       // Base Geotecnica & Drenaggio
  Layers,       // Piastra Strutturale FATO
  Compass,      // Cerchio TLOF & Marcatura H
  Zap,          // Circuito Luci Perimetrali & Antincendio
  ShieldCheck,  // Fascia di Sicurezza & Vie di Transito
];

export const InfrastructureAssemblySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const layerIndexRef = useRef<HTMLSpanElement>(null);
  const layerNameRef = useRef<HTMLHeadingElement>(null);
  const layerDescRef = useRef<HTMLParagraphElement>(null);

  const [activeSystemIndex, setActiveSystemIndex] = useState(0);
  const [phaseName, setPhaseName] = useState<string>('rolled-hold');
  const [isReady, setIsReady] = useState(false);

  const m2 = MANIFESTO_SECTIONS[1];

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
        let stage: ReturnType<typeof createProjectDrawingStage> | undefined;
        let tween: gsap.core.Tween | undefined;
        let refreshId = 0;
        const driver = { progress: reduced ? 0.85 : 0 };

        const updateState = () => {
          const state = computeProjectDrawingState(driver.progress);
          stage?.setProgress(driver.progress);

          setActiveSystemIndex(state.activeSystemIndex);
          setPhaseName(state.phase);

          if (hudRef.current) {
            hudRef.current.style.opacity = String(state.hudOpacity);
          }

          const currentLayerData = M2_INFRASTRUCTURE_LAYERS[state.activeSystemIndex];
          if (currentLayerData) {
            if (layerIndexRef.current) {
              layerIndexRef.current.textContent = `SISTEMA ATTIVO // 0${state.activeSystemIndex + 1}`;
            }
            if (layerNameRef.current) {
              layerNameRef.current.textContent = currentLayerData.name;
            }
            if (layerDescRef.current) {
              layerDescRef.current.textContent = currentLayerData.description;
            }
          }

          section.dataset.m2Progress = driver.progress.toFixed(3);
          section.dataset.m2Phase = state.phase;
        };

        import('../three/createProjectDrawingStage')
          .then(({ createProjectDrawingStage }) => {
            if (!active) return;
            stage = createProjectDrawingStage(canvasContainer, {
              mobile,
              reducedMotion: reduced,
              onReady: () => {
                if (!active) return;
                setIsReady(true);
                updateState();
                refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());
              },
              onError: (err, fatal) => {
                console.warn('Project drawing stage notice:', err, fatal);
              },
            });
            updateState();
          })
          .catch((err) => {
            console.warn('Could not initialize project drawing stage:', err);
          });

        if (!reduced) {
          const scrollDistance = pin.clientHeight * (mobile ? 1.5 : 2.2);

          tween = gsap.to(driver, {
            progress: 1,
            ease: 'none',
            onUpdate: updateState,
            scrollTrigger: {
              id: 'manifesto-m2-drawing',
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
      id="m2"
      className="w-full bg-[#081C33] text-white relative"
      aria-labelledby="m2-heading"
    >
      {/* Seamless navy continuation from M1 AW139 hero */}

      {/* Part A: Introductory Section in normal document flow */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-24 sm:pt-32 pb-16 space-y-8">
        <div className="max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#8BBEFF] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
            {m2.kicker}
          </div>
          <h2
            id="m2-heading"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08]"
          >
            {m2.title}
          </h2>
          <p className="text-xl sm:text-2xl text-[#8BBEFF] font-medium leading-relaxed">
            {m2.subtitle}
          </p>

          <div className="space-y-4 pt-2 text-base sm:text-lg text-white/80 leading-relaxed font-sans">
            {m2.body.map((paragraph, pIdx) => (
              <p key={pIdx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Part B: Pinned 3D Physical Paper Unrolling Stage */}
      <div
        ref={pinRef}
        className="relative w-full h-[85vh] min-h-[580px] max-h-[880px] bg-[#081C33] border-y border-white/10 overflow-hidden flex flex-col justify-between"
      >
        {/* Full-width 3D Canvas container */}
        <div
          ref={canvasContainerRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />

        {/* Top Header Overlay: Drawing Title & Phase Chapters Indicator */}
        <div className="relative z-10 p-6 sm:p-10 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="bg-[#051324]/90 backdrop-blur-sm border border-white/15 px-3.5 py-2 shadow-sm text-white">
            <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[#8BBEFF] font-bold flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#E31E24]" />
              TAVOLA TECNICA // SVOLGIMENTO PROGETTUALE
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#051324]/85 backdrop-blur-sm border border-white/15 px-3 py-1.5 text-xs font-mono-tech text-white/80 shadow-sm">
            <span className="text-white/50">STATO TAVOLA:</span>
            <span className="font-semibold text-[#8BBEFF] uppercase">
              {phaseName === 'rolled-hold'
                ? 'Carta Arrotolata'
                : phaseName === 'unrolling'
                ? 'Svolgimento Disegno'
                : phaseName === 'linework-reveal'
                ? 'Tracciamento Schemi'
                : 'Tavola Integrata'}
            </span>
          </div>
        </div>

        {/* Bottom Left Floating System HUD (Outside Drawing Silhouette in Negative Space) */}
        <div
          ref={hudRef}
          className="relative z-10 p-6 sm:p-10 pointer-events-none transition-opacity duration-300 max-w-lg"
        >
          <div className="bg-[#051324]/95 backdrop-blur-md p-6 border-l-4 border-[#0B4584] border-y border-r border-white/15 shadow-2xl space-y-2 pointer-events-auto text-white">
            <div className="flex items-center justify-between">
              <span
                ref={layerIndexRef}
                className="text-xs font-mono-tech uppercase tracking-widest text-[#E31E24] font-bold"
              >
                SISTEMA ATTIVO // 01
              </span>
              <span className="text-[10px] font-mono-tech text-white/50">
                SCHEMA COORDINATO
              </span>
            </div>

            <h3
              ref={layerNameRef}
              className="font-display font-bold text-xl sm:text-2xl text-white"
            >
              01. Base Geotecnica &amp; Drenaggio
            </h3>

            <p
              ref={layerDescRef}
              className="text-sm text-white/80 leading-relaxed font-sans"
            >
              Sottofondo calibrato, pendenze per lo smaltimento acque e capacità di carico ad alta resistenza.
            </p>

            {/* Quick 5-step progress pill */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-1.5">
              {M2_INFRASTRUCTURE_LAYERS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 transition-all duration-300 ${
                    idx === activeSystemIndex
                      ? 'bg-[#E31E24]'
                      : idx < activeSystemIndex
                      ? 'bg-[#0B4584]'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Subtle progression vertical track on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2 z-10">
          <div className="text-[9px] font-mono-tech text-white/40 [writing-mode:vertical-lr] tracking-widest uppercase">
            REVISIONE PROGETTUALE
          </div>
          <div className="w-1 h-24 bg-white/10 relative rounded-full overflow-hidden">
            <div
              className="w-full bg-[#0B4584] transition-all duration-150"
              style={{ height: `${((activeSystemIndex + 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Part C: Complete 5-System Technical Breakdown in normal flow below the 3D scene */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24 border-t border-white/10">
        <div className="space-y-4 mb-10">
          <span className="text-xs font-mono-tech uppercase tracking-widest text-[#8BBEFF] font-bold">
            DETTAGLIO DEI LIVELLI COSTRUTTIVI
          </span>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
            La convergenza dei componenti tecnici
          </h3>
          <p className="text-base text-white/75 max-w-3xl font-sans">
            Ciascuna sezione del disegno tecnico rappresenta una disciplina ingegneristica indispensabile per la conformità aeronautica e l&apos;esercizio dell&apos;infrastruttura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {M2_INFRASTRUCTURE_LAYERS.map((layer, idx) => {
            const Icon = LAYER_ICONS[idx] ?? Layers;
            return (
              <div
                key={layer.id}
                className="p-6 bg-[#051324] border border-white/10 shadow-sm hover:shadow-md transition-shadow space-y-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded bg-[#081C33] border border-white/15 flex items-center justify-center text-[#8BBEFF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono-tech text-[#8BBEFF] font-bold px-2 py-0.5 bg-[#081C33] border border-white/10">
                    LIV. 0{idx + 1}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-display font-bold text-lg text-white">
                    {layer.name}
                  </h4>
                  <p className="text-sm text-white/75 font-sans leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* 6th architectural note card */}
          <div className="p-6 bg-[#0B4584] text-white border border-[#0B4584] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[#E31E24] bg-white px-2 py-0.5 font-bold">
                CONFORMITÀ &amp; RESA
              </span>
              <h4 className="font-display font-bold text-lg text-white">
                Sinergia Operativa Completa
              </h4>
              <p className="text-sm text-white/90 font-sans leading-relaxed">
                Tutti i livelli operano congiuntamente per garantire standard di sicurezza EASA/ENAC e assicurare la continuità operativa in qualsiasi condizione meteo.
              </p>
            </div>
            <div className="text-[11px] font-mono-tech text-white/60 pt-2 border-t border-white/10">
              ALIDAUNIA ENGINEERING // INFRASTRUCTURE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
