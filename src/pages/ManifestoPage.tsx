/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { MANIFESTO_ASSETS } from '../config/assets';
import {
  MANIFESTO_SECTIONS,
  M2_INFRASTRUCTURE_LAYERS,
  M3_PROJECT_PHASES,
  M5_NETWORK_NODES,
  M6_PRINCIPLES,
} from '../config/manifestoContent';
import { HelicopterAssemblyHero } from '../components/HelicopterAssemblyHero';
import { useManifestoChoreography } from '../manifesto/useManifestoChoreography';
import { useManifestoReveals } from '../manifesto/useManifestoReveals';
import type { ChapterId } from '../utils/manifestoChoreography';
import { EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import '../manifesto/manifesto.css';

interface ManifestoPageProps {
  onNavigate?: (route: typeof ROUTES.VISION) => void;
}

/**
 * Progress marks (see utils/manifestoChoreography.ts): `track:value@line[/edge][+gap]`.
 * `data-mf` applies on desktop, `data-mf-sm` on phones and `data-mf-flow` on short screens,
 * where the figures run in normal flow. The values follow the bundled clips: M2's systems
 * begin landing at .44/.50/.57/.64/.71, M3's phases at survey 0, design .2,
 * construction .42 and operation .77.
 */
const M2_SYSTEM_STARTS = [0.44, 0.5, 0.57, 0.64, 0.71];
const M3_PHASE_STARTS = [0, 0.2, 0.42, 0.77];
/** Windows in which each M2 drawing group registers (from the clip), for the matching index accent. */
const M2_SYSTEM_WINDOWS = [[0.425, 0.65], [0.5, 0.725], [0.563, 0.8], [0.638, 0.863], [0.7, 0.938]];
/** Windows in which each M5 node rises (from the clip), for its caption leader. */
const M5_NODE_WINDOWS: Record<string, [number, number]> = {
  foggia: [0.25, 0.45],
  tremiti: [0.288, 0.5],
  vieste: [0.338, 0.55],
  peschici: [0.375, 0.588],
  'san-giovanni': [0.425, 0.638],
  'rete-regionale': [0.475, 0.675],
};

const Kicker: React.FC<{ children: React.ReactNode; route?: boolean }> = ({ children, route }) => (
  <p className="mf-kicker font-mono-tech" data-reveal="block" data-reveal-at="0.05">
    {route ? (
      <span className="mf-kicker__route" aria-hidden="true">
        <span className="mf-kicker__route-start" />
        <span className="mf-kicker__route-end" />
      </span>
    ) : (
      <span className="mf-kicker__dot" aria-hidden="true" />
    )}
    {children}
  </p>
);

/** A heading's words as separate inline boxes, so lines or word groups can enter; the text itself is unchanged. */
const Words: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(' ').map((word, i, all) => (
      <React.Fragment key={i}>
        <span className="mf-w">
          <span className="mf-w__i">{word}</span>
        </span>
        {i < all.length - 1 ? ' ' : null}
      </React.Fragment>
    ))}
  </>
);

const Visual: React.FC<{
  id: ChapterId;
  label: string;
  caption?: string;
  insets: string;
  insetsSmall?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ id, label, caption, insets, insetsSmall, className = '', children }) => (
  <figure className={`mf-visual mf-visual--${id.toLowerCase()} ${className}`} data-mf-slot={id} data-mf-insets={insets} data-mf-insets-sm={insetsSmall}>
    <div className="mf-visual__frame" role="img" aria-label={label}>
      <img className="mf-visual__poster" src={MANIFESTO_ASSETS.chapters[id].poster} alt="" loading="lazy" decoding="async" />
      <canvas className="mf-visual__canvas" aria-hidden="true" />
      {children}
    </div>
    {caption && <figcaption className="mf-visual__caption font-mono-tech">{caption}</figcaption>}
  </figure>
);

