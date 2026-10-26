/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Brand and project artwork for the Vision journey, drawn as crisp canvas
 * vector art with the real Alidaunia logo and the site's fonts: hangar signs,
 * the developing layout drawing, reference/handover sheets, the project
 * dossier and the briefing-room glass manifestation.
 *
 * The plan depicts this conceptual base itself. It is illustrative project
 * artwork: no coordinates, regulatory labels, dimensions or certificates.
 */

import * as THREE from 'three';
import { BRAND_ASSETS } from '../config/assets';
import { LAYOUT } from '../utils/visionJourney';

export const BRAND = { blue: '#0B4584', red: '#E31E24', navy: '#081C33', offWhite: '#F5F6F7' };
const DISPLAY = '"Space Grotesk", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
const PAPER = '#f7f5ef';
const INK = '#26313d';
const LOGO_ASPECT = 1130 / 1140;

export interface BrandArt {
  logo: HTMLImageElement | null;
}

/** Logo image and site fonts; resolves even if one of them fails (artwork then omits the logo). */
export async function loadBrandArt(): Promise<BrandArt> {
  const logo = new Image();
  logo.decoding = 'async';
  logo.src = BRAND_ASSETS.logo.url;
  const [image] = await Promise.allSettled([
    logo.decode().then(() => logo),
    document.fonts?.load(`700 64px ${DISPLAY}`),
    document.fonts?.load(`500 32px ${MONO}`),
    document.fonts?.load(`600 32px ${SANS}`),
  ]);
  return { logo: image.status === 'fulfilled' ? (image.value as HTMLImageElement) : null };
}

export interface Artwork {
  texture: THREE.CanvasTexture;
  paint(art: BrandArt): void;
}

function artwork(width: number, height: number, draw: (g: CanvasRenderingContext2D, art: BrandArt) => void, transparent = false): Artwork {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const paint = (art: BrandArt) => {
    g.clearRect(0, 0, width, height);
    if (!transparent) {
      g.fillStyle = PAPER;
      g.fillRect(0, 0, width, height);
    }
    draw(g, art);
    texture.needsUpdate = true;
  };
  paint({ logo: null });
  return { texture, paint };
}

/** The logo at its true proportions, on its own white ground (as supplied). */
function drawLogo(g: CanvasRenderingContext2D, art: BrandArt, x: number, y: number, h: number) {
  if (!art.logo) return 0;
  const w = h * LOGO_ASPECT;
  g.drawImage(art.logo, x, y, w, h);
  return w;
}

function wordmark(g: CanvasRenderingContext2D, x: number, y: number, size: number, ink: string, sub: string) {
  g.fillStyle = ink;
  g.font = `700 ${size}px ${DISPLAY}`;
  g.textBaseline = 'alphabetic';
  g.fillText('ALIDAUNIA', x, y);
  g.fillStyle = sub;
  g.font = `600 ${size * 0.34}px ${MONO}`;
  const letters = 'SERVICES'.split('');
  let cx = x + size * 0.04;
  for (const ch of letters) {
    g.fillText(ch, cx, y + size * 0.52);
    cx += size * 0.34 * 1.55;
  }
}

/** Hangar sign: logo plate and wordmark on a navy or blue panel. */
export function hangarSign(width: number, height: number, background: string, sub = '#9fc0e4') {
  return artwork(width, height, (g, art) => {
    g.fillStyle = background;
    g.fillRect(0, 0, width, height);
    const pad = height * 0.16;
    const logoW = drawLogo(g, art, pad, pad, height - pad * 2);
    wordmark(g, pad + logoW + height * 0.22, height * 0.62, height * 0.42, '#ffffff', sub);
  });
}

/* -------------------------------------------------------------------------- */
/* Plan drawing of the base                                                    */
/* -------------------------------------------------------------------------- */

type PlanLayer = 'context' | 'construction' | 'review';
const PLAN = { x0: -38, x1: 50, z0: -38, z1: 46 };

