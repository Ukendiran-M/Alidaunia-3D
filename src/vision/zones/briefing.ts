/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Briefing room (ground floor of the annex): a white briefing table beside the
 * glazed hangar wall with an open Alidaunia project dossier. Its three folio
 * sheets — requirements (Cliente), coordinated drawing (Progetto) and handover
 * record (Gestione) — slide a short distance into one aligned dossier.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, dossierAlignment, lerp } from '../../utils/visionJourney';
import { BRAND, contactShadowTexture, dossierCover, folioSheet } from '../artwork';
import { meterBox, shadowed, useArtwork, type Zone, type ZoneContext } from '../geometry';

const A = LAYOUT.annex;
const T = LAYOUT.briefingTable;
const D = LAYOUT.dossier;
const SHEET_W = 0.42;
const SHEET_H = 0.297;
const PANEL_W = 0.445;
const PANEL_H = 0.315;

/** Flat sheet readable from the +Z side (top edge towards −Z). */
const flat = (w: number, h: number) => new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2);

/** Start (spread on the table) and settled (fanned in the dossier) placements, relative to the dossier's right panel. */
const FOLIO = [
  { kind: 'cliente' as const, from: [-0.26, 0.43, 0.3], to: [0.0, 0.0, 0.015] },
  { kind: 'progetto' as const, from: [0.3, 0.52, -0.3], to: [0.014, -0.016, -0.012] },
  { kind: 'gestione' as const, from: [0.5, -0.28, 0.45], to: [0.028, -0.032, 0.008] },
];

