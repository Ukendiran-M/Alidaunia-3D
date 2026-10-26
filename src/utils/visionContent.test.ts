import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  VISION_SECTIONS,
  V3_MISSION_GROUPS,
  V4_DESIGN_PILLARS,
  V5_RELATIONSHIP_VALUES,
} from '../config/visionContent';

const page = readFileSync(new URL('../pages/VisionPage.tsx', import.meta.url), 'utf8');

test('six chapters keep their anchors, titles, subtitles and both body paragraphs', () => {
  assert.deepEqual(VISION_SECTIONS.map((s) => s.id), ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']);
  for (const section of VISION_SECTIONS) {
    assert.ok(section.title && section.subtitle);
    assert.equal(section.body.length, 2);
    assert.ok(page.includes(`id="${section.id}"`), `missing anchor #${section.id}`);
  }
  // Every chapter renders title, subtitle and both paragraphs (V4 body was previously omitted).
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']) {
    for (const field of ['.subtitle}', '.body[0]}', '.body[1]}']) assert.ok(page.includes(`{${v}${field}`), `${v}${field} not rendered`);
  }
});

test('seven Mission points keep their 3 + 2 + 2 grouping and detail sentences', () => {
  assert.deepEqual(
    V3_MISSION_GROUPS.map((g) => [g.name, g.points.map((p) => p.text)]),
    [
      ['Comprendere e innovare', ['Dinamiche di mercato', 'Nuove idee', 'Salda memoria']],
      ['Progettare e costruire', ['Costruire bene', 'Sviluppo eco-sostenibile']],
      ['Seguire e migliorare', ['Orientamento alla qualità', 'Soddisfazione del cliente']],
    ],
  );
  for (const group of V3_MISSION_GROUPS) for (const point of group.points) assert.ok(point.detail.length > 40);
  for (const token of ['V3_MISSION_GROUPS.map', 'group.points.map', '{point.text}', '{point.detail}', '{group.badge}']) assert.ok(page.includes(token));
});

test('eight values: four design pillars and four relationship values, fully rendered', () => {
  assert.deepEqual(V4_DESIGN_PILLARS.map((p) => p.title), ['Esperienza', 'Tecnologia', 'Dinamismo', 'Modernità']);
  assert.deepEqual(V5_RELATIONSHIP_VALUES.map((v) => v.title), ['Assistenza', 'Professionalità', 'Integrazione', 'Trasparenza']);
  for (const token of ['{pillar.title}', '{pillar.focus}', '{pillar.description}', '{value.title}', '{value.desc}']) assert.ok(page.includes(token));
});

test('page-two hardcoded copy and actions are preserved', () => {
  const preserved = [
    'ALIDAUNIA SERVICES • VISIONE &amp; MISSIONE',
    'SCORRI PER ESPLORARE I VALORI',
    'V2: Valore nel Tempo',
    'href="#v2"',
    'Dalla Geometria al Manufatto',
    'La transizione dalla linea progettuale alla piastra operativa mira a garantire solidità, funzionalità e piena coerenza con le esigenze del volo verticale.',
    'Attenzione alla qualità dei materiali e alla durata nel tempo',
    'Soluzioni studiate per la sicurezza e la funzionalità operativa',
    'OBIETTIVI OPERATIVI',
    'PUNTO {point.number}',
    "'ENTITÀ 01', name: 'Cliente', text: 'Enti pubblici, strutture sanitarie, committenti privati.'",
    "'ENTITÀ 02', name: 'Progetto', text: 'Ingegneria di precisione, conformità aeronautica, opere civili.'",
    "'ENTITÀ 03', name: 'Gestione', text: 'Manutenzione continua, protocolli HEMS, supporto operativo.'",
    'I QUATTRO VALORI RELAZIONALI',
    'CONTATTO DIRETTO INGEGNERIA AERONAUTICA',
    'Hai un progetto di elisuperficie, eliporto o vertiporto da realizzare?',
    'Il nostro team di ingegneri e specialisti operativi è a disposizione per valutazioni di fattibilità, consulenze normative e pianificazione strategica.',
    'href={EXTERNAL_LINKS.CONTACTS}',
    'Invia una Richiesta Tecnica',
    'onNavigate?.(ROUTES.MANIFESTO)',
    'Torna al Manifesto',
  ];
  for (const text of preserved) assert.ok(page.includes(text), `missing: ${text}`);
});

test('retired page-two concepts and helipad imagery are gone', () => {
  for (const retired of ['valuesReference', 'missionReference', 'v2-wireframe', 'helipad', 'louvre', 'gyroscope', 'envelope']) {
    assert.ok(!page.toLowerCase().includes(retired.toLowerCase()), `still references ${retired}`);
  }
});

test('page two is an aviation base: retired material-gallery builders are gone, fallback posters exist', async () => {
  const { readdirSync, existsSync } = await import('node:fs');
  const zones = readdirSync(new URL('../vision/zones/', import.meta.url)).sort();
  assert.deepEqual(zones, ['aircraft.ts', 'annex.ts', 'apron.ts', 'briefing.ts', 'hangar.ts', 'studio.ts']);
  const world = readFileSync(new URL('../vision/createVisionWorld.ts', import.meta.url), 'utf8');
  for (const retired of ['vault', 'canopy', 'horizon', 'gallery', 'glazing']) assert.ok(!world.includes(`zones/${retired}`), `still builds ${retired}`);
  for (let i = 1; i <= 6; i++) assert.ok(existsSync(new URL(`../../public/vision/posters/v${i}.webp`, import.meta.url)), `missing poster v${i}`);
});
