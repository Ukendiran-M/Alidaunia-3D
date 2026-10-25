/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M5: Conceptual Network Section
 * "Una rete, una visione d'insieme."
 * Editorial architectural board with raised node pylons (red-accent hub for Foggia)
 * and 3D spatial blue curve links connecting the regional network.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MANIFESTO_SECTIONS,
  M5_NETWORK_NODES,
  M5_NETWORK_CONNECTIONS,
} from '../config/manifestoContent';
import { computeNetworkState } from '../utils/networkPose';
import type { createNetworkStage } from '../three/createNetworkStage';
import { MapPin, Radio, Activity, Compass, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const NetworkSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [activeNodeId, setActiveNodeId] = useState<string>('foggia');
  const [is3DReady, setIs3DReady] = useState(false);
  const [has3DError, setHas3DError] = useState(false);

  const m5 = MANIFESTO_SECTIONS[4];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const stageContainer = stageContainerRef.current;
    if (!section || !pin || !stageContainer) return;

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
        let stage: ReturnType<typeof createNetworkStage> | undefined;
        let tween: gsap.core.Tween | undefined;
        let refreshId = 0;
        const driver = { progress: reduced ? 1.0 : 0 };

        const updateState = () => {
          stage?.setProgress(driver.progress);
          const state = computeNetworkState(driver.progress);
          setActiveNodeId(state.activeNodeId);
          section.dataset.m5Progress = driver.progress.toFixed(3);
        };

        import('../three/createNetworkStage')
          .then(({ createNetworkStage }) => {
            if (!active) return;
            stage = createNetworkStage(stageContainer, {
              mobile,
              reducedMotion: reduced,
              onReady: () => {
                if (!active) return;
                setIs3DReady(true);
                updateState();
                refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());
              },
              onError: (err, fatal) => {
                console.warn('Network stage fallback notice:', err);
                if (fatal) setHas3DError(true);
              },
            });
            updateState();
          })
          .catch((err) => {
            console.warn('Could not initialize network 3D stage:', err);
            setHas3DError(true);
          });

        if (!reduced) {
          const scrollDistance = pin.clientHeight * (mobile ? 1.0 : 1.6);

          tween = gsap.to(driver, {
            progress: 1.0,
            ease: 'none',
            onUpdate: updateState,
            scrollTrigger: {
              id: 'manifesto-m5-network',
              trigger: pin,
              pin: !mobile,
              pinSpacing: !mobile,
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
              invalidateOnRefresh: true,
            },
          });
        } else {
          updateState();
        }

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
      id="m5"
      className="w-full py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F5F6F7] text-[#081C33] border-b border-[#081C33]/10 relative"
      aria-labelledby="m5-heading"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Title & Introduction in normal document flow */}
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B4584]" />
            {m5.kicker}
          </div>
          <h2
            id="m5-heading"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-[#081C33] tracking-tight leading-[1.08]"
          >
            {m5.title}
          </h2>
          <p className="text-xl sm:text-2xl text-[#0B4584] font-medium leading-relaxed">
            {m5.subtitle}
          </p>
          <div className="space-y-3 text-base sm:text-lg text-[#081C33]/80 leading-relaxed font-sans pt-2">
            <p>{m5.body[0]}</p>
            <p>{m5.body[1]}</p>
          </div>
        </div>

        {/* 3D Conceptual Network Architectural Board */}
        <div
          ref={pinRef}
          className="relative w-full h-[75vh] min-h-[520px] max-h-[820px] bg-white border border-[#081C33]/15 shadow-xl overflow-hidden flex flex-col justify-between"
        >
          {/* WebGL Canvas Container */}
          <div
            ref={stageContainerRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
              is3DReady && !has3DError ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Fallback Static SVG Schematic (rendered when WebGL fails or loading) */}
          {(!is3DReady || has3DError) && (
            <div className="absolute inset-0 w-full h-full p-8 flex items-center justify-center bg-white">
              <svg viewBox="0 0 100 100" className="w-full h-full max-h-[500px]" preserveAspectRatio="none">
                {M5_NETWORK_CONNECTIONS.map((conn, i) => {
                  const s = M5_NETWORK_NODES.find((n) => n.id === conn.from);
                  const t = M5_NETWORK_NODES.find((n) => n.id === conn.to);
                  if (!s || !t) return null;
                  return (
                    <line
                      key={i}
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="#0B4584"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                  );
                })}
                {M5_NETWORK_NODES.map((n) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={n.isHub ? 4.5 : 3.0}
                    fill={n.isHub ? '#E31E24' : '#0B4584'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>
          )}

          {/* Top Header Overlay: Discreet "Schema di rete" caption */}
          <div className="relative z-10 p-6 sm:p-8 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="bg-white/95 backdrop-blur-sm border border-[#081C33]/15 px-3.5 py-2 shadow-sm text-[#081C33]">
              <span className="text-[11px] font-mono-tech uppercase tracking-widest text-[#0B4584] font-bold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#E31E24]" />
                SCHEMA DI RETE // MODELLO ARCHITETTONICO CONCETTUALE
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-[#081C33]/15 px-3 py-1.5 text-xs font-mono-tech text-[#081C33]/70 shadow-sm">
              <span className="text-[#081C33]/50">HUB:</span>
              <span className="font-semibold text-[#E31E24]">FOGGIA (ALIDAUNIA)</span>
            </div>
          </div>

          {/* Bottom Overlay: Responsive 6-Node Legend Bar */}
          <div className="relative z-10 p-4 sm:p-8 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md border border-[#081C33]/15 shadow-lg p-4 sm:p-6 pointer-events-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#081C33]/10 text-xs font-mono-tech">
                <span className="font-bold text-[#081C33] uppercase">
                  LEGENDA NODI &amp; COLLEGAMENTI REGIONALI
                </span>
                <span className="text-[11px] text-[#0B4584]">
                  6 NODI OPERATIVI // 7 CORRIDOI
                </span>
              </div>

              {/* Responsive Node Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {M5_NETWORK_NODES.map((n) => {
                  const isActive = n.id === activeNodeId;
                  return (
                    <div
                      key={n.id}
                      className={`p-2.5 border transition-all text-left ${
                        n.isHub
                          ? 'bg-[#E31E24]/5 border-[#E31E24]/30'
                          : isActive
                          ? 'bg-[#0B4584]/5 border-[#0B4584]/40'
                          : 'bg-[#F5F6F7] border-[#081C33]/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            n.isHub ? 'bg-[#E31E24]' : 'bg-[#0B4584]'
                          }`}
                        />
                        <span
                          className={`text-xs font-display font-bold truncate ${
                            n.isHub ? 'text-[#E31E24]' : 'text-[#081C33]'
                          }`}
                        >
                          {n.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#081C33]/70 truncate font-sans">
                        {n.role}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Complete 6-Node Role List in Semantic HTML below the 3D scene */}
        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <span className="text-xs font-mono-tech uppercase tracking-widest text-[#0B4584] font-bold">
              TOPOLOGIA DI RETE E NODI DI COLLEGAMENTO
            </span>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#081C33]">
              I nodi dell&apos;infrastruttura integrata
            </h3>
            <p className="text-base text-[#081C33]/80 max-w-3xl font-sans">
              Ogni punto della rete assolve una specifica funzione operativa, unendo presidi di emergenza sanitaria, approdi territoriali insulari e rotte strategiche di linea.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {M5_NETWORK_NODES.map((node) => (
              <div
                key={node.id}
                className={`p-6 border shadow-sm transition-all flex flex-col justify-between ${
                  node.isHub
                    ? 'bg-white border-[#E31E24] ring-1 ring-[#E31E24]/30'
                    : 'bg-white border-[#081C33]/10 hover:border-[#0B4584]/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-mono-tech uppercase tracking-widest font-bold px-2 py-0.5 border ${
                        node.isHub
                          ? 'bg-[#E31E24] text-white border-[#E31E24]'
                          : 'bg-[#F5F6F7] text-[#0B4584] border-[#081C33]/10'
                      }`}
                    >
                      {node.isHub ? 'HUB CENTRALE' : 'NODO DI RETE'}
                    </span>
                    <MapPin
                      className={`w-4 h-4 ${
                        node.isHub ? 'text-[#E31E24]' : 'text-[#0B4584]'
                      }`}
                    />
                  </div>

                  <h4 className="font-display font-bold text-xl text-[#081C33]">
                    {node.name}
                  </h4>

                  <p className="text-sm text-[#081C33]/80 font-sans leading-relaxed">
                    {node.role}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#081C33]/10 flex items-center justify-between text-[11px] font-mono-tech text-[#081C33]/60">
                  <span>CONNESSIONE DIRETTA</span>
                  <span className="text-[#0B4584] font-bold">ALIDAUNIA SERVICES</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