export function buildBriefing(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'briefing';
  const { materials } = ctx;
  const brushed = new THREE.MeshStandardMaterial({ color: '#b9c0c6', metalness: 0.95, roughness: 0.32, ...materials.maps('metal', 0.4), envMapIntensity: 1.7 });
  const tableTop = new THREE.MeshPhysicalMaterial({ color: '#f4f4f1', roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  const upholstery = new THREE.MeshStandardMaterial({ color: '#1b2f4a', roughness: 0.85 });
  const navy = new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.55 });
  const shadowMap = materials.adopt(contactShadowTexture(128, 0.4));
  const contact = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: shadowMap, transparent: true, opacity: 0.3, depthWrite: false });

  // Table: slim top on two brushed T-legs.
  const tx = (T.x0 + T.x1) / 2;
  const tz = (T.z0 + T.z1) / 2;
  group.add(shadowed(new THREE.Mesh(meterBox(T.x1 - T.x0, 0.04, T.z1 - T.z0).translate(tx, T.top - 0.02, tz), tableTop), ctx));
  const legs: THREE.BufferGeometry[] = [];
  for (const lz of [T.z0 + 0.45, T.z1 - 0.45]) {
    legs.push(meterBox(0.08, T.top - 0.06, 0.08).translate(tx, (T.top - 0.04) / 2, lz));
    legs.push(meterBox(T.x1 - T.x0 - 0.3, 0.03, 0.09).translate(tx, 0.015, lz));
    legs.push(meterBox(T.x1 - T.x0 - 0.3, 0.03, 0.06).translate(tx, T.top - 0.055, lz));
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(legs)!, brushed), ctx));

  // Six chairs.
  const seat = meterBox(0.46, 0.06, 0.46).translate(0, 0.46, 0);
  const back = meterBox(0.05, 0.44, 0.44).translate(-0.24, 0.74, 0);
  const chairLegs = [-0.19, 0.19].flatMap((a) => [-0.19, 0.19].map((b) => meterBox(0.025, 0.44, 0.025).translate(a, 0.22, b)));
  const chairSeat = mergeGeometries([seat, back])!;
  const chairFrame = mergeGeometries(chairLegs)!;
  const seats = new THREE.InstancedMesh(chairSeat, upholstery, 6);
  const frames = new THREE.InstancedMesh(chairFrame, brushed, 6);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  [-18.1, -16.85, -15.6].forEach((z, i) => {
    for (const [k, x, yaw] of [[0, T.x0 - 0.42, 0.04], [1, T.x1 + 0.42, Math.PI - 0.05]] as [number, number, number][]) {
      m.compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw + (i - 1) * 0.06), one);
      seats.setMatrixAt(i * 2 + k, m);
      frames.setMatrixAt(i * 2 + k, m);
    }
  });
  group.add(shadowed(seats, ctx), shadowed(frames, ctx));

  // Open dossier: inside of the cover (branded) on the left, sheets settling on the right.
  const cover = dossierCover();
  const sheets = FOLIO.map((f) => folioSheet(f.kind));
  const ready = useArtwork(ctx, cover, ...sheets);
  const dossier = new THREE.Group();
  dossier.position.set(D[0], T.top, D[2]);
  dossier.rotation.y = 0.08;
  const board = new THREE.Mesh(
    mergeGeometries([meterBox(PANEL_W, 0.004, PANEL_H).translate(-PANEL_W / 2 - 0.006, 0.002, 0), meterBox(PANEL_W, 0.004, PANEL_H).translate(PANEL_W / 2 + 0.006, 0.002, 0), meterBox(0.012, 0.006, PANEL_H).translate(0, 0.003, 0)])!,
    navy,
  );
  const coverFace = new THREE.Mesh(flat(PANEL_W - 0.01, PANEL_H - 0.01), new THREE.MeshStandardMaterial({ map: cover.texture, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1 }));
  coverFace.position.set(-PANEL_W / 2 - 0.006, 0.0042, 0);
  const shadowUnder = new THREE.Mesh(flat(PANEL_W * 2 + 0.08, PANEL_H + 0.06), contact);
  shadowUnder.position.y = 0.0008;
  dossier.add(shadowUnder, board, coverFace);
  group.add(dossier);

  const paper = sheets.map((art) => new THREE.MeshStandardMaterial({ map: art.texture, roughness: 0.85 }));
  const edgePaper = new THREE.MeshStandardMaterial({ color: '#efede6', roughness: 0.9 });
  const folio = FOLIO.map((f, i) => {
    const holder = new THREE.Group();
    const body = new THREE.Mesh(meterBox(SHEET_W, 0.0012, SHEET_H), edgePaper);
    const face = new THREE.Mesh(flat(SHEET_W, SHEET_H), paper[i]);
    face.position.y = 0.00062;
    const shadow = new THREE.Mesh(flat(SHEET_W * 1.14, SHEET_H * 1.18), contact);
    shadow.position.y = -0.0005;
    holder.add(shadow, body, face);
    dossier.add(holder);
    return { holder, f, layer: i };
  });

  // Framed print of the same plan on the outer wall, and a linear pendant over the table.
  const print = folioSheet('progetto', 1024, 724);
  useArtwork(ctx, print);
  const frame = new THREE.Group();
  frame.add(new THREE.Mesh(meterBox(0.05, 0.96, 1.34), navy));
  const printFace = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.876), new THREE.MeshStandardMaterial({ map: print.texture, roughness: 0.7 }));
  printFace.rotation.y = -Math.PI / 2;
  printFace.position.x = -0.03;
  frame.add(printFace);
  frame.position.set(A.x1 - 0.05, 1.6, tz);
  group.add(frame);
  const pendant = new THREE.Group();
  pendant.add(new THREE.Mesh(meterBox(0.14, 0.05, 2.6), brushed));
  const diffuser = new THREE.Mesh(meterBox(0.1, 0.005, 2.5), new THREE.MeshBasicMaterial({ color: '#fdf9f0' }));
  diffuser.position.y = -0.027;
  pendant.add(diffuser);
  pendant.add(new THREE.Mesh(mergeGeometries([new THREE.CylinderGeometry(0.003, 0.003, A.slab - 2.4, 4).translate(0, (A.slab - 2.4) / 2, -1.1), new THREE.CylinderGeometry(0.003, 0.003, A.slab - 2.4, 4).translate(0, (A.slab - 2.4) / 2, 1.1)])!, brushed));
  pendant.position.set(tx, 2.4, tz);
  group.add(pendant);

  const pendantLight = new THREE.PointLight('#fff3e2', 16, 0, 2);
  pendantLight.position.set(tx, 2.25, tz);
  const roomLight = new THREE.PointLight('#f6f4ef', 22, 0, 2);
  roomLight.position.set(22.6, A.slab - 0.3, -10);

  return {
    group,
    lights: [pendantLight, roomLight],
    ready,
    update(s) {
      const t = dossierAlignment(s);
      folio.forEach(({ holder, f, layer }) => {
        // Each sheet moves only a short distance, staggered slightly, and settles flat.
        const k = THREE.MathUtils.clamp(t * 1.25 - layer * 0.12, 0, 1);
        const e = k * k * (3 - 2 * k);
        const base = PANEL_W / 2 + 0.006;
        holder.position.set(base + lerp(f.from[0], f.to[0], e), 0.0055 + layer * 0.0014, lerp(f.from[1], f.to[1], e));
        holder.rotation.y = lerp(f.from[2], f.to[2], e);
      });
    },
  };
}