function planMapper(px: number, py: number, pw: number, ph: number) {
  const k = Math.min(pw / (PLAN.x1 - PLAN.x0), ph / (PLAN.z1 - PLAN.z0));
  const ox = px + (pw - (PLAN.x1 - PLAN.x0) * k) / 2;
  const oy = py + (ph - (PLAN.z1 - PLAN.z0) * k) / 2;
  return { k, x: (x: number) => ox + (x - PLAN.x0) * k, y: (z: number) => oy + (z - PLAN.z0) * k };
}

function helicopterPlan(g: CanvasRenderingContext2D, cx: number, cy: number, k: number, angle: number, ink: string) {
  g.save();
  g.translate(cx, cy);
  g.rotate(angle);
  g.strokeStyle = ink;
  g.lineWidth = Math.max(1.5, k * 0.14);
  // Fuselage, tail boom, stabiliser and tail rotor (nose towards +x).
  g.beginPath();
  g.ellipse(k * 0.9, 0, k * 3.6, k * 1.1, 0, 0, Math.PI * 2);
  g.moveTo(-k * 2.6, 0);
  g.lineTo(-k * 6.6, 0);
  g.moveTo(-k * 5.9, -k * 1.3);
  g.lineTo(-k * 5.9, k * 1.3);
  g.moveTo(-k * 6.8, -k * 0.2);
  g.lineTo(-k * 6.8, k * 1.0);
  g.stroke();
  // Five-blade rotor disc.
  g.setLineDash([k * 0.6, k * 0.4]);
  g.beginPath();
  g.arc(k * 0.6, 0, k * 6.9, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    g.beginPath();
    g.moveTo(k * 0.6, 0);
    g.lineTo(k * 0.6 + Math.cos(a) * k * 6.8, Math.sin(a) * k * 6.8);
    g.stroke();
  }
  g.restore();
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, ink: string, align: CanvasTextAlign = 'left') {
  g.fillStyle = ink;
  g.font = `600 ${size}px ${MONO}`;
  g.textAlign = align;
  g.fillText(text, x, y);
  g.textAlign = 'left';
}

