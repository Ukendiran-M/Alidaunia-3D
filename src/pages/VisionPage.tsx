/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BRAND_ASSETS } from '../config/assets';
import {
  VISION_SECTIONS,
  V3_MISSION_GROUPS,
  V4_DESIGN_PILLARS,
  V5_RELATIONSHIP_VALUES,
} from '../config/visionContent';
import { EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Compass,
  Cpu,
  Flame,
  Globe,
  Shield,
  Zap,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VisionPageProps {
  onNavigate?: (route: typeof ROUTES.MANIFESTO) => void;
}

export const VisionPage: React.FC<VisionPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const v1ImageRef = useRef<HTMLImageElement>(null);
  const [activePillar, setActivePillar] = useState(0);

  useEffect(() => {
    document.title = "Vision, Mission e Valori | ALIDAUNIA SERVICES";

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // V1: Hero scale and typography reveal
        if (v1ImageRef.current) {
          gsap.fromTo(
            v1ImageRef.current,
            { scale: 1.0, opacity: 0.8 },
            {
              scale: 1.07,
              opacity: 0.5,
              ease: 'none',
              scrollTrigger: {
                trigger: '#v1',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        }

        // V2: Outline resolving into completed structure
        gsap.fromTo(
          '.v2-wireframe',
          { strokeDashoffset: 200, opacity: 0.9 },
          {
            strokeDashoffset: 0,
            opacity: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#v2',
              start: 'top 70%',
              end: 'center 40%',
              scrub: true,
            },
          }
        );

        // V3: Mission groups progressive reveal
        gsap.fromTo(
          '.v3-card',
          { y: 30, opacity: 0.4 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '#v3',
              start: 'top 65%',
              end: 'bottom 85%',
              scrub: true,
            },
          }
        );
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const v1 = VISION_SECTIONS[0];
  const v2 = VISION_SECTIONS[1];
  const v3 = VISION_SECTIONS[2];
  const v4 = VISION_SECTIONS[3];
  const v5 = VISION_SECTIONS[4];
  const v6 = VISION_SECTIONS[5];

  return (
    <div ref={containerRef} className="w-full bg-[#F5F6F7] text-[#081C33] overflow-x-hidden">
      {/* =========================================================================
          SECTION V1: Large masked typography reveal over related full-width visual
          "Innovativi per tradizione."
         ========================================================================= */}
      <section
        id="v1"
        className="relative w-full min-h-[92vh] lg:min-h-screen flex flex-col justify-between bg-[#081C33] text-white px-6 sm:px-10 lg:px-16 pt-24 pb-16 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            ref={v1ImageRef}
            src={BRAND_ASSETS.missionReference.url}
            alt={BRAND_ASSETS.missionReference.alt}
            className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081C33] via-[#081C33]/60 to-[#081C33]/40" />
          <div className="absolute inset-0 bg-radial from-transparent to-[#081C33]/70" />
        </div>

        {/* Top Kicker */}
        <div className="relative z-10 max-w-7xl mx-auto w-full pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono-tech uppercase tracking-widest text-white/90">
            <span className="w-2 h-2 rounded-full bg-[#E31E24]" />
            ALIDAUNIA SERVICES • VISIONE &amp; MISSIONE
          </div>
        </div>

        {/* Large Masked Typography in Negative Space */}
        <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-12">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.04] text-white text-balance drop-shadow-sm">
              {v1.title}
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-white/90 font-light leading-relaxed max-w-2xl font-sans">
              {v1.subtitle}
            </p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl text-base sm:text-lg text-white/80 leading-relaxed font-sans">
              <p>{v1.body[0]}</p>
              <p>{v1.body[1]}</p>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between text-xs font-mono-tech text-white/60 border-t border-white/15 pt-6">
          <div className="flex items-center gap-2">
            <span>SCORRI PER ESPLORARE I VALORI</span>
          </div>
          <a
            href="#v2"
            aria-label="Scorri alla sezione successiva"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <span>V2: Valore nel Tempo</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* =========================================================================
          SECTION V2: Technical outline resolves into completed infrastructure
          "Costruire un valore che resta nel tempo."
         ========================================================================= */}
      <section
        id="v2"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {v2.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {v2.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {v2.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{v2.body[0]}</p>
              <p>{v2.body[1]}</p>
            </div>
          </div>

          {/* Wireframe Outline to Finished Infrastructure Illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 border border-[#081C33]/10 shadow-lg">
            <div className="lg:col-span-7 relative aspect-[16/10] bg-[#081C33] overflow-hidden border border-[#081C33]/15">
              {/* Underlying photographic infrastructure */}
              <img
                src={BRAND_ASSETS.valuesReference.url}
                alt={BRAND_ASSETS.valuesReference.alt}
                className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.1]"
              />

              {/* Technical blueprint overlay wireframe that resolves on scroll */}
              <svg
                viewBox="0 0 600 400"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <circle
                  cx="300"
                  cy="200"
                  r="140"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="v2-wireframe"
                />
                <circle
                  cx="300"
                  cy="200"
                  r="80"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="v2-wireframe"
                />
                <rect
                  x="120"
                  y="70"
                  width="360"
                  height="260"
                  fill="none"
                  stroke="#0B4584"
                  strokeWidth="1.5"
                  className="v2-wireframe"
                />
                <line x1="300" y1="20" x2="300" y2="380" stroke="#E31E24" strokeWidth="1" strokeDasharray="4 4" className="v2-wireframe" />
                <line x1="40" y1="200" x2="560" y2="200" stroke="#E31E24" strokeWidth="1" strokeDasharray="4 4" className="v2-wireframe" />
              </svg>

              <div className="absolute bottom-4 left-4 text-[11px] font-mono-tech text-white/70 bg-[#081C33]/80 px-3 py-1 border border-white/10">
                SCHEMA GRAFICO ILLUSTRATIVO // EVOLUZIONE PROGETTUALE
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6 lg:pl-4">
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#081C33]">
                Dalla Geometria al Manufatto
              </h3>
              <p className="text-base sm:text-lg text-[#081C33]/85 leading-relaxed font-sans">
                La transizione dalla linea progettuale alla piastra operativa mira a garantire solidità, funzionalità e piena coerenza con le esigenze del volo verticale.
              </p>
              <div className="space-y-2 border-t border-[#081C33]/10 pt-4 text-sm text-[#081C33]/80 font-sans">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0B4584]" />
                  <span>Attenzione alla qualità dei materiali e alla durata nel tempo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0B4584]" />
                  <span>Soluzioni studiate per la sicurezza e la funzionalità operativa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION V3: Three Mission groups with restrained stacking effect
          "Dalla visione al lavoro quotidiano."
          Preserves ALL 7 Mission points.
         ========================================================================= */}
      <section
        id="v3"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {v3.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {v3.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {v3.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{v3.body[0]}</p>
              <p>{v3.body[1]}</p>
            </div>
          </div>

          {/* 3 Mission Groups with all 7 points */}
          <div className="space-y-8">
            {V3_MISSION_GROUPS.map((group, gIdx) => (
              <div
                key={group.id}
                className="v3-card bg-[#F5F6F7] border border-[#081C33]/10 p-8 sm:p-10 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#081C33]/10 mb-6">
                  <div>
                    <span className="text-xs font-mono-tech uppercase tracking-widest text-[#E31E24] font-bold block mb-1">
                      {group.badge}
                    </span>
                    <h3 className="font-display font-bold text-2xl text-[#081C33]">
                      {group.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono-tech text-[#081C33]/50">
                    {group.points.length} OBIETTIVI OPERATIVI
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.points.map((point) => (
                    <div
                      key={point.number}
                      className="p-5 bg-white border border-[#081C33]/10 space-y-2.5"
                    >
                      <span className="inline-block font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#081C33] text-white">
                        PUNTO {point.number}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-[#081C33] leading-snug">
                        {point.text}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#081C33]/70 font-sans leading-relaxed">
                        {point.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION V4: Reveal Esperienza, Tecnologia, Dinamismo, Modernità
          "Il nostro modo di progettare."
         ========================================================================= */}
      <section
        id="v4"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#081C33] text-white"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#F5F6F7]/70 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              {v4.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08]">
              {v4.title}
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 font-light leading-relaxed">
              {v4.subtitle}
            </p>
          </div>

          {/* Interactive Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {V4_DESIGN_PILLARS.map((pillar, idx) => {
              const isSelected = activePillar === idx;
              return (
                <div
                  key={pillar.id}
                  onClick={() => setActivePillar(idx)}
                  className={`p-8 border transition-all cursor-pointer space-y-4 ${
                    isSelected
                      ? 'bg-[#0B4584] border-white shadow-2xl translate-y--2'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="font-mono-tech text-xs tracking-widest text-white/60">
                    0{idx + 1} // PILASTRO
                  </div>
                  <h3 className="font-display font-bold text-3xl sm:text-4xl text-white">
                    {pillar.title}
                  </h3>
                  <div className="text-xs font-mono-tech text-white/80 uppercase tracking-wider font-semibold border-b border-white/20 pb-3">
                    {pillar.focus}
                  </div>
                  <p className="text-sm text-white/75 font-sans leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION V5: Connections between Cliente, Progetto and Gestione
          "Il nostro modo di collaborare."
          Reveals the four relationship values.
         ========================================================================= */}
      <section
        id="v5"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {v5.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {v5.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {v5.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{v5.body[0]}</p>
              <p>{v5.body[1]}</p>
            </div>
          </div>

          {/* Triangular relationship model (Cliente - Progetto - Gestione) */}
          <div className="bg-white p-8 sm:p-12 border border-[#081C33]/10 shadow-lg space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-[#F5F6F7] border-2 border-[#0B4584]">
                <div className="font-mono-tech text-xs text-[#0B4584] font-bold uppercase mb-1">
                  ENTITÀ 01
                </div>
                <h3 className="font-display font-bold text-2xl text-[#081C33]">
                  Cliente
                </h3>
                <p className="text-xs text-[#081C33]/70 mt-2 font-sans">
                  Enti pubblici, strutture sanitarie, committenti privati.
                </p>
              </div>

              <div className="p-6 bg-[#F5F6F7] border-2 border-[#E31E24]">
                <div className="font-mono-tech text-xs text-[#E31E24] font-bold uppercase mb-1">
                  ENTITÀ 02
                </div>
                <h3 className="font-display font-bold text-2xl text-[#081C33]">
                  Progetto
                </h3>
                <p className="text-xs text-[#081C33]/70 mt-2 font-sans">
                  Ingegneria di precisione, conformità aeronautica, opere civili.
                </p>
              </div>

              <div className="p-6 bg-[#F5F6F7] border-2 border-[#081C33]">
                <div className="font-mono-tech text-xs text-[#081C33] font-bold uppercase mb-1">
                  ENTITÀ 03
                </div>
                <h3 className="font-display font-bold text-2xl text-[#081C33]">
                  Gestione
                </h3>
                <p className="text-xs text-[#081C33]/70 mt-2 font-sans">
                  Manutenzione continua, protocolli HEMS, supporto operativo.
                </p>
              </div>
            </div>

            {/* 4 Relationship Values */}
            <div className="pt-8 border-t border-[#081C33]/10">
              <div className="text-xs font-mono-tech uppercase tracking-widest text-[#081C33]/50 mb-6 font-semibold">
                I QUATTRO VALORI RELAZIONALI
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {V5_RELATIONSHIP_VALUES.map((val, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-5 bg-[#F5F6F7] border-l-4 border-[#0B4584] border-y border-r border-[#081C33]/10"
                  >
                    <h4 className="font-display font-bold text-lg text-[#081C33] mb-1">
                      {val.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#081C33]/75 font-sans leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION V6: Final composition with project-enquiry action
          "Diamo forma al tuo prossimo progetto."
         ========================================================================= */}
      <section
        id="v6"
        className="w-full py-24 sm:py-36 px-6 sm:px-10 lg:px-16 bg-white"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {v6.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {v6.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {v6.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{v6.body[0]}</p>
              <p>{v6.body[1]}</p>
            </div>
          </div>

          {/* Project Enquiry Action Callout */}
          <div className="bg-[#081C33] text-white p-8 sm:p-14 border border-[#081C33] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="inline-block px-3 py-1 bg-[#E31E24] text-white text-xs font-mono-tech uppercase font-bold tracking-wider">
                CONTATTO DIRETTO INGEGNERIA AERONAUTICA
              </span>

              <h3 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
                Hai un progetto di elisuperficie, eliporto o vertiporto da realizzare?
              </h3>

              <p className="text-base text-white/80 font-sans leading-relaxed">
                Il nostro team di ingegneri e specialisti operativi è a disposizione per valutazioni di fattibilità, consulenze normative e pianificazione strategica.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={EXTERNAL_LINKS.CONTACTS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-mono-tech uppercase tracking-wider font-semibold bg-white text-[#081C33] hover:bg-[#0B4584] hover:text-white transition-colors border border-white"
                >
                  <span>Invia una Richiesta Tecnica</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate?.(ROUTES.MANIFESTO);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-mono-tech uppercase tracking-wider font-semibold border border-white/30 hover:border-white text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Torna al Manifesto</span>
                </button>
              </div>
            </div>

            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0B4584_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          </div>
        </div>
      </section>
    </div>
  );
};
