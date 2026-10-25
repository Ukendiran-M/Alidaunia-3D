/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BRAND_ASSETS } from '../config/assets';
import {
  MANIFESTO_SECTIONS,
  M2_INFRASTRUCTURE_LAYERS,
  M3_PROJECT_PHASES,
  M5_NETWORK_NODES,
  M5_NETWORK_CONNECTIONS,
} from '../config/manifestoContent';
import { HelicopterAssemblyHero } from '../components/HelicopterAssemblyHero';
import { EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import { ArrowDown, ArrowRight, ArrowUpRight, CheckCircle2, Layers, MapPin } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ManifestoPageProps {
  onNavigate?: (route: typeof ROUTES.VISION) => void;
}

export const ManifestoPage: React.FC<ManifestoPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const m4ImageRef = useRef<HTMLDivElement>(null);
  const [activeM2Layer, setActiveM2Layer] = useState(0);

  useEffect(() => {
    document.title = "Manifesto | ALIDAUNIA SERVICES";

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        // M4: Centred operations image expansion into wide composition
        if (m4ImageRef.current) {
          gsap.fromTo(
            m4ImageRef.current,
            { scale: 0.88, opacity: 0.8 },
            {
              scale: 1.0,
              opacity: 1.0,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: '#m4',
                start: 'top 75%',
                end: 'center center',
                scrub: true,
              },
            }
          );
        }

        // M5: Network connections pulse
        gsap.fromTo(
          '.network-line',
          { strokeDashoffset: 100, opacity: 0.2 },
          {
            strokeDashoffset: 0,
            opacity: 0.8,
            stagger: 0.15,
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: '#m5',
              start: 'top 65%',
              end: 'center 45%',
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

  const m1 = MANIFESTO_SECTIONS[0];
  const m2 = MANIFESTO_SECTIONS[1];
  const m3 = MANIFESTO_SECTIONS[2];
  const m4 = MANIFESTO_SECTIONS[3];
  const m5 = MANIFESTO_SECTIONS[4];
  const m6 = MANIFESTO_SECTIONS[5];

  return (
    <div ref={containerRef} className="w-full bg-[#F5F6F7] text-[#081C33] overflow-x-hidden">
      {/* =========================================================================
          SECTION M1: Real Three.js 3D Helicopter Exploded-View and Reassembly Hero
         ========================================================================= */}
      <HelicopterAssemblyHero />

      {/* =========================================================================
          SECTION M2: Separated heliport infrastructure layers assemble
          "Ogni infrastruttura è un sistema."
          Introductory content includes the 2 moved hero paragraphs.
         ========================================================================= */}
      <section
        id="m2"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Heading & Intro Paragraphs (including moved M1 paragraphs) */}
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {m2.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {m2.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {m2.subtitle}
            </p>

            {/* Preserved paragraphs: the two detailed hero paragraphs + infrastructure system description */}
            <div className="space-y-4 pt-2 text-base sm:text-lg text-[#081C33]/85 leading-relaxed font-sans">
              {m2.body.map((paragraph, pIdx) => (
                <p key={pIdx}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Interactive Assembled Infrastructure Layers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 border border-[#081C33]/10 shadow-lg">
            {/* Visual Assembly Graphic (Left 6 cols) */}
            <div className="lg:col-span-6 bg-[#081C33] p-8 text-white relative min-h-[360px] flex flex-col justify-center items-center overflow-hidden">
              <div className="text-center space-y-2 mb-6 z-10">
                <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[#0B4584] bg-white px-2.5 py-1 font-semibold">
                  MODELLO ILLUSTRATIVO
                </span>
                <p className="text-xs text-white/60 font-mono-tech">
                  Seleziona i livelli per visualizzare la coesione tecnica
                </p>
              </div>

              {/* Stacked layers visualization */}
              <div className="w-full max-w-sm space-y-3 relative z-10">
                {M2_INFRASTRUCTURE_LAYERS.map((layer, idx) => {
                  const isSelected = activeM2Layer === idx;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setActiveM2Layer(idx)}
                      className={`p-3.5 border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#0B4584] border-white text-white shadow-md translate-x-2'
                          : 'bg-[#081C33]/80 border-white/20 text-white/70 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#E31E24]" />
                        <span className="text-xs sm:text-sm font-semibold tracking-wide">
                          {layer.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-tech opacity-75">
                        LIV. 0{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Background technical grid pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0B4584_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>

            {/* Layer Details Breakdown (Right 6 cols) */}
            <div className="lg:col-span-6 space-y-6 lg:pl-6">
              <div className="space-y-2">
                <span className="text-xs font-mono-tech uppercase tracking-widest text-[#E31E24] font-bold">
                  LIVELLO ATTIVO // 0{activeM2Layer + 1}
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#081C33]">
                  {M2_INFRASTRUCTURE_LAYERS[activeM2Layer].name}
                </h3>
              </div>

              <p className="text-base sm:text-lg text-[#081C33]/85 leading-relaxed font-sans">
                {M2_INFRASTRUCTURE_LAYERS[activeM2Layer].description}
              </p>

              <div className="pt-4 border-t border-[#081C33]/10 flex flex-wrap gap-2 text-xs font-mono-tech text-[#081C33]/70">
                <span className="px-2.5 py-1 bg-[#F5F6F7] border border-[#081C33]/10">
                  SCHEMA ILLUSTRATIVO
                </span>
                <span className="px-2.5 py-1 bg-[#F5F6F7] border border-[#081C33]/10">
                  MODELLO MULTILIVELLO
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION M3: Vertical project path
          "Scegli un approccio integrato."
          Progressively reveals Analisi, Progetto, Realizzazione and Gestione.
         ========================================================================= */}
      <section
        id="m3"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {m3.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {m3.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {m3.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{m3.body[0]}</p>
              <p>{m3.body[1]}</p>
            </div>
          </div>

          {/* 4 Progressive Phases: Analisi -> Progetto -> Realizzazione -> Gestione */}
          <div className="relative pt-6">
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#0B4584]/20 -translate-x-1/2" />

            <div className="space-y-12 lg:space-y-16">
              {M3_PROJECT_PHASES.map((phase, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={phase.number}
                    className={`relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                      isEven ? '' : 'lg:flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`lg:col-span-5 p-8 bg-[#F5F6F7] border-l-4 border-[#0B4584] border-y border-r border-[#081C33]/10 shadow-sm ${
                        isEven ? 'lg:col-start-1' : 'lg:col-start-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono-tech text-xs uppercase tracking-widest text-[#0B4584] font-bold">
                          FASE {phase.number}
                        </span>
                        <span className="text-xs font-mono-tech text-[#081C33]/40">
                          CICLO INTEGRATO
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-2xl text-[#081C33] mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#081C33]/80 font-sans mb-4">
                        {phase.description}
                      </p>

                      <ul className="space-y-2 pt-2 border-t border-[#081C33]/10 text-xs sm:text-sm text-[#081C33]/70">
                        {phase.details.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0B4584] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
                      <div className="w-10 h-10 rounded-full bg-[#081C33] text-white flex items-center justify-center font-mono-tech text-xs font-bold border-4 border-white shadow-md z-10">
                        {phase.number}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION M4: Centred operations image expands wide + steady reading interval
          "Affidati all'esperienza."
         ========================================================================= */}
      <section
        id="m4"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#081C33] text-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#F5F6F7]/70 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E31E24]" />
              {m4.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08]">
              {m4.title}
            </h2>
            <p className="text-xl sm:text-2xl text-white/90 font-light leading-relaxed">
              {m4.subtitle}
            </p>
          </div>

          <div
            ref={m4ImageRef}
            className="w-full max-w-5xl mx-auto rounded-none overflow-hidden border border-white/20 shadow-2xl relative"
          >
            <div className="aspect-video sm:aspect-[21/9] w-full relative">
              <img
                src={BRAND_ASSETS.operationsReference.url}
                alt={BRAND_ASSETS.operationsReference.alt}
                className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081C33]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-xs font-mono-tech text-white/70 bg-[#081C33]/80 px-3 py-1.5 border border-white/10">
                OPERAZIONI AERONAUTICHE DI TERRA // COORDINAMENTO SUL CAMPO
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-base sm:text-lg text-white/80 leading-relaxed font-sans pt-4">
            <p>{m4.body[0]}</p>
            <p>{m4.body[1]}</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION M5: Full-width schematic network reveals Foggia & connections
          "Una rete, una visione d'insieme."
         ========================================================================= */}
      <section
        id="m5"
        className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] border-b border-[#081C33]/10"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {m5.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {m5.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {m5.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{m5.body[0]}</p>
              <p>{m5.body[1]}</p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-10 border border-[#081C33]/10 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-[#081C33]/10 text-xs font-mono-tech">
              <span className="font-semibold text-[#081C33]">
                TOPOLOGIA DI RETE E NODI DI COLLEGAMENTO
              </span>
              <span className="text-[#0B4584]">HUB CENTRALE: FOGGIA</span>
            </div>

            <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] max-h-[500px] my-6 bg-[#081C33]/5 border border-[#081C33]/10 overflow-hidden flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {M5_NETWORK_CONNECTIONS.map((conn, i) => {
                  const source = M5_NETWORK_NODES.find((n) => n.id === conn.from);
                  const target = M5_NETWORK_NODES.find((n) => n.id === conn.to);
                  if (!source || !target) return null;
                  return (
                    <line
                      key={i}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#0B4584"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                      className="network-line"
                    />
                  );
                })}
              </svg>

              {M5_NETWORK_NODES.map((node) => (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default"
                >
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 ${
                      node.isHub
                        ? 'bg-[#E31E24] border-white ring-4 ring-[#E31E24]/30'
                        : 'bg-[#0B4584] border-white shadow'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span
                    className={`mt-1.5 px-2 py-0.5 text-[10px] sm:text-xs font-mono-tech whitespace-nowrap shadow-sm border ${
                      node.isHub
                        ? 'bg-[#081C33] text-white font-bold border-[#081C33]'
                        : 'bg-white text-[#081C33] border-[#081C33]/20'
                    }`}
                  >
                    {node.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-[#081C33]/10">
              {M5_NETWORK_NODES.map((node) => (
                <div
                  key={node.id}
                  className="p-3 bg-[#F5F6F7] border border-[#081C33]/10 flex items-start gap-3"
                >
                  <MapPin
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      node.isHub ? 'text-[#E31E24]' : 'text-[#0B4584]'
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold text-xs text-[#081C33]">
                      {node.name}
                    </h4>
                    <p className="text-[11px] text-[#081C33]/60 font-mono-tech">
                      {node.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION M6: Calm closing composition with next-page & contact links
          "I principi che guidano ogni progetto."
         ========================================================================= */}
      <section
        id="m6"
        className="w-full py-24 sm:py-36 px-6 sm:px-10 lg:px-16 bg-white"
      >
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
              {m6.kicker}
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]">
              {m6.title}
            </h2>
            <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
              {m6.subtitle}
            </p>
            <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans">
              <p>{m6.body[0]}</p>
              <p>{m6.body[1]}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-8 bg-[#F5F6F7] border-t-4 border-[#0B4584] border-x border-b border-[#081C33]/10 space-y-3">
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#0B4584] font-bold">
                PRINCIPIO 01
              </div>
              <h3 className="font-display font-bold text-xl text-[#081C33]">
                Sicurezza Senza Compromessi
              </h3>
              <p className="text-sm text-[#081C33]/75 font-sans leading-relaxed">
                Priorità all&apos;analisi attenta degli spazi operativi, alla regolarità dei flussi e all&apos;efficienza dei presidi di sicurezza a terra.
              </p>
            </div>

            <div className="p-8 bg-[#F5F6F7] border-t-4 border-[#E31E24] border-x border-b border-[#081C33]/10 space-y-3">
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#E31E24] font-bold">
                PRINCIPIO 02
              </div>
              <h3 className="font-display font-bold text-xl text-[#081C33]">
                Rigore Progettuale &amp; Precisione
              </h3>
              <p className="text-sm text-[#081C33]/75 font-sans leading-relaxed">
                Metodo ingegneristico accurato, dai primi rilievi geometrici fino al collaudo operativo e all&apos;avvio in esercizio.
              </p>
            </div>

            <div className="p-8 bg-[#F5F6F7] border-t-4 border-[#081C33] border-x border-b border-[#081C33]/10 space-y-3">
              <div className="font-mono-tech text-xs uppercase tracking-widest text-[#081C33] font-bold">
                PRINCIPIO 03
              </div>
              <h3 className="font-display font-bold text-xl text-[#081C33]">
                Continuità del Servizio
              </h3>
              <p className="text-sm text-[#081C33]/75 font-sans leading-relaxed">
                Accompagnamento costante degli approdi attraverso protocolli di manutenzione e coordinamento operativo di terra.
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-[#081C33]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono-tech text-[#081C33]/50 uppercase tracking-widest block mb-1">
                APPROFONDIMENTO STRATEGICO
              </span>
              <p className="font-display font-bold text-lg text-[#081C33]">
                Scopri i valori e la missione aziendale
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate?.(ROUTES.VISION);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#0B4584] hover:bg-[#081C33] text-white transition-colors"
              >
                <span>Vision, Mission e Valori</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={EXTERNAL_LINKS.CONTACTS}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-mono-tech uppercase tracking-wider font-semibold border border-[#081C33]/30 hover:border-[#081C33] text-[#081C33] hover:bg-[#081C33] hover:text-white transition-colors"
              >
                <span>Contatta il Team Tecnico</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
