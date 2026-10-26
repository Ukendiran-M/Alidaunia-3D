import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  MANIFESTO_SECTIONS,
  M2_INFRASTRUCTURE_LAYERS,
  M3_PROJECT_PHASES,
  M5_NETWORK_CONNECTIONS,
  M5_NETWORK_NODES,
  M6_PRINCIPLES,
} from '../config/manifestoContent';
import { MANIFESTO_ASSETS } from '../config/assets';

const page = readFileSync(new URL('../pages/ManifestoPage.tsx', import.meta.url), 'utf8');
const publicFile = (path: string) => new URL(`../../public${path}`, import.meta.url);

test('M2–M6 keep anchors, kickers, titles, subtitles and every body paragraph', () => {
  assert.deepEqual(MANIFESTO_SECTIONS.map((s) => s.id), ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);
  assert.deepEqual(MANIFESTO_SECTIONS.map((s) => s.body.length), [0, 4, 2, 2, 2, 2]);
  for (const id of ['m2', 'm3', 'm4', 'm5', 'm6']) {
    assert.ok(page.includes(`id="${id}"`), `missing anchor #${id}`);
    for (const field of ['.kicker}', '.title}', '.subtitle}']) assert.ok(page.includes(`{${id}${field}`), `${id}${field} not rendered`);
  }
  assert.ok(page.includes('m2.body.map'));
  for (const id of ['m3', 'm4', 'm5', 'm6']) for (const i of [0, 1]) assert.ok(page.includes(`{${id}.body[${i}]}`), `${id}.body[${i}] not rendered`);
});

test('five M2 systems, four M3 phases with three details, six M5 nodes and seven links survive', () => {
  assert.deepEqual(M2_INFRASTRUCTURE_LAYERS.map((l) => l.name), [
    '01. Base Geotecnica & Drenaggio',
    '02. Piastra Strutturale FATO',
    '03. Cerchio TLOF & Marcatura H',
    '04. Circuito Luci Perimetrali & Antincendio',
    '05. Fascia di Sicurezza & Vie di Transito',
  ]);
  assert.deepEqual(M3_PROJECT_PHASES.map((p) => p.title), ['Analisi', 'Progetto', 'Realizzazione', 'Gestione']);
  for (const phase of M3_PROJECT_PHASES) assert.equal(phase.details.length, 3);
  assert.deepEqual(M5_NETWORK_NODES.map((n) => `${n.name} — ${n.role}`), [
    'Foggia — Hub Centrale & Base Operativa',
    'Isole Tremiti (San Domino) — Approdo Insulare Collegato',
    'Vieste — Elisuperficie Costiera',
    'Peschici — Elisuperficie Territoriale',
    'San Giovanni Rotondo — Snodo Ospedaliero & Santuario',
    'Rete Regionale Elisanitaria — Presidi di Pronto Intervento',
  ]);
  assert.equal(M5_NETWORK_CONNECTIONS.length, 7);
  // Rendered in full, not behind selectors or hover.
  for (const token of ['{layer.name}', '{layer.description}', 'FASE {phase.number}', '{phase.title}', '{phase.description}', 'phase.details.map', '{item}', '{node.name}', '{node.role}']) {
    assert.ok(page.includes(token), `${token} not rendered`);
  }
  assert.doesNotMatch(page, /onMouseEnter|onClick=\{\(\) => setActive/);
});

test('M6 keeps the three principles, both actions and their handlers', () => {
  assert.deepEqual(M6_PRINCIPLES, [
    { title: 'Sicurezza Senza Compromessi', description: "Priorità all'analisi attenta degli spazi operativi, alla regolarità dei flussi e all'efficienza dei presidi di sicurezza a terra." },
    { title: 'Rigore Progettuale & Precisione', description: "Metodo ingegneristico accurato, dai primi rilievi geometrici fino al collaudo operativo e all'avvio in esercizio." },
    { title: 'Continuità del Servizio', description: 'Accompagnamento costante degli approdi attraverso protocolli di manutenzione e coordinamento operativo di terra.' },
  ]);
  for (const token of [
    'PRINCIPIO 0{i + 1}',
    '{principle.title}',
    '{principle.description}',
    'APPROFONDIMENTO STRATEGICO',
    'Scopri i valori e la missione aziendale',
    'Vision, Mission e Valori',
    'onNavigate?.(ROUTES.VISION)',
    "window.scrollTo({ top: 0, behavior: 'smooth' })",
    'href={EXTERNAL_LINKS.CONTACTS}',
    'Contatta il Team Tecnico',
    'TOPOLOGIA DI RETE E NODI DI COLLEGAMENTO',
    'HUB CENTRALE: FOGGIA',
  ]) {
    assert.ok(page.includes(token), `${token} missing`);
  }
});

test('M1 is still the unchanged assembly hero and the retired M2–M6 mechanisms are gone', () => {
  assert.ok(page.includes('<HelicopterAssemblyHero />'));
  for (const retired of ['operationsReference', 'network-line', 'activeM2Layer', 'm4ImageRef', 'LIVELLO ATTIVO']) {
    assert.ok(!page.includes(retired), `${retired} should be retired`);
  }
});

test('every chapter asset and its matching fallback poster is in the app', () => {
  for (const [id, asset] of Object.entries(MANIFESTO_ASSETS.chapters)) {
    assert.ok(existsSync(publicFile(asset.model)), `${id} model missing`);
    assert.ok(existsSync(publicFile(asset.poster)), `${id} poster missing`);
    assert.match(asset.poster, new RegExp(`/${id.toLowerCase()}-settled\\.jpg$`));
    assert.ok(page.includes(`id="${id}"`), `${id} visual not placed`);
  }
  assert.ok(existsSync(publicFile(MANIFESTO_ASSETS.environment)));
});

test('the atlas data matches the approved nodes and connections', () => {
  const data = JSON.parse(readFileSync(publicFile('/manifesto-assets/vectors/m5-network-data.json'), 'utf8')) as {
    nodes: { id: string; name: string; x: number; y: number }[];
    connections: { from: string; to: string }[];
  };
  assert.deepEqual(
    data.nodes.map((n) => [n.id, n.name, n.x, n.y]),
    M5_NETWORK_NODES.map((n) => [n.id, n.name, n.x, n.y]),
  );
  assert.deepEqual(data.connections, M5_NETWORK_CONNECTIONS);
});
