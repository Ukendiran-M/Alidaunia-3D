/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  VISION_SECTIONS,
  V3_MISSION_GROUPS,
  V4_DESIGN_PILLARS,
  V5_RELATIONSHIP_VALUES,
} from '../config/visionContent';
import { EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import { READ_END } from '../utils/visionJourney';
import { useVisionJourney } from '../vision/useVisionJourney';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import '../vision/visionJourney.css';

interface VisionPageProps {
  onNavigate?: (route: typeof ROUTES.MANIFESTO) => void;
}

/** Journey positions at which each reading group / design value is centred (see utils/visionJourney). */
const V3_GROUP_MARKS = [2.12, 2.32, 2.48];
const V4_PILLAR_MARKS = [3.06, 3.22, 3.38, 3.54];

const V5_ENTITIES = [
  { label: 'ENTITÀ 01', name: 'Cliente', text: 'Enti pubblici, strutture sanitarie, committenti privati.' },
  { label: 'ENTITÀ 02', name: 'Progetto', text: 'Ingegneria di precisione, conformità aeronautica, opere civili.' },
  { label: 'ENTITÀ 03', name: 'Gestione', text: 'Manutenzione continua, protocolli HEMS, supporto operativo.' },
];

/**
 * Transition length per boundary, in visible heights, scaled to that boundary's camera work
 * (V1→V2 19.5 m / 150°, V2→V3 17.2 m / 146°, V3→V4 14.2 m / 91°, V4→V5 12.2 m / 161°,
 * V5→V6 23.5 m / 262°). The transition starts  as the outgoing copy reaches 35 % of the view and
 * ends as the incoming chapter's top reaches 28 %, so the next heading rises in during the handoff.
 */
const TRANSITION_LENGTH = [0.85, 0.9, 0.72, 0.78, 0.92];
const START_LINE = 0.35;
const INCOMING_LINE = 0.28;

/** The spacer under each chapter: only what its transition needs beyond the two lines above. */
const Passage: React.FC<{ chapter: number }> = ({ chapter }) => (
  <div
    className="vj-passage"
    style={{ '--vj-passage': TRANSITION_LENGTH[chapter] - (START_LINE - INCOMING_LINE) } as React.CSSProperties}
    data-journey-mark={chapter + READ_END}
    data-journey-line={START_LINE}
    aria-hidden="true"
  />
);

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="vj-kicker font-mono-tech">
    <span aria-hidden="true" />
    {children}
  </div>
);