/** Shared plan language, used on the drafting board and in the dossier. */
export function drawPlan(g: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number, layer: PlanLayer, detail = 1) {
  const m = planMapper(px, py, pw, ph);
  const { hangar, annex, aircraft, apron, drainZ, fixture } = LAYOUT;
  const text = Math.max(11, m.k * 1.9) * detail;
  const stand = { x: 5, z: 24 };
  const envelope = 10.5;
  const blue = '#1c4f8f';
  const red = '#c8262b';
  if (layer === 'context') {
    g.strokeStyle = INK;
    g.lineWidth = Math.max(1.5, m.k * 0.16);
    // Apron (light tone) and hangar (blue tint) with heavier outlines.
    g.fillStyle = 'rgba(38,49,61,0.06)';
    g.fillRect(m.x(apron.x0), m.y(apron.z0), (apron.x1 - apron.x0) * m.k, (apron.z1 - apron.z0) * m.k);
    g.strokeRect(m.x(apron.x0), m.y(apron.z0), (apron.x1 - apron.x0) * m.k, (apron.z1 - apron.z0) * m.k);
    g.fillStyle = 'rgba(11,69,132,0.1)';
    g.fillRect(m.x(hangar.x0), m.y(hangar.zBack), (hangar.x1 - hangar.x0) * m.k, (hangar.zFront - hangar.zBack) * m.k);
    g.lineWidth = Math.max(2.5, m.k * 0.32);
    g.strokeRect(m.x(hangar.x0), m.y(hangar.zBack), (hangar.x1 - hangar.x0) * m.k, (hangar.zFront - hangar.zBack) * m.k);
    g.lineWidth = Math.max(1, m.k * 0.14);
    g.strokeRect(m.x(annex.x0), m.y(annex.z0), (annex.x1 - annex.x0) * m.k, (annex.z1 - annex.z0) * m.k);
    g.save();
    g.beginPath();
    g.rect(m.x(annex.x0), m.y(annex.z0), (annex.x1 - annex.x0) * m.k, (annex.z1 - annex.z0) * m.k);
    g.clip();
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(38,49,61,0.35)';
    for (let d = -40; d < 80; d += 1.6) {
      g.beginPath();
      g.moveTo(m.x(annex.x0 + d), m.y(annex.z0));
      g.lineTo(m.x(annex.x0 + d - 30), m.y(annex.z0 + 30));
      g.stroke();
    }
    g.restore();
    // Door track line.
    g.setLineDash([m.k * 0.8, m.k * 0.5]);
    g.beginPath();
    g.moveTo(m.x(hangar.x0 - 2), m.y(1));
    g.lineTo(m.x(hangar.x1 + 2), m.y(1));
    g.stroke();
    g.setLineDash([]);
    // Parked aircraft, operating stand and its clearance envelope.
    helicopterPlan(g, m.x(aircraft.x), m.y(aircraft.z), m.k, Math.PI / 2 - 0.25, INK);
    helicopterPlan(g, m.x(stand.x), m.y(stand.z), m.k, Math.PI / 2, 'rgba(38,49,61,0.45)');
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, m.k * 0.18);
    g.setLineDash([m.k * 1.2, m.k * 0.6, m.k * 0.2, m.k * 0.6]);
    g.beginPath();
    g.arc(m.x(stand.x), m.y(stand.z), envelope * m.k, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    // Approach direction: a sector and arrow from the open side.
    g.fillStyle = 'rgba(38,49,61,0.07)';
    g.beginPath();
    g.moveTo(m.x(stand.x), m.y(stand.z));
    g.lineTo(m.x(stand.x - 10), m.y(apron.z1));
    g.lineTo(m.x(stand.x + 10), m.y(apron.z1));
    g.closePath();
    g.fill();
    g.lineWidth = Math.max(1.5, m.k * 0.18);
    g.beginPath();
    g.moveTo(m.x(stand.x), m.y(apron.z1 - 1));
    g.lineTo(m.x(stand.x), m.y(stand.z + envelope + 1.5));
    g.lineTo(m.x(stand.x - 1.2), m.y(stand.z + envelope + 3.6));
    g.moveTo(m.x(stand.x), m.y(stand.z + envelope + 1.5));
    g.lineTo(m.x(stand.x + 1.2), m.y(stand.z + envelope + 3.6));
    g.stroke();
    label(g, 'HANGAR', m.x(-12), m.y(-30), text, INK);
    label(g, 'ANNESSO TECNICO', m.x(annex.x0), m.y(annex.z0 - 1.5), text * 0.85, INK);
    label(g, 'PIAZZALE', m.x(-30), m.y(apron.z1 - 3), text, INK);
    label(g, 'INVILUPPO DI SICUREZZA', m.x(stand.x + envelope + 1.5), m.y(stand.z - 1), text * 0.85, INK);
    label(g, 'DIREZIONE DI AVVICINAMENTO', m.x(stand.x + 2), m.y(apron.z1 - 2.5), text * 0.85, INK);
    // North arrow.
    const nx = m.x(PLAN.x1 - 5);
    const ny = m.y(PLAN.z0 + 6);
    g.beginPath();
    g.moveTo(nx, ny - m.k * 3);
    g.lineTo(nx - m.k * 1.1, ny + m.k * 1.5);
    g.lineTo(nx, ny + m.k * 0.6);
    g.closePath();
    g.fillStyle = INK;
    g.fill();
    label(g, 'N', nx, ny - m.k * 3.6, text, INK, 'center');
  } else if (layer === 'construction') {
    g.strokeStyle = 'rgba(28,79,143,0.32)';
    g.lineWidth = 1;
    for (let x = -1.5; x < apron.x1; x += 6) {
      if (x < apron.x0) continue;
      g.beginPath();
      g.moveTo(m.x(x), m.y(apron.z0));
      g.lineTo(m.x(x), m.y(apron.z1));
      g.stroke();
    }
    for (let z = 3; z < apron.z1; z += 6) {
      g.beginPath();
      g.moveTo(m.x(apron.x0), m.y(z));
      g.lineTo(m.x(apron.x1), m.y(z));
      g.stroke();
    }
    // Slot drain with fall arrows.
    g.strokeStyle = blue;
    g.lineWidth = Math.max(2, m.k * 0.3);
    g.beginPath();
    g.moveTo(m.x(hangar.x0), m.y(drainZ));
    g.lineTo(m.x(40), m.y(drainZ));
    g.stroke();
    g.lineWidth = Math.max(1, m.k * 0.12);
    for (let x = -10; x <= 34; x += 11) {
      g.beginPath();
      g.moveTo(m.x(x), m.y(drainZ + 5));
      g.lineTo(m.x(x), m.y(drainZ + 0.8));
      g.lineTo(m.x(x - 0.8), m.y(drainZ + 2));
      g.moveTo(m.x(x), m.y(drainZ + 0.8));
      g.lineTo(m.x(x + 0.8), m.y(drainZ + 2));
      g.stroke();
    }
    // Service access route and utility trench.
    g.setLineDash([m.k * 1.4, m.k * 0.8]);
    g.lineWidth = Math.max(1.5, m.k * 0.2);
    g.beginPath();
    g.moveTo(m.x(PLAN.x1), m.y(30));
    g.lineTo(m.x(32), m.y(30));
    g.lineTo(m.x(32), m.y(annex.z1 + 2));
    g.lineTo(m.x(annex.x1), m.y(annex.z1 + 2));
    g.stroke();
    g.setLineDash([m.k * 1.6, m.k * 0.5, m.k * 0.3, m.k * 0.5]);
    g.lineWidth = Math.max(1, m.k * 0.12);
    g.beginPath();
    g.moveTo(m.x(annex.x1 - 1), m.y(annex.z1));
    g.lineTo(m.x(annex.x1 - 1), m.y(fixture[2]));
    g.lineTo(m.x(stand.x + envelope), m.y(fixture[2]));
    g.stroke();
    g.setLineDash([]);
    // Edge lights around the envelope and along the service joint.
    const lamp = (x: number, z: number) => {
      g.beginPath();
      g.arc(m.x(x), m.y(z), m.k * 0.55, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(m.x(x) - m.k * 0.55, m.y(z));
      g.lineTo(m.x(x) + m.k * 0.55, m.y(z));
      g.moveTo(m.x(x), m.y(z) - m.k * 0.55);
      g.lineTo(m.x(x), m.y(z) + m.k * 0.55);
      g.stroke();
    };
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      lamp(stand.x + Math.cos(a) * (envelope - 1.2), stand.z + Math.sin(a) * (envelope - 1.2));
    }
    for (const x of [fixture[0], fixture[0] + 6, fixture[0] + 12]) lamp(x, fixture[2]);
    label(g, 'DRENAGGIO', m.x(-14), m.y(drainZ - 1), text * 0.85, blue);
    label(g, 'ACCESSO DI SERVIZIO', m.x(33), m.y(28.5), text * 0.85, blue);
    label(g, 'LUCI PERIMETRALI', m.x(fixture[0] + 2), m.y(fixture[2] + 3), text * 0.85, blue);
  } else {
    // Review: restrained red ticks against the checked elements.
    g.strokeStyle = red;
    g.lineWidth = Math.max(2, m.k * 0.22);
    const tick = (x: number, z: number) => {
      g.beginPath();
      g.moveTo(m.x(x) - m.k * 0.9, m.y(z));
      g.lineTo(m.x(x) - m.k * 0.2, m.y(z) + m.k * 0.8);
      g.lineTo(m.x(x) + m.k * 1.2, m.y(z) - m.k * 1.0);
      g.stroke();
    };
    tick(-16, drainZ - 3);
    tick(stand.x + envelope + 2.5, stand.z + 3);
    tick(30, 26.5);
    tick(fixture[0] + 14, fixture[2] - 2);
    tick(annex.x1 + 2, annex.z0 + 3);
    g.lineWidth = Math.max(1, m.k * 0.1);
    g.setLineDash([m.k * 0.5, m.k * 0.35]);
    g.beginPath();
    g.ellipse(m.x(stand.x), m.y(stand.z), (envelope + 1.4) * m.k, (envelope + 1.4) * m.k, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
}

function titleBlock(g: CanvasRenderingContext2D, art: BrandArt, x: number, y: number, w: number, h: number, title: string) {
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.beginPath();
  g.moveTo(x + h, y);
  g.lineTo(x + h, y + h);
  g.stroke();
  drawLogo(g, art, x + h * 0.14, y + h * 0.14, h * 0.72);
  g.fillStyle = BRAND.navy;
  g.font = `700 ${h * 0.24}px ${DISPLAY}`;
  g.fillText('ALIDAUNIA SERVICES', x + h * 1.18, y + h * 0.38);
  g.fillStyle = INK;
  g.font = `500 ${h * 0.17}px ${MONO}`;
  g.fillText(title, x + h * 1.18, y + h * 0.72);
}

/** The drafting board drawing, as three stacked layers (context opaque, the rest transparent). */
export function boardDrawing(width = 2048, height = 1024) {
  const margin = width * 0.025;
  const plan = (g: CanvasRenderingContext2D, layer: PlanLayer) => drawPlan(g, margin * 2, margin * 1.6, width * 0.7, height - margin * 3.2, layer);
  const context = artwork(width, height, (g, art) => {
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    plan(g, 'context');
    // Legend column and title block.
    const lx = width * 0.75;
    g.fillStyle = INK;
    g.font = `600 ${height * 0.026}px ${MONO}`;
    g.fillText('LEGENDA', lx, height * 0.12);
    const rows: [string, string][] = [
      ['—', 'Edifici e piazzale'],
      ['- ·', 'Inviluppo di sicurezza'],
      ['→', 'Avvicinamento'],
    ];
    rows.forEach(([sym, text], i) => {
      g.font = `600 ${height * 0.024}px ${MONO}`;
      g.fillText(sym, lx, height * (0.18 + i * 0.05));
      g.font = `500 ${height * 0.024}px ${SANS}`;
      g.fillText(text, lx + height * 0.07, height * (0.18 + i * 0.05));
    });
    titleBlock(g, art, lx - width * 0.01, height - margin - height * 0.17, width * 0.22, height * 0.15, 'Schema di layout — illustrativo');
  });
  const construction = artwork(width, height, (g) => {
    plan(g, 'construction');
    const lx = width * 0.75;
    g.fillStyle = '#1c4f8f';
    const rows = ['Drenaggio', 'Accesso di servizio', 'Luci perimetrali'];
    rows.forEach((text, i) => {
      g.font = `500 ${height * 0.024}px ${SANS}`;
      g.fillText(text, lx + height * 0.07, height * (0.33 + i * 0.05));
      g.fillRect(lx, height * (0.325 + i * 0.05) - 3, height * 0.045, 4);
    });
  }, true);
  const review = artwork(width, height, (g) => {
    plan(g, 'review');
    g.strokeStyle = '#c8262b';
    g.lineWidth = 3;
    const lx = width * 0.75;
    for (let i = 0; i < 6; i++) {
      const y = height * (0.18 + i * 0.05) - height * 0.012;
      g.beginPath();
      g.moveTo(lx + width * 0.17, y);
      g.lineTo(lx + width * 0.176, y + height * 0.012);
      g.lineTo(lx + width * 0.188, y - height * 0.012);
      g.stroke();
    }
  }, true);
  return { context, construction, review };
}

/** Reference sheets beside the board: site context and a hangar section. */
export function referenceSheet(kind: 'context' | 'section', width = 1024, height = 724) {
  return artwork(width, height, (g, art) => {
    const m = width * 0.04;
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.strokeRect(m, m, width - m * 2, height - m * 2);
    if (kind === 'context') {
      // Roads, plots and the base location — an abstract context sketch.
      g.strokeStyle = 'rgba(38,49,61,0.5)';
      g.lineWidth = width * 0.012;
      g.beginPath();
      g.moveTo(m, height * 0.7);
      g.bezierCurveTo(width * 0.35, height * 0.62, width * 0.55, height * 0.8, width - m, height * 0.66);
      g.moveTo(width * 0.62, m);
      g.lineTo(width * 0.55, height - m);
      g.stroke();
      g.lineWidth = 2;
      g.strokeStyle = INK;
      for (let i = 0; i < 9; i++) {
        const x = m * 2 + (i % 3) * width * 0.13;
        const y = m * 2 + Math.floor(i / 3) * height * 0.15;
        g.strokeRect(x, y, width * 0.1, height * 0.1);
      }
      g.fillStyle = 'rgba(11,69,132,0.16)';
      g.fillRect(width * 0.66, height * 0.18, width * 0.24, height * 0.34);
      g.strokeRect(width * 0.66, height * 0.18, width * 0.24, height * 0.34);
      label(g, 'CONTESTO', m * 2, height - m * 2, height * 0.04, INK);
    } else {
      // Hangar cross-section with the aircraft silhouette for clearance.
      const gy = height * 0.78;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(m, gy);
      g.lineTo(width - m, gy);
      g.moveTo(width * 0.12, gy);
      g.lineTo(width * 0.12, height * 0.32);
      g.lineTo(width * 0.5, height * 0.2);
      g.lineTo(width * 0.88, height * 0.32);
      g.lineTo(width * 0.88, gy);
      g.stroke();
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(width * 0.5, gy - height * 0.13, width * 0.2, height * 0.09, 0, 0, Math.PI * 2);
      g.moveTo(width * 0.24, gy - height * 0.3);
      g.lineTo(width * 0.76, gy - height * 0.3);
      g.moveTo(width * 0.5, gy - height * 0.22);
      g.lineTo(width * 0.5, gy - height * 0.3);
      g.stroke();
      g.setLineDash([8, 6]);
      g.strokeRect(width * 0.22, gy - height * 0.36, width * 0.56, height * 0.36);
      g.setLineDash([]);
      label(g, 'SEZIONE', m * 2, height - m * 2, height * 0.04, INK);
    }
    drawLogo(g, art, width - m - height * 0.12, height - m - height * 0.14, height * 0.1);
  });
}

/** Inspection and handover sheet: a simple checklist, partly completed in blue ink. */
export function handoverSheet(width = 724, height = 1024) {
  return artwork(width, height, (g, art) => {
    const m = width * 0.07;
    drawLogo(g, art, m, m, width * 0.1);
    g.fillStyle = BRAND.navy;
    g.font = `700 ${width * 0.05}px ${DISPLAY}`;
    g.fillText('Ispezione e consegna', m + width * 0.14, m + width * 0.07);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(m, m + width * 0.16);
    g.lineTo(width - m, m + width * 0.16);
    g.stroke();
    const items = ['Superfici e giunti', 'Drenaggio', 'Illuminazione', 'Accessi di servizio', 'Documentazione'];
    items.forEach((item, i) => {
      const y = m + width * 0.3 + i * height * 0.1;
      g.strokeStyle = INK;
      g.lineWidth = 2;
      g.strokeRect(m, y - width * 0.045, width * 0.055, width * 0.055);
      g.fillStyle = INK;
      g.font = `500 ${width * 0.042}px ${SANS}`;
      g.fillText(item, m + width * 0.1, y);
      g.strokeStyle = 'rgba(38,49,61,0.3)';
      g.beginPath();
      g.moveTo(m + width * 0.1, y + width * 0.035);
      g.lineTo(width - m, y + width * 0.035);
      g.stroke();
      if (i < 4) {
        g.strokeStyle = BRAND.blue;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(m + width * 0.008, y - width * 0.02);
        g.lineTo(m + width * 0.025, y);
        g.lineTo(m + width * 0.06, y - width * 0.05);
        g.stroke();
      }
    });
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    for (const [i, t] of ['Cliente', 'Gestione'].entries()) {
      const x = m + i * (width - m * 2) * 0.52;
      g.beginPath();
      g.moveTo(x, height - m * 1.6);
      g.lineTo(x + (width - m * 2) * 0.44, height - m * 1.6);
      g.stroke();
      g.fillStyle = INK;
      g.font = `500 ${width * 0.032}px ${MONO}`;
      g.fillText(t, x, height - m);
    }
  });
}

/** Project dossier cover. */
export function dossierCover(width = 1024, height = 724) {
  return artwork(width, height, (g, art) => {
    g.fillStyle = BRAND.navy;
    g.fillRect(0, 0, width, height);
    g.fillStyle = BRAND.red;
    g.fillRect(0, height * 0.9, width, height * 0.012);
    const logoW = drawLogo(g, art, width * 0.08, height * 0.12, height * 0.22);
    wordmark(g, width * 0.08 + logoW + width * 0.04, height * 0.27, height * 0.1, '#ffffff', '#9fc0e4');
    g.fillStyle = 'rgba(255,255,255,0.86)';
    g.font = `500 ${height * 0.05}px ${SANS}`;
    g.fillText('Dossier di progetto', width * 0.08, height * 0.72);
  });
}

/** The three folio sheets: requirements (Cliente), coordinated drawing (Progetto), handover record (Gestione). */
export function folioSheet(kind: 'cliente' | 'progetto' | 'gestione', width = 1024, height = 724) {
  const titles = { cliente: 'Cliente — requisiti', progetto: 'Progetto — layout coordinato', gestione: 'Gestione — registro di consegna' };
  return artwork(width, height, (g, art) => {
    const m = width * 0.05;
    drawLogo(g, art, m, m, height * 0.09);
    g.fillStyle = BRAND.navy;
    g.font = `700 ${height * 0.055}px ${DISPLAY}`;
    g.fillText(titles[kind], m + height * 0.13, m + height * 0.065);
    g.fillStyle = BRAND.blue;
    g.fillRect(m, m + height * 0.13, width - m * 2, 3);
    const top = m + height * 0.19;
    if (kind === 'progetto') {
      g.strokeStyle = INK;
      g.lineWidth = 1.5;
      g.strokeRect(m, top, width - m * 2, height - top - m);
      drawPlan(g, m, top, width - m * 2, height - top - m, 'context', 1.6);
      drawPlan(g, m, top, width - m * 2, height - top - m, 'construction', 1.6);
      return;
    }
    // Text is shown as quiet line blocks: legible structure, not invented prose.
    const lines = kind === 'cliente' ? [0.9, 0.75, 0.82, 0.6, 0, 0.88, 0.7, 0.8, 0.5] : [];
    lines.forEach((w, i) => {
      if (!w) return;
      g.fillStyle = 'rgba(38,49,61,0.32)';
      g.fillRect(m, top + i * height * 0.07, (width - m * 2) * w, height * 0.022);
    });
    if (kind === 'gestione') {
      g.strokeStyle = 'rgba(38,49,61,0.5)';
      g.lineWidth = 1.5;
      const rows = 7;
      const colX = [m, m + width * 0.32, m + width * 0.62, width - m];
      for (let r = 0; r <= rows; r++) {
        const y = top + r * ((height - top - m) / rows);
        g.beginPath();
        g.moveTo(m, y);
        g.lineTo(width - m, y);
        g.stroke();
      }
      for (const x of colX) {
        g.beginPath();
        g.moveTo(x, top);
        g.lineTo(x, height - m);
        g.stroke();
      }
      for (let r = 1; r < 5; r++) {
        const y = top + (r + 0.5) * ((height - top - m) / rows);
        g.fillStyle = 'rgba(38,49,61,0.32)';
        g.fillRect(m + width * 0.02, y - 6, width * 0.22, 10);
        g.strokeStyle = BRAND.blue;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(colX[2] + width * 0.04, y);
        g.lineTo(colX[2] + width * 0.055, y + 10);
        g.lineTo(colX[2] + width * 0.08, y - 12);
        g.stroke();
      }
    }
  });
}

/** Frosted glass band with small logo marks, for the briefing-room glazing. */
export function glassManifestation(width = 2048, height = 128, marks = 8) {
  return artwork(width, height, (g, art) => {
    g.fillStyle = 'rgba(255,255,255,0.42)';
    g.fillRect(0, height * 0.18, width, height * 0.64);
    for (let i = 0; i < marks; i++) {
      const x = ((i + 0.5) / marks) * width - height * 0.3;
      drawLogo(g, art, x, height * 0.24, height * 0.52);
    }
  }, true);
}

/** Soft rectangular contact shadow (alpha). */
export function contactShadowTexture(size = 256, softness = 0.32) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  const image = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.max(0, Math.abs(x / size - 0.5) * 2 - (1 - softness)) / softness;
      const dy = Math.max(0, Math.abs(y / size - 0.5) * 2 - (1 - softness)) / softness;
      const a = Math.max(0, 1 - Math.hypot(dx, dy));
      image.data[(y * size + x) * 4 + 3] = Math.round(255 * a * a);
    }
  }
  g.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Wall cladding: insulated panel seams, tiled per metre. */
