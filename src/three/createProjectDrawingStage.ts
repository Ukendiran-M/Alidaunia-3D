/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M2: Architectural Project Drawing WebGL Stage
 * Renders an authentic curved/subdivided ivory architectural paper sheet on a deep navy drafting table.
 * As the visitor scrolls:
 * 1. The sheet physically unrolls across the table with dynamic curvature & soft shadows.
 * 2. Fine Alidaunia blue & red technical linework reveals the 5 coordinated systems.
 * 3. The scene holds for steady reading before cleanly releasing into M3.
 */

import * as THREE from 'three';
import { computeProjectDrawingState, type ProjectDrawingState } from '../utils/projectDrawingPose';
import { M2_INFRASTRUCTURE_LAYERS } from '../config/manifestoContent';

export interface ProjectDrawingStageOptions {
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

export function createProjectDrawingStage(
  container: HTMLElement,
  options: ProjectDrawingStageOptions = {}
) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();
  // Deep navy aviation background matching Section M1
  scene.background = new THREE.Color('#081C33');

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 150);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // Soft drafting surface beneath the paper
  const tableMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 45),
    new THREE.MeshStandardMaterial({
      color: 0x051324,
      roughness: 0.9,
      metalness: 0.1,
    })
  );
  tableMesh.rotation.x = -Math.PI / 2;
  tableMesh.position.y = -0.05;
  tableMesh.receiveShadow = true;
  scene.add(tableMesh);

  // Key architectural light for paper shadows and curvature depth
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(10, 18, 12);
  keyLight.castShadow = !mobile;
  keyLight.shadow.mapSize.set(1536, 1536);
  Object.assign(keyLight.shadow.camera, {
    left: -12,
    right: 12,
    top: 10,
    bottom: -10,
    near: 0.5,
    far: 45,
  });
  keyLight.shadow.bias = -0.00015;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Cool aviation blue rim light illuminating the curled paper edges
  const rimLight = new THREE.DirectionalLight(0x8bbeff, 1.3);
  rimLight.position.set(-14, 8, -10);
  scene.add(rimLight);

  // Soft ambient fill
  const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x081c33, 0.75);
  scene.add(hemiLight);

  // ========================================================
  // TECHNICAL DRAWING CANVAS TEXTURE BUILDER
  // ========================================================
  const canvasWidth = 2048;
  const canvasHeight = 1365; // 15:10 aspect ratio matching 15m x 10m sheet
  const drawingCanvas = document.createElement('canvas');
  drawingCanvas.width = canvasWidth;
  drawingCanvas.height = canvasHeight;
  const ctx = drawingCanvas.getContext('2d');

  const drawingTexture = new THREE.CanvasTexture(drawingCanvas);
  drawingTexture.colorSpace = THREE.SRGBColorSpace;
  drawingTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  function renderDrawingToCanvas(visibilities: number[], drawingProgress: number) {
    if (!ctx) return;
    const w = canvasWidth;
    const h = canvasHeight;

    // 1. Warm ivory paper background
    ctx.fillStyle = '#FAF9F6';
    ctx.fillRect(0, 0, w, h);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(11, 69, 132, 0.04)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Double border & title block
    const m = 40;
    ctx.strokeStyle = '#0B4584';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.lineWidth = 1;
    ctx.strokeRect(m + 8, m + 8, w - m * 2 - 16, h - m * 2 - 16);

    // Header Title Block
    ctx.fillStyle = '#081C33';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('ALIDAUNIA SERVICES // ARCHITETTURA TECNICA INFRASTRUTTURALE', m + 24, m + 36);
    ctx.fillStyle = '#0B4584';
    ctx.font = '14px monospace';
    ctx.fillText('TAVOLA M2 — SCHEMI TECNICI COORDINATI // INGEGNERIA DI SISTEMA', m + 24, m + 58);

    ctx.fillStyle = '#E31E24';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('REVISIONE PROGETTO 04 // PROTOCOLLO INTEGRATO', w - m - 460, m + 36);

    // Separator rule
    ctx.strokeStyle = 'rgba(11, 69, 132, 0.2)';
    ctx.beginPath();
    ctx.moveTo(m + 16, m + 74);
    ctx.lineTo(w - m - 16, m + 74);
    ctx.stroke();

    // =======================================================
    // 5 DETAILED TECHNICAL SCHEMATIC PANELS
    // =======================================================

    // SYSTEM 01: Base Geotecnica & Drenaggio (Top Left)
    const v1 = visibilities[0];
    if (v1 > 0.01) {
      ctx.save();
      ctx.globalAlpha = v1;
      const x1 = m + 40;
      const y1 = m + 110;
      const w1 = 540;
      const h1 = 500;

      // Card boundary
      ctx.strokeStyle = 'rgba(11, 69, 132, 0.35)';
      ctx.strokeRect(x1, y1, w1, h1);

      ctx.fillStyle = '#0B4584';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('01. SEZIONE STRATIGRAFICA & DRENAGGIO', x1 + 16, y1 + 30);
      ctx.fillStyle = '#081C33';
      ctx.font = '13px sans-serif';
      ctx.fillText('Sottofondo geotecnico compattato & collettori acque', x1 + 16, y1 + 50);

      // Stratigraphy Cross-section
      const secX = x1 + 30;
      const secY = y1 + 90;
      const secW = w1 - 60;

      // Layer 1: Surface layer
      ctx.fillStyle = 'rgba(11, 69, 132, 0.12)';
      ctx.fillRect(secX, secY, secW, 45);
      ctx.strokeStyle = '#0B4584';
      ctx.strokeRect(secX, secY, secW, 45);
      ctx.fillStyle = '#081C33';
      ctx.font = '11px monospace';
      ctx.fillText('MANTELLO DI USURA ANTISCIVOLO (40 mm)', secX + 12, secY + 28);

      // Layer 2: Binder & Structural Base with diagonal hatching
      ctx.fillStyle = 'rgba(11, 69, 132, 0.06)';
      ctx.fillRect(secX, secY + 45, secW, 85);
      ctx.strokeStyle = '#0B4584';
      ctx.strokeRect(secX, secY + 45, secW, 85);

      ctx.strokeStyle = 'rgba(11, 69, 132, 0.4)';
      ctx.lineWidth = 1;
      for (let hx = secX; hx < secX + secW; hx += 16) {
        ctx.beginPath();
        ctx.moveTo(hx, secY + 45);
        ctx.lineTo(hx + 30, secY + 130);
        ctx.stroke();
      }
      ctx.fillStyle = '#081C33';
      ctx.fillText('MASSETTO STRUTTURALE ARMATO CON FIBRE (250 mm)', secX + 12, secY + 92);

      // Layer 3: Crushed stone sub-base with aggregate dots
      ctx.fillStyle = 'rgba(71, 85, 105, 0.08)';
      ctx.fillRect(secX, secY + 130, secW, 110);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(secX, secY + 130, secW, 110);

      ctx.fillStyle = '#0B4584';
      for (let dotX = secX + 15; dotX < secX + secW - 15; dotX += 28) {
        for (let dotY = secY + 145; dotY < secY + 230; dotY += 26) {
          ctx.beginPath();
          ctx.arc(dotX + (dotY % 14), dotY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillText('SOTTOFONDO GRANULARE STABILIZZATO (400 mm)', secX + 12, secY + 185);

      // Drainage collector pipe
      const pipeX = secX + secW - 50;
      const pipeY = secY + 280;
      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pipeX, pipeY, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pipeX, pipeY, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Flow slope arrows
      ctx.strokeStyle = '#E31E24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(secX + 20, pipeY);
      ctx.lineTo(pipeX - 35, pipeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pipeX - 45, pipeY - 6);
      ctx.lineTo(pipeX - 35, pipeY);
      ctx.lineTo(pipeX - 45, pipeY + 6);
      ctx.stroke();

      ctx.fillStyle = '#E31E24';
      ctx.font = '11px monospace';
      ctx.fillText('PENDENZA DRENANTE 1.5% →', secX + 30, pipeY - 12);
      ctx.fillStyle = '#081C33';
      ctx.fillText('CONDOTTO MICROFORATO ⌀160', pipeX - 90, pipeY + 45);

      ctx.restore();
    }

    // SYSTEM 02: Piastra Strutturale FATO & Canali Servizi (Bottom Left)
    const v2 = visibilities[1];
    if (v2 > 0.01) {
      ctx.save();
      ctx.globalAlpha = v2;
      const x2 = m + 40;
      const y2 = m + 630;
      const w2 = 540;
      const h2 = 580;

      ctx.strokeStyle = 'rgba(11, 69, 132, 0.35)';
      ctx.strokeRect(x2, y2, w2, h2);

      ctx.fillStyle = '#0B4584';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('02. PIASTRA STRUTTURALE FATO', x2 + 16, y2 + 30);
      ctx.fillStyle = '#081C33';
      ctx.font = '13px sans-serif';
      ctx.fillText('Resistenza a carichi rotorici & alloggiamenti tecnici', x2 + 16, y2 + 50);

      // Section of slab edge & kerb
      const pX = x2 + 30;
      const pY = y2 + 90;
      const pW = w2 - 60;

      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // chamfered profile
      ctx.moveTo(pX, pY + 30);
      ctx.lineTo(pX + 30, pY);
      ctx.lineTo(pX + pW - 30, pY);
      ctx.lineTo(pX + pW, pY + 30);
      ctx.lineTo(pX + pW, pY + 180);
      ctx.lineTo(pX, pY + 180);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(11, 69, 132, 0.05)';
      ctx.fill();

      // Steel rebar distribution grid
      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 1.2;
      for (let rx = pX + 40; rx < pX + pW - 30; rx += 35) {
        ctx.beginPath();
        ctx.arc(rx, pY + 45, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#0B4584';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rx, pY + 140, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic load arrows
      ctx.strokeStyle = '#E31E24';
      ctx.lineWidth = 2;
      const arrowXs = [pX + 110, pX + 220, pX + 330];
      arrowXs.forEach((ax) => {
        ctx.beginPath();
        ctx.moveTo(ax, pY - 45);
        ctx.lineTo(ax, pY - 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax - 6, pY - 20);
        ctx.lineTo(ax, pY - 8);
        ctx.lineTo(ax + 6, pY - 20);
        ctx.stroke();
      });
      ctx.fillStyle = '#E31E24';
      ctx.font = '11px monospace';
      ctx.fillText('CARICO CONCENTRATO STATICO & DINAMICO (MTOW)', pX + 45, pY - 55);

      // Embedded conduit duct
      const ductY = pY + 230;
      ctx.strokeStyle = '#081C33';
      ctx.strokeRect(pX + 20, ductY, pW - 40, 60);
      ctx.fillStyle = 'rgba(8, 28, 51, 0.05)';
      ctx.fillRect(pX + 20, ductY, pW - 40, 60);

      // 3 cable runs inside
      const cableColors = ['#0B4584', '#E31E24', '#0B4584'];
      cableColors.forEach((cc, cIdx) => {
        ctx.strokeStyle = cc;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pX + 40, ductY + 18 + cIdx * 14);
        ctx.lineTo(pX + pW - 60, ductY + 18 + cIdx * 14);
        ctx.stroke();
      });
      ctx.fillStyle = '#081C33';
      ctx.fillText('CANALETTA DI SERVIZIO PASSACAVI ACCESSIBILE', pX + 26, ductY + 90);

      ctx.restore();
    }

    // SYSTEM 03: Cerchio TLOF & Marcatura H (Center)
    const v3 = visibilities[2];
    if (v3 > 0.01) {
      ctx.save();
      ctx.globalAlpha = v3;
      const x3 = m + 600;
      const y3 = m + 110;
      const w3 = 760;
      const h3 = 1100;

      ctx.strokeStyle = 'rgba(11, 69, 132, 0.35)';
      ctx.strokeRect(x3, y3, w3, h3);

      ctx.fillStyle = '#0B4584';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('03. GEOMETRIA OTTICA TLOF & MARCATURA H', x3 + 24, y3 + 34);
      ctx.fillStyle = '#081C33';
      ctx.font = '13px sans-serif';
      ctx.fillText('Segnaletica di terra ad alta riflettenza & assi di allineamento', x3 + 24, y3 + 56);

      // Large central orthographic plan
      const cX = x3 + w3 / 2;
      const cY = y3 + 520;
      const ringR = 240;

      // Outer bounding square (FATO edge representation)
      ctx.strokeStyle = 'rgba(11, 69, 132, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cX - 300, cY - 300, 600, 600);

      // Sighting diagonal axes
      ctx.strokeStyle = 'rgba(11, 69, 132, 0.2)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(cX - 320, cY - 320);
      ctx.lineTo(cX + 320, cY + 320);
      ctx.moveTo(cX - 320, cY + 320);
      ctx.lineTo(cX + 320, cY - 320);
      ctx.moveTo(cX - 340, cY);
      ctx.lineTo(cX + 340, cY);
      ctx.moveTo(cX, cY - 340);
      ctx.lineTo(cX, cY + 340);
      ctx.stroke();
      ctx.setLineDash([]);

      // TLOF outer white ring
      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cX, cY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Inner concentric safety ring (yellow aviation)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cX, cY, ringR - 22, 0, Math.PI * 2);
      ctx.stroke();

      // Central 'H' marking
      const barW = 32;
      const barH = 190;
      const crossW = 105;

      ctx.fillStyle = '#0B4584';
      // Left vertical
      ctx.fillRect(cX - 65 - barW / 2, cY - barH / 2, barW, barH);
      // Right vertical
      ctx.fillRect(cX + 65 - barW / 2, cY - barH / 2, barW, barH);
      // Crossbar
      ctx.fillRect(cX - crossW / 2, cY - barW / 2, crossW, barW);

      // Orientation Heading Triangle (Alidaunia Red)
      ctx.fillStyle = '#E31E24';
      ctx.beginPath();
      ctx.moveTo(cX, cY - ringR + 35);
      ctx.lineTo(cX - 24, cY - ringR + 75);
      ctx.lineTo(cX + 24, cY - ringR + 75);
      ctx.closePath();
      ctx.fill();

      // Radial angle notations
      ctx.fillStyle = '#081C33';
      ctx.font = '11px monospace';
      ctx.fillText('DIREZIONE PREVALENTE DI APPROCCIO', cX - 115, cY - ringR - 15);
      ctx.fillText('D-VALUE / DIAMETRO TLOF DI PROGETTO', cX - 120, cY + ringR + 32);

      // Dimension extension tick lines
      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cX - ringR, cY + ringR + 45);
      ctx.lineTo(cX + ringR, cY + ringR + 45);
      ctx.moveTo(cX - ringR, cY + ringR + 38);
      ctx.lineTo(cX - ringR, cY + ringR + 52);
      ctx.moveTo(cX + ringR, cY + ringR + 38);
      ctx.lineTo(cX + ringR, cY + ringR + 52);
      ctx.stroke();

      ctx.restore();
    }

    // SYSTEM 04: Circuito Luci Perimetrali & Antincendio (Top Right)
    const v4 = visibilities[3];
    if (v4 > 0.01) {
      ctx.save();
      ctx.globalAlpha = v4;
      const x4 = m + 1380;
      const y4 = m + 110;
      const w4 = 540;
      const h4 = 500;

      ctx.strokeStyle = 'rgba(11, 69, 132, 0.35)';
      ctx.strokeRect(x4, y4, w4, h4);

      ctx.fillStyle = '#0B4584';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('04. CIRCUITO AVL & ANTINCENDIO', x4 + 16, y4 + 30);
      ctx.fillStyle = '#081C33';
      ctx.font = '13px sans-serif';
      ctx.fillText('Segnalatori ottici perimetrali in serie & nodi di sicurezza', x4 + 16, y4 + 50);

      // Loop circuit electrical diagram
      const eX = x4 + 40;
      const eY = y4 + 100;
      const eW = w4 - 80;
      const eH = 260;

      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(eX, eY, eW, eH);

      // Circuit lights on perimeter
      const numLights = 8;
      for (let i = 0; i < numLights; i++) {
        const lx = eX + (eW * i) / (numLights - 1);
        // Top row
        drawFixture(lx, eY, '#10B981');
        // Bottom row
        drawFixture(lx, eY + eH, '#10B981');
      }
      for (let j = 1; j < 4; j++) {
        const ly = eY + (eH * j) / 4;
        // Left column
        drawFixture(eX, ly, '#F59E0B');
        // Right column
        drawFixture(eX + eW, ly, '#F59E0B');
      }

      function drawFixture(fx: number, fy: number, col: string) {
        if (!ctx) return;
        ctx.fillStyle = '#081C33';
        ctx.fillRect(fx - 7, fy - 7, 14, 14);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Legend
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(eX + 15, eY + eH + 50, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#081C33';
      ctx.font = '11px monospace';
      ctx.fillText('PROIETTORI PERIMETRALI VERDI (TLOF)', eX + 30, eY + eH + 54);

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(eX + 15, eY + eH + 75, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#081C33';
      ctx.fillText('SEGNALATORI AMBRA ASSE DI ALLINEAMENTO', eX + 30, eY + eH + 79);

      ctx.fillStyle = '#E31E24';
      ctx.fillRect(eX + 10, eY + eH + 95, 10, 10);
      ctx.fillStyle = '#081C33';
      ctx.fillText('COLONNINA IDRANTE & GRUPPO SCHIUMA', eX + 30, eY + eH + 104);

      ctx.restore();
    }

    // SYSTEM 05: Fascia di Sicurezza & Vie di Transito (Bottom Right)
    const v5 = visibilities[4];
    if (v5 > 0.01) {
      ctx.save();
      ctx.globalAlpha = v5;
      const x5 = m + 1380;
      const y5 = m + 630;
      const w5 = 540;
      const h5 = 580;

      ctx.strokeStyle = 'rgba(11, 69, 132, 0.35)';
      ctx.strokeRect(x5, y5, w5, h5);

      ctx.fillStyle = '#0B4584';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('05. FASCIA DI SICUREZZA & VIE OPERATIVE', x5 + 16, y5 + 30);
      ctx.fillStyle = '#081C33';
      ctx.font = '13px sans-serif';
      ctx.fillText('Area libera da ostacoli, manica a vento & corridoi', x5 + 16, y5 + 50);

      // Clearance safety zone boundary envelope
      const sX = x5 + 35;
      const sY = y5 + 95;
      const sW = w5 - 70;

      ctx.strokeStyle = 'rgba(227, 30, 36, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(sX, sY, sW, 200);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(227, 30, 36, 0.03)';
      ctx.fillRect(sX, sY, sW, 200);

      ctx.fillStyle = '#E31E24';
      ctx.font = '11px monospace';
      ctx.fillText('LIMITE SUP. PRIVA DI OSTACOLI (OFS)', sX + 16, sY + 28);

      // Circulation path with directional chevron
      ctx.strokeStyle = '#0B4584';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sX + 30, sY + 120);
      ctx.lineTo(sX + sW - 40, sY + 120);
      ctx.stroke();

      for (let chX = sX + 80; chX < sX + sW - 60; chX += 80) {
        ctx.beginPath();
        ctx.moveTo(chX - 10, sY + 112);
        ctx.lineTo(chX, sY + 120);
        ctx.lineTo(chX - 10, sY + 128);
        ctx.stroke();
      }
      ctx.fillStyle = '#0B4584';
      ctx.fillText('PERCORSO PROTETTO PERSONALE DI TERRA / MEDICO', sX + 30, sY + 105);

      // Windsock mast schematic node
      const wsockX = sX + sW - 70;
      const wsockY = sY + 360;
      ctx.strokeStyle = '#081C33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wsockX, wsockY, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Mast pole line & wind arrow
      ctx.beginPath();
      ctx.moveTo(wsockX, wsockY - 45);
      ctx.lineTo(wsockX, wsockY + 45);
      ctx.stroke();

      ctx.fillStyle = '#E31E24';
      ctx.beginPath();
      ctx.moveTo(wsockX + 15, wsockY - 10);
      ctx.lineTo(wsockX + 55, wsockY - 20);
      ctx.lineTo(wsockX + 45, wsockY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#081C33';
      ctx.font = '11px monospace';
      ctx.fillText('STAZIONE ANEMOMETRICA & MANICA A VENTO ILLUMINATA', sX + 15, wsockY + 80);

      ctx.restore();
    }

    drawingTexture.needsUpdate = true;
  }

  // ========================================================
  // 3D REAL CURVED / SUBDIVIDED PAPER MESH
  // ========================================================
  const paperWidth = 15.0;
  const paperHeight = 10.0;
  const segsX = 110;
  const segsZ = 28;

  const paperGeometry = new THREE.PlaneGeometry(paperWidth, paperHeight, segsX, segsZ);
  // Store base original flat positions
  const posAttr = paperGeometry.attributes.position;
  const originalX = new Float32Array(posAttr.count);
  const originalY = new Float32Array(posAttr.count);
  const originalZ = new Float32Array(posAttr.count);

  for (let i = 0; i < posAttr.count; i++) {
    originalX[i] = posAttr.getX(i);
    originalY[i] = posAttr.getY(i);
    originalZ[i] = posAttr.getZ(i);
  }

  const paperMaterial = new THREE.MeshStandardMaterial({
    map: drawingTexture,
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });

  const paperMesh = new THREE.Mesh(paperGeometry, paperMaterial);
  // PlaneGeometry is on XY plane by default; rotate so it lies on XZ plane
  paperMesh.rotation.x = -Math.PI / 2;
  paperMesh.castShadow = !mobile;
  paperMesh.receiveShadow = true;
  scene.add(paperMesh);

  // Subtle brass drafting ruler/weight on left edge pinning the paper
  const rulerGeom = new THREE.BoxGeometry(0.35, 0.12, 10.4);
  const rulerMat = new THREE.MeshStandardMaterial({
    color: 0xc49a45,
    roughness: 0.35,
    metalness: 0.85,
  });
  const rulerMesh = new THREE.Mesh(rulerGeom, rulerMat);
  rulerMesh.position.set(-paperWidth / 2 + 0.15, 0.06, 0);
  rulerMesh.castShadow = !mobile;
  scene.add(rulerMesh);

  let disposed = false;
  let isVisible = true;
  let progress = 0;
  let frame = 0;
  let lastDrawnProgress = -1;

  function updatePaperDeformation(unrollProgress: number) {
    // When unrollProgress is 0: the left 16% is flat on the drafting table, the remaining 84% is rolled in a coil
    // As unrollProgress reaches 1: 100% of the paper lies flat on the table
    const flatFrac = 0.16 + 0.84 * unrollProgress;
    const rollStart = -paperWidth / 2 + paperWidth * flatFrac;
    const baseRadius = 0.55 + 0.95 * (1 - unrollProgress);

    for (let i = 0; i < posAttr.count; i++) {
      const origX = originalX[i];
      const origY = originalY[i]; // in plane geometry local space, Y maps to depth Z in world

      if (origX <= rollStart) {
        // Flat part on table
        const normalizedFlat = (origX + paperWidth / 2) / (paperWidth * flatFrac);
        // Gentle paper tension wave
        const wave = Math.sin(normalizedFlat * Math.PI) * 0.015 * (1 - unrollProgress);
        posAttr.setXYZ(i, origX, origY, wave);
      } else {
        // Rolled coil curvature
        const arcLength = origX - rollStart;
        const theta = arcLength / baseRadius;
        // Expand radius slightly with spiral coil winding
        const spiralR = baseRadius + 0.035 * (theta / (Math.PI * 2));

        const curX = rollStart + spiralR * Math.sin(theta);
        const curZ = spiralR * (1 - Math.cos(theta)); // in plane local space, Z points along normal
        posAttr.setXYZ(i, curX, origY, curZ);
      }
    }

    paperGeometry.computeVertexNormals();
    posAttr.needsUpdate = true;
  }

  function pose(p: number) {
    if (disposed) return;
    const state: ProjectDrawingState = computeProjectDrawingState(p);

    // 1. Paper unrolling curvature
    updatePaperDeformation(state.unrollProgress);

    // 2. Linework drawing update (only re-render canvas when needed)
    const roundedDraw = Math.round(state.drawingProgress * 50) / 50;
    if (roundedDraw !== lastDrawnProgress) {
      lastDrawnProgress = roundedDraw;
      renderDrawingToCanvas(state.systemVisibilities, state.drawingProgress);
    }

    // 3. Camera position
    camera.position.set(...state.cameraPosition);
    camera.lookAt(...state.cameraTarget);
  }

  function render() {
    frame = 0;
    if (!disposed && isVisible) {
      renderer.render(scene, camera);
    }
  }

  function invalidate() {
    if (!disposed && isVisible && !frame) {
      frame = requestAnimationFrame(render);
    }
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // Visibility Gate: only render when stage intersects viewport
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          invalidate();
        }
      }
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(container);

  // Initial drawing canvas render & pose
  renderDrawingToCanvas(
    options.reducedMotion ? [1, 1, 1, 1, 1] : [0, 0, 0, 0, 0],
    options.reducedMotion ? 1 : 0
  );
  pose(options.reducedMotion ? 0.85 : progress);
  resize();
  options.onReady?.();
  invalidate();

  return {
    setProgress(p: number) {
      if (disposed) return;
      progress = THREE.MathUtils.clamp(p, 0, 1);
      pose(progress);
      invalidate();
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      paperGeometry.dispose();
      paperMaterial.dispose();
      drawingTexture.dispose();
      tableMesh.geometry.dispose();
      (tableMesh.material as THREE.Material).dispose();
      rulerGeom.dispose();
      rulerMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