export const VisionPage: React.FC<VisionPageProps> = ({ onNavigate }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const status = useVisionJourney(rootRef, hostRef);

  useEffect(() => {
    document.title = 'Vision, Mission e Valori | ALIDAUNIA SERVICES';
  }, []);

  const [v1, v2, v3, v4, v5, v6] = VISION_SECTIONS;

  return (
    <div ref={rootRef} className="vj" data-world={status} data-chapter="1">
      {/* One persistent, route-scoped backdrop. Decorative: every word and action lives in the HTML below. */}
      <div className="vj-backdrop" aria-hidden="true">
        <div className="vj-backdrop__fallback" />
        <div ref={hostRef} className="vj-backdrop__canvas" />
      </div>

      {/* V1 — dark aviation threshold */}
      <section id="v1" className="vj-chapter" data-tone="dark" data-journey-mark="0" aria-labelledby="v1-title">
        <div className="vj-frame vj-frame--hero">
          <div className="vj-copy">
            <div className="vj-pill font-mono-tech">
              <span aria-hidden="true" />
              ALIDAUNIA SERVICES • VISIONE &amp; MISSIONE
            </div>
            <h1 id="v1-title" className="vj-display">{v1.title}</h1>
            <p className="vj-subtitle">{v1.subtitle}</p>
            <div className="vj-body vj-body--split">
              <p>{v1.body[0]}</p>
              <p>{v1.body[1]}</p>
            </div>
          </div>
          <div className="vj-hero-foot font-mono-tech">
            <span>SCORRI PER ESPLORARE I VALORI</span>
            <a href="#v2" aria-label="Scorri alla sezione successiva">
              <span>V2: Valore nel Tempo</span>
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        <Passage chapter={0} />
      </section>

      {/* V2 — board-formed concrete gallery */}
      <section id="v2" className="vj-chapter" data-tone="light" data-journey-mark="1" data-journey-line={INCOMING_LINE} aria-labelledby="v2-title">
        <div className="vj-frame vj-frame--right">
          <div className="vj-copy vj-copy--right">
            <Kicker>{v2.kicker}</Kicker>
            <h2 id="v2-title" className="vj-title">{v2.title}</h2>
            <p className="vj-subtitle">{v2.subtitle}</p>
            <div className="vj-body">
              <p>{v2.body[0]}</p>
              <p>{v2.body[1]}</p>
            </div>
          </div>
          <div className="vj-copy vj-copy--right vj-copy--follow">
            <h3 className="vj-subhead">Dalla Geometria al Manufatto</h3>
            <p className="vj-body-text">
              La transizione dalla linea progettuale alla piastra operativa mira a garantire solidità, funzionalità e piena coerenza con le esigenze del volo verticale.
            </p>
            <ul className="vj-checks">
              <li>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Attenzione alla qualità dei materiali e alla durata nel tempo</span>
              </li>
              <li>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Soluzioni studiate per la sicurezza e la funzionalità operativa</span>
              </li>
            </ul>
          </div>
        </div>
        <Passage chapter={1} />
      </section>

      {/* V3 — seven glazed thresholds in three reading zones (3 + 2 + 2) */}
      <section id="v3" className="vj-chapter" data-tone="light" data-journey-mark="2" data-journey-line={INCOMING_LINE} aria-labelledby="v3-title">
        <div className="vj-frame">
          <div className="vj-copy">
            <Kicker>{v3.kicker}</Kicker>
            <h2 id="v3-title" className="vj-title">{v3.title}</h2>
            <p className="vj-subtitle">{v3.subtitle}</p>
            <div className="vj-body">
              <p>{v3.body[0]}</p>
              <p>{v3.body[1]}</p>
            </div>
          </div>

          <ol className="vj-groups" aria-label="I sette punti della Mission">
            {V3_MISSION_GROUPS.map((group, gIdx) => (
              <li
                key={group.id}
                className="vj-copy vj-group"
                data-journey-mark={V3_GROUP_MARKS[gIdx]}
                data-journey-line="0.62"
              >
                <div className="vj-group__head">
                  <span className="vj-group__badge font-mono-tech">{group.badge}</span>
                  <h3 className="vj-subhead">{group.name}</h3>
                  <span className="vj-group__count font-mono-tech">{group.points.length} OBIETTIVI OPERATIVI</span>
                </div>
                <ol className="vj-points">
                  {group.points.map((point) => (
                    <li key={point.number}>
                      <span className="vj-points__number font-mono-tech">PUNTO {point.number}</span>
                      <h4>{point.text}</h4>
                      <p>{point.detail}</p>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>
        <Passage chapter={2} />
      </section>

      {/* V4 — carbon-composite precision vault: four calibrated folds */}
      <section id="v4" className="vj-chapter" data-tone="dark" data-journey-mark="3" data-journey-line={INCOMING_LINE} aria-labelledby="v4-title">
        <div className="vj-frame vj-frame--right">
          <div className="vj-copy vj-copy--right">
            <Kicker>{v4.kicker}</Kicker>
            <h2 id="v4-title" className="vj-title">{v4.title}</h2>
            <p className="vj-subtitle">{v4.subtitle}</p>
            <div className="vj-body">
              <p>{v4.body[0]}</p>
              <p>{v4.body[1]}</p>
            </div>
          </div>
          <ol className="vj-pillars" aria-label="I quattro pilastri">
            {V4_DESIGN_PILLARS.map((pillar, idx) => (
              <li
                key={pillar.id}
                className="vj-copy vj-copy--right vj-pillar"
                data-journey-mark={V4_PILLAR_MARKS[idx]}
                data-journey-line="0.62"
              >
                <span className="vj-pillar__index font-mono-tech">PILASTRO 0{idx + 1}</span>
                <h3 className="vj-pillar__title">{pillar.title}</h3>
                <p className="vj-pillar__focus font-mono-tech">{pillar.focus}</p>
                <p className="vj-body-text">{pillar.description}</p>
              </li>
            ))}
          </ol>
        </div>
        <Passage chapter={3} />
      </section>

      {/* V5 — one tensile canopy held by Cliente, Progetto and Gestione */}
      <section id="v5" className="vj-chapter" data-tone="light" data-journey-mark="4" data-journey-line={INCOMING_LINE} aria-labelledby="v5-title">
        <div className="vj-frame">
          <div className="vj-copy">
            <Kicker>{v5.kicker}</Kicker>
            <h2 id="v5-title" className="vj-title">{v5.title}</h2>
            <p className="vj-subtitle">{v5.subtitle}</p>
            <div className="vj-body">
              <p>{v5.body[0]}</p>
              <p>{v5.body[1]}</p>
            </div>
          </div>
          <div className="vj-copy vj-copy--follow">
            <ul className="vj-entities">
              {V5_ENTITIES.map((entity) => (
                <li key={entity.name}>
                  <span className="font-mono-tech">{entity.label}</span>
                  <h3>{entity.name}</h3>
                  <p>{entity.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="vj-copy vj-copy--follow">
            <h3 className="vj-values__label font-mono-tech">I QUATTRO VALORI RELAZIONALI</h3>
            <ul className="vj-values">
              {V5_RELATIONSHIP_VALUES.map((value) => (
                <li key={value.title}>
                  <h4>{value.title}</h4>
                  <p>{value.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Passage chapter={4} />
      </section>

      {/* V6 — luminous ceramic horizon and enquiry */}
      <section id="v6" className="vj-chapter vj-chapter--last" data-tone="light" data-journey-mark="5" data-journey-line={INCOMING_LINE} aria-labelledby="v6-title">
        <div className="vj-frame">
          <div className="vj-copy">
            <Kicker>{v6.kicker}</Kicker>
            <h2 id="v6-title" className="vj-title">{v6.title}</h2>
            <p className="vj-subtitle">{v6.subtitle}</p>
            <div className="vj-body">
              <p>{v6.body[0]}</p>
              <p>{v6.body[1]}</p>
            </div>
          </div>

          <div className="vj-callout">
            <span className="vj-callout__tag font-mono-tech">CONTATTO DIRETTO INGEGNERIA AERONAUTICA</span>
            <h3>Hai un progetto di elisuperficie, eliporto o vertiporto da realizzare?</h3>
            <p>
              Il nostro team di ingegneri e specialisti operativi è a disposizione per valutazioni di fattibilità, consulenze normative e pianificazione strategica.
            </p>
            <div className="vj-callout__actions">
              <a href={EXTERNAL_LINKS.CONTACTS} target="_blank" rel="noopener noreferrer" className="vj-button vj-button--primary font-mono-tech">
                <span>Invia una Richiesta Tecnica</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate?.(ROUTES.MANIFESTO);
                }}
                className="vj-button vj-button--secondary font-mono-tech"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Torna al Manifesto</span>
              </button>
            </div>
          </div>
          {/* The final pose settles as the end of the contact panel comes fully into view (not after it). */}
          <div className="vj-settle" data-journey-mark="6" data-journey-line="0.92" data-journey-min="0.25" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
};