export const ManifestoPage: React.FC<ManifestoPageProps> = ({ onNavigate }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Manifesto | ALIDAUNIA SERVICES';
  }, []);

  useManifestoChoreography(rootRef);
  useManifestoReveals(rootRef);

  const m2 = MANIFESTO_SECTIONS[1];
  const m3 = MANIFESTO_SECTIONS[2];
  const m4 = MANIFESTO_SECTIONS[3];
  const m5 = MANIFESTO_SECTIONS[4];
  const m6 = MANIFESTO_SECTIONS[5];

  return (
    <div className="w-full bg-[#F5F6F7] text-[#081C33]">
      {/* M1: AW139 assembly hero, unchanged. */}
      <HelicopterAssemblyHero />

      <div ref={rootRef} className="mf">
        {/* =====================================================================
            M2 — Ogni infrastruttura è un sistema.
            Technical typesetting: a datum draws, heading lines register onto it.
            The centred folio unrolls and its five systems register as the index arrives.
           ===================================================================== */}
        <section id="m2" className="mf-ch mf-ch--navy mf-m2" aria-labelledby="m2-title">
          <div className="mf-wrap">
            <header className="mf-head mf-copy" data-reveal-group>
              <span className="mf-datum" data-reveal="rule" data-reveal-origin="50% 50%" data-reveal-at="0" aria-hidden="true" />
              <Kicker>{m2.kicker}</Kicker>
              <h2 id="m2-title" className="mf-title" data-reveal="lines" data-reveal-at="0.22">
                <Words text={m2.title} />
              </h2>
              <p className="mf-subtitle" data-reveal="block" data-reveal-at="0.55">{m2.subtitle}</p>
            </header>

            <div className="mf-stage" data-mf="M2:0@1, M2:0.43@0.25" data-mf-sm="M2:0@1, M2:0.43@0" data-mf-flow="">
              <div className="mf-figure mf-figure--m2" data-mf-flow="M2:0@1, M2:0.43@0.6, M2:0.96@0.0, M2:1@0.0/0.3">
                <Visual
                  id="M2"
                  label="Illustrazione: un foglio tecnico si srotola e i cinque sistemi dell'infrastruttura si allineano sul disegno."
                  caption="SCHEMA ILLUSTRATIVO"
                  insets="0.05,0.05,0.07,0.05"
                  insetsSmall="0.06,0.04,0.1,0.04"
                />
              </div>
              <div className="mf-stage__content mf-copy">
                <div className="mf-band mf-band--two" data-reveal-group>
                  {m2.body.map((paragraph, i) => (
                    <p key={i} data-reveal="block" data-reveal-at={String(i * 0.07)}>{paragraph}</p>
                  ))}
                </div>
                <ol className="mf-matrix" aria-label="Livelli del sistema">
                  {M2_INFRASTRUCTURE_LAYERS.map((layer, i) => {
                    const last = i === M2_INFRASTRUCTURE_LAYERS.length - 1;
                    // Columns of a row register in reading order, a short step apart, as the row enters.
                    const line = (i < 3 ? [0.96, 0.84, 0.72][i] : [0.96, 0.84][i - 3]).toFixed(2);
                    return (
                      <li
                        key={layer.id}
                        className="mf-matrix__item"
                        data-mf-sync={`M2:${M2_SYSTEM_WINDOWS[i][0]}:${M2_SYSTEM_WINDOWS[i][1]}`}
                        data-mf={`M2:${M2_SYSTEM_STARTS[i]}@${line}+0.1${last ? ', M2:0.96@0.98/1+0.14, M2:1@0.85/1' : ''}`}
                        data-mf-sm={`M2:${M2_SYSTEM_STARTS[i]}@0.97+0.06${last ? ', M2:0.96@0.99/1+0.1, M2:1@0.9/1' : ''}`}
                        data-mf-flow=""
                        data-reveal-group
                      >
                        <span className="mf-matrix__rule" aria-hidden="true" />
                        <h3 className="mf-matrix__name" data-reveal="block" data-reveal-at="0">{layer.name}</h3>
                        <p className="mf-matrix__text" data-reveal="block" data-reveal-at="0.08">{layer.description}</p>
                      </li>
                    );
                  })}
                </ol>
                <span className="mf-end-rule mf-m2__end-rule" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            M3 — Scegli un approccio integrato.
            Structural plane-settle heading; the centred site develops through the four
            phases while the phase rail and blocks below follow it.
           ===================================================================== */}
        <section id="m3" className="mf-ch mf-ch--light mf-m3" aria-labelledby="m3-title" data-mf="M2_M3:0@0.94, M2_M3:1@0.32">
          <div className="mf-wrap">
            <header className="mf-head mf-copy" data-reveal-group>
              <Kicker>{m3.kicker}</Kicker>
              <h2 id="m3-title" className="mf-title" data-reveal="plane" data-reveal-at="0.1">{m3.title}</h2>
              <span className="mf-phase-line" data-reveal="rule" data-reveal-at="0.35" data-reveal-duration="0.7" aria-hidden="true" />
              <p className="mf-subtitle" data-reveal="block" data-reveal-at="0.5">{m3.subtitle}</p>
            </header>

            <div className="mf-stage" data-mf-flow="">
              <div className="mf-figure mf-figure--m3" data-mf-flow="M3:0@1, M3:0.2@0.75, M3:0.42@0.5, M3:0.77@0.25, M3:1@0.0/0.3">
                <Visual
                  id="M3"
                  label="Illustrazione: un unico sito di atterraggio si sviluppa attraverso analisi, progetto, realizzazione e gestione."
                  caption="MODELLO ILLUSTRATIVO · CICLO INTEGRATO"
                  insets="0.05,0.05,0.05,0.05"
                  insetsSmall="0.05,0.05,0.07,0.05"
                />
                <ol className="mf-rail" aria-hidden="true">
                  {M3_PROJECT_PHASES.map((phase, i) => (
                    <li key={phase.number} className="mf-rail__step" data-mf-sync={`M3:${M3_PHASE_STARTS[i]}:${M3_PHASE_STARTS[i + 1] ?? 1.01}`}>
                      <span className="mf-rail__bar" />
                      <span className="mf-rail__label font-mono-tech">
                        {phase.number}
                        <span className="mf-rail__name"> · {phase.title}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mf-stage__content mf-copy">
                <div className="mf-band mf-band--two" data-reveal-group>
                  <p data-reveal="block" data-reveal-at="0">{m3.body[0]}</p>
                  <p data-reveal="block" data-reveal-at="0.08">{m3.body[1]}</p>
                </div>
                <ol className="mf-phases">
                  {M3_PROJECT_PHASES.map((phase, i) => {
                    const last = i === M3_PROJECT_PHASES.length - 1;
                    return (
                      <li
                        key={phase.number}
                        className="mf-phase"
                        data-mf-sync={`M3:${M3_PHASE_STARTS[i]}:${M3_PHASE_STARTS[i + 1] ?? 1.01}`}
                        data-mf={`M3:${M3_PHASE_STARTS[i]}@0.92+0.1${last ? ', M3:1@0.97/1+0.12' : ''}`}
                        data-mf-sm={`M3:${M3_PHASE_STARTS[i]}@0.97+0.1${last ? ', M3:1@0.99/1+0.12' : ''}`}
                        data-mf-flow=""
                        data-reveal-group
                      >
                        <div className="mf-phase__head">
                          <p className="mf-phase__number font-mono-tech">FASE {phase.number}</p>
                          <h3 className="mf-phase__title">{phase.title}</h3>
                        </div>
                        <div className="mf-phase__body" data-reveal="block" data-reveal-at="0.05">
                          <p className="mf-phase__text">{phase.description}</p>
                          <ul className="mf-phase__details">
                            {phase.details.map((item, d) => (
                              <li key={d}>
                                <CheckCircle2 className="mf-phase__check" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            M4 — Affidati all'esperienza.
            Directional words travel one way and stop; the tall instrument stands on the axis.
           ===================================================================== */}
        <section id="m4" className="mf-ch mf-ch--navy mf-m4" aria-labelledby="m4-title" data-mf="M3_M4:0@1, M3_M4:1@0.5">
          <div className="mf-m4__navy" aria-hidden="true" />
          <div className="mf-wrap">
            <header className="mf-head mf-copy" data-reveal-group>
              <Kicker>{m4.kicker}</Kicker>
              <h2 id="m4-title" className="mf-title mf-title--large" data-reveal="words" data-reveal-at="0.1">
                <Words text={m4.title} />
              </h2>
              <p className="mf-subtitle" data-reveal="block-x" data-reveal-at="0.4">{m4.subtitle}</p>
            </header>
            <div className="mf-m4__visual" data-mf="M4:0@0.92, M4:1@0.45/0.5" data-mf-sm="M4:0@1, M4:1@0.5/0.5">
              <Visual
                id="M4"
                label="Illustrazione: una manica a vento si distende e si orienta mentre l'anemometro risponde."
                caption="MODELLO ILLUSTRATIVO"
                insets="0.04,0.06,0.03,0.06"
                insetsSmall="0.04,0.08,0.03,0.08"
              />
            </div>
            <div className="mf-band mf-band--two mf-band--m4 mf-copy" data-reveal-group>
              <p data-reveal="block-x" data-reveal-at="0">{m4.body[0]}</p>
              <p data-reveal="block-x" data-reveal-at="0.12">{m4.body[1]}</p>
              <span className="mf-end-rule mf-m4__rule" data-reveal="rule" data-reveal-at="0.1" data-reveal-duration="0.8" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* =====================================================================
            M5 — Una rete, una visione d'insieme.
            A connection-like underline resolves under the title; the centred atlas opens;
            each caption's leader draws as its node rises.
           ===================================================================== */}
        <section id="m5" className="mf-ch mf-ch--light mf-m5" aria-labelledby="m5-title" data-mf="M4_M5:0@0.96, M4_M5:1@0.4">
          <div className="mf-wrap">
            <header className="mf-head mf-copy" data-reveal-group>
              <Kicker route>{m5.kicker}</Kicker>
              <h2 id="m5-title" className="mf-title" data-reveal="block" data-reveal-at="0.1">{m5.title}</h2>
              <span className="mf-connect" data-reveal="connect" data-reveal-at="0.3" aria-hidden="true">
                <span className="mf-connect__dot mf-connect__dot--a" />
                <span className="mf-connect__line" />
                <span className="mf-connect__dot mf-connect__dot--b" />
              </span>
              <p className="mf-subtitle" data-reveal="block" data-reveal-at="0.55">{m5.subtitle}</p>
            </header>

            <div className="mf-m5__atlas" data-mf="M5:0@0.95, M5:1@0.4/0.5" data-mf-sm="M5:0@1, M5:1@0.5/0.5">
              <Visual
                id="M5"
                label="Illustrazione: un atlante schematico si apre e collega i sei nodi della rete."
                caption="SCHEMA ILLUSTRATIVO · NON GEOREFERENZIATO"
                insets="0.01,0.08,0.05,0.08"
                insetsSmall="0.05,0.04,0.08,0.04"
              >
                <div className="mf-node-labels" aria-hidden="true">
                  {M5_NETWORK_NODES.map((node, i) => (
                    <span key={node.id} className={`mf-node-label mf-node-label--${node.id}${node.isHub ? ' mf-node-label--hub' : ''}`} data-mf-node={node.id}>
                      <span className="mf-node-label__num font-mono-tech">{String(i + 1).padStart(2, '0')}</span>
                      <span className="mf-node-label__name">{node.name}</span>
                    </span>
                  ))}
                </div>
              </Visual>
            </div>

            <div className="mf-nodes mf-copy">
              <div className="mf-nodes__head font-mono-tech">
                <span>TOPOLOGIA DI RETE E NODI DI COLLEGAMENTO</span>
                <span className="mf-nodes__hub">HUB CENTRALE: FOGGIA</span>
              </div>
              <ol className="mf-nodes__list">
                {M5_NETWORK_NODES.map((node, i) => (
                  <li
                    key={node.id}
                    className={`mf-node${node.isHub ? ' mf-node--hub' : ''}`}
                    data-mf-sync={`M5:${M5_NODE_WINDOWS[node.id][0]}:${M5_NODE_WINDOWS[node.id][1]}`}
                    data-reveal-group
                  >
                    <span className="mf-node__leader" aria-hidden="true" />
                    <span className="mf-node__num font-mono-tech" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mf-node__text" data-reveal="block" data-reveal-at={String((i % 3) * 0.06)}>
                      <span className="mf-node__name">{node.name}</span>
                      <span className="mf-node__role">{node.role}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mf-band mf-band--two mf-copy" data-reveal-group>
              <p data-reveal="block" data-reveal-at="0">{m5.body[0]}</p>
              <p data-reveal="block" data-reveal-at="0.08">{m5.body[1]}</p>
              <span className="mf-end-rule" data-reveal="rule" data-reveal-origin="50% 50%" data-reveal-at="0.15" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* =====================================================================
            M6 — I principi che guidano ogni progetto.
            The heading registers on a red/blue baseline; the mark assembles once and holds;
            three principles and the actions close the page.
           ===================================================================== */}
        <section id="m6" className="mf-ch mf-ch--white mf-m6" aria-labelledby="m6-title" data-mf="M5_M6:0@0.95, M5_M6:1@0.42">
          <div className="mf-wrap">
            <header className="mf-head mf-copy" data-reveal-group>
              <Kicker>{m6.kicker}</Kicker>
              <h2 id="m6-title" className="mf-title" data-reveal="rise" data-reveal-at="0.1">{m6.title}</h2>
              <span className="mf-register" data-reveal="register" data-reveal-at="0.25" aria-hidden="true">
                <span className="mf-register__red" />
                <span className="mf-register__blue" />
              </span>
              <p className="mf-subtitle" data-reveal="block" data-reveal-at="0.5">{m6.subtitle}</p>
            </header>

            <div className="mf-m6__mark" data-mf="M6:0@0.95, M6:1@0.5/0.5" data-mf-sm="M6:0@1, M6:1@0.55/0.5">
              <Visual id="M6" label="Il marchio Alidaunia Services in rilievo." insets="0.06,0.1,0.06,0.1" insetsSmall="0.06,0.12,0.06,0.12" />
            </div>

            <div className="mf-band mf-band--center mf-copy" data-reveal-group>
              <p data-reveal="block" data-reveal-at="0">{m6.body[0]}</p>
              <p data-reveal="block" data-reveal-at="0.08">{m6.body[1]}</p>
            </div>

            <ol className="mf-principles mf-copy" data-reveal-group>
              {M6_PRINCIPLES.map((principle, i) => (
                <li key={principle.title} className={`mf-principle mf-principle--${i + 1}`}>
                  <span className="mf-principle__rule" data-reveal="rule" data-reveal-at={String(i * 0.09)} aria-hidden="true" />
                  <div className="mf-principle__head" data-reveal="rise" data-reveal-at={String(0.08 + i * 0.09)}>
                    <p className="mf-principle__number font-mono-tech">PRINCIPIO 0{i + 1}</p>
                    <h3 className="mf-principle__title">{principle.title}</h3>
                  </div>
                  <p className="mf-principle__text" data-reveal="block" data-reveal-at={String(0.2 + i * 0.09)}>{principle.description}</p>
                </li>
              ))}
            </ol>

            {/* Actions are never animated: usable the moment they are on screen. */}
            <div className="mf-actions mf-copy">
              <div>
                <p className="mf-actions__kicker font-mono-tech">APPROFONDIMENTO STRATEGICO</p>
                <p className="mf-actions__title">Scopri i valori e la missione aziendale</p>
              </div>
              <div className="mf-actions__buttons">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate?.(ROUTES.VISION);
                  }}
                  className="mf-button mf-button--primary font-mono-tech"
                >
                  <span>Vision, Mission e Valori</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <a href={EXTERNAL_LINKS.CONTACTS} target="_blank" rel="noopener noreferrer" className="mf-button mf-button--secondary font-mono-tech">
                  <span>Contatta il Team Tecnico</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Boundary cues, drawn in the page's own coordinates; text always sits above them. */}
        <svg className="mf-cues" aria-hidden="true" focusable="false">
          <defs>
            {/* Light ink while a line crosses navy, brand blue once it reaches the off-white chapter. */}
            <linearGradient id="mf-datum-ink" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7FA7D6" />
              <stop offset="1" stopColor="#0B4584" />
            </linearGradient>
            <linearGradient id="mf-wind-ink" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#9BBCE2" />
              <stop offset="1" stopColor="#0B4584" />
            </linearGradient>
          </defs>
          <g className="mf-cue mf-cue--datum">
            <path data-cue-part="datum-main" stroke="url(#mf-datum-ink)" strokeWidth="2" />
            <path data-cue-part="datum-left" stroke="#0B4584" strokeWidth="2" />
            <path data-cue-part="datums" stroke="#0B4584" strokeWidth="2" />
            <path data-cue-part="register" stroke="#E31E24" strokeWidth="3" />
          </g>
          <g className="mf-cue mf-cue--lens">
            <path data-cue-part="lens-in" stroke="#0B4584" strokeWidth="2" />
            <path data-cue-part="lens-out" stroke="#F5F6F7" strokeWidth="2" />
            <circle data-cue-part="lens-ring" stroke="#25C39B" strokeWidth="3" fill="none" />
            <circle data-cue-part="lens-core" fill="#25C39B" stroke="none" />
          </g>
          <g className="mf-cue mf-cue--wind">
            <path data-cue-part="wind-route" stroke="url(#mf-wind-ink)" strokeWidth="2" />
            <circle data-cue-part="wind-start" r="5" fill="#E31E24" stroke="none" />
            <circle data-cue-part="wind-end" r="5" fill="#0B4584" stroke="none" />
          </g>
          <g className="mf-cue mf-cue--registration">
            <path data-cue-part="reg-datum" stroke="#0B4584" strokeWidth="2" />
            <path data-cue-part="reg-guides" stroke="#0B4584" strokeWidth="2" />
            <path data-cue-part="reg-cross" stroke="#E31E24" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
};