export function panelTexture(base: string, seam: string, size = 256, vertical = true) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  g.fillStyle = seam;
  if (vertical) g.fillRect(0, 0, Math.max(2, size / 128), size);
  else g.fillRect(0, 0, size, Math.max(2, size / 128));
  g.fillStyle = 'rgba(255,255,255,0.05)';
  if (vertical) g.fillRect(size / 2, 0, 1, size);
  else g.fillRect(0, size / 2, size, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Apron concrete: 6 m slabs with sealed joints, per-slab tone, aggregate and
 * light tyre wear. One texture repeat covers 12 m (2 × 2 slabs).
 */
export function apronConcreteTexture(size = 2048) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  let seed = 4187;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const half = size / 2;
  const tones = ['#9c998f', '#97948b', '#a19e95', '#99968e'];
  for (let i = 0; i < 4; i++) {
    g.fillStyle = tones[i];
    g.fillRect((i % 2) * half, Math.floor(i / 2) * half, half, half);
  }
  const image = g.getImageData(0, 0, size, size);
  for (let p = 0; p < image.data.length; p += 4) {
    const n = (rand() - 0.5) * 20;
    image.data[p] += n;
    image.data[p + 1] += n;
    image.data[p + 2] += n;
  }
  g.putImageData(image, 0, 0);
  // Aggregate speckle and subtle wear.
  for (let i = 0; i < 9000; i++) {
    const r = rand() * 2.2 + 0.4;
    g.fillStyle = rand() > 0.5 ? 'rgba(70,68,64,0.35)' : 'rgba(235,232,226,0.35)';
    g.beginPath();
    g.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = 'rgba(60,58,55,0.05)';
    g.beginPath();
    g.ellipse(rand() * size, rand() * size, size * (0.06 + rand() * 0.1), size * (0.02 + rand() * 0.05), rand() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(60,58,55,0.06)';
  g.lineWidth = size * 0.012;
  g.beginPath();
  g.moveTo(size * 0.3, 0);
  g.bezierCurveTo(size * 0.32, size * 0.4, size * 0.26, size * 0.7, size * 0.29, size);
  g.stroke();
  // Sealed joints along the slab edges.
  const joint = Math.max(2, size / 520);
  g.fillStyle = '#5f5c56';
  for (const t of [0, half]) {
    g.fillRect(t - joint / 2, 0, joint, size);
    g.fillRect(0, t - joint / 2, size, joint);
  }
  g.fillRect(size - joint / 2, 0, joint, size);
  g.fillRect(0, size - joint / 2, size, joint);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Slot-drain grating: alpha-tested slots. */
export function gratingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 64);
  g.clearRect(0, 0, 0, 0);
  for (let x = 6; x < 256; x += 16) g.clearRect(x, 10, 9, 44);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
