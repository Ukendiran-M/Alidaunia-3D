/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Planning studio (upper floor of the annex), overlooking the aircraft bay:
 * a large drafting table carrying the layout drawing of this base, reference
 * sheets for the planning context and an inspection/handover sheet. The
 * drawing develops with the three Mission groups (drawingState).
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, drawingState, lerp } from '../../utils/visionJourney';
import { BRAND, boardDrawing, contactShadowTexture, handoverSheet, referenceSheet } from '../artwork';
import { meterBox, shadowed, useArtwork, type Zone, type ZoneContext } from '../geometry';

const A = LAYOUT.annex;
const T = LAYOUT.draftingTable;
const TILT = THREE.MathUtils.degToRad(12);

/** A flat sheet lying with its top edge towards −X (readable from the studio floor looking at the glazing). */
function sheet(width: number, height: number, map: THREE.Texture, transparent = false) {
  const geometry = new THREE.PlaneGeometry(width, height).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ map, roughness: 0.8, transparent, depthWrite: !transparent, polygonOffset: true, polygonOffsetFactor: -1 }),
  );
}

export function buildStudio(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'studio';
  const { materials, mobile } = ctx;
  const anodised = new THREE.MeshStandardMaterial({ color: '#b3bbc2', metalness: 0.9, roughness: 0.35, ...materials.maps('metal', 0.5, Math.PI / 2), envMapIntensity: 1.6 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: '#2d3540', metalness: 0.6, roughness: 0.45 });
  const boardSurface = new THREE.MeshStandardMaterial({ color: '#b9c6c0', roughness: 0.75 });
  const worktop = new THREE.MeshStandardMaterial({ color: '#3a434e', roughness: 0.55, metalness: 0.2 });
  const navy = new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.45, metalness: 0.2 });
  const shadowMap = materials.adopt(contactShadowTexture(128, 0.4));
  const contact = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: shadowMap, transparent: true, opacity: 0.28, depthWrite: false });

  // Drafting table: tilted board on a steel frame.
  const cx = (T.x0 + T.x1) / 2;
  const cz = (T.z0 + T.z1) / 2;
  const depth = T.x1 - T.x0;
  const length = T.z1 - T.z0;
  const nearEdge = A.upper + 0.92;
  const board = new THREE.Group();
  board.position.set(cx, nearEdge + (depth / 2) * Math.sin(TILT), cz);
  board.rotation.z = -TILT;
  board.add(shadowed(new THREE.Mesh(meterBox(depth, 0.035, length), boardSurface), ctx));
  board.add(new THREE.Mesh(meterBox(0.03, 0.05, length), anodised).translateX(depth / 2 - 0.015).translateY(0.03));
  const drawing = boardDrawing(mobile ? 1536 : 2048, mobile ? 768 : 1024);
  const paperW = length - 0.2;
  const paperH = paperW / 2;
  const layers = [drawing.context, drawing.construction, drawing.review].map((art, i) => {
    const mesh = sheet(paperW, paperH, art.texture, i > 0);
    mesh.position.y = 0.019 + i * 0.0006;
    board.add(mesh);
    return mesh;
  });
  group.add(board);
  const legs = [
    meterBox(0.06, 0.92, 0.06).translate(T.x1 - 0.08, A.upper + 0.46, T.z0 + 0.1),
    meterBox(0.06, 0.92, 0.06).translate(T.x1 - 0.08, A.upper + 0.46, T.z1 - 0.1),
    meterBox(0.06, 1.18, 0.06).translate(T.x0 + 0.08, A.upper + 0.59, T.z0 + 0.1),
    meterBox(0.06, 1.18, 0.06).translate(T.x0 + 0.08, A.upper + 0.59, T.z1 - 0.1),
    meterBox(0.04, 0.04, length - 0.2).translate(T.x1 - 0.08, A.upper + 0.25, cz),
    meterBox(0.04, 0.04, length - 0.2).translate(T.x0 + 0.08, A.upper + 0.25, cz),
  ];
  group.add(shadowed(new THREE.Mesh(mergeGeometries(legs)!, darkSteel), ctx));

  // Side worktops with the reference sheets (context) and the handover sheet (review).
  const tops: THREE.BufferGeometry[] = [];
  const topLegs: THREE.BufferGeometry[] = [];
  for (const w of LAYOUT.sideWorktops) {
    const wx = (w.x0 + w.x1) / 2;
    const wz = (w.z0 + w.z1) / 2;
    tops.push(meterBox(w.x1 - w.x0, 0.035, w.z1 - w.z0).translate(wx, w.top - 0.0175, wz));
    for (const sz of [w.z0 + 0.06, w.z1 - 0.06]) topLegs.push(meterBox(w.x1 - w.x0 - 0.1, 0.04, 0.04).translate(wx, A.upper + 0.05, sz), meterBox(0.04, w.top - A.upper - 0.05, 0.04).translate(wx, (w.top + A.upper) / 2, sz));
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(tops)!, worktop), ctx));
  group.add(new THREE.Mesh(mergeGeometries(topLegs)!, anodised));

  const contextSheet = referenceSheet('context');
  const sectionSheet = referenceSheet('section');
  const handover = handoverSheet();
  const ready = useArtwork(ctx, drawing.context, drawing.construction, drawing.review, contextSheet, sectionSheet, handover);
  const [ref] = LAYOUT.sideWorktops;
  const placeSheet = (mesh: THREE.Mesh, x: number, y: number, z: number, rot: number, w: number, h: number) => {
    const holder = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.12, h * 1.12).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), contact);
    shadow.position.y = -0.0015;
    holder.add(shadow, mesh);
    holder.position.set(x, y, z);
    holder.rotation.y = rot;
    group.add(holder);
    return holder;
  };
  placeSheet(sheet(0.59, 0.42, contextSheet.texture), ref.x0 + 0.42, ref.top + 0.002, ref.z0 + 0.38, 0.06, 0.59, 0.42);
  placeSheet(sheet(0.59, 0.42, sectionSheet.texture), ref.x0 + 0.78, ref.top + 0.004, ref.z1 - 0.42, -0.1, 0.59, 0.42);
  const [, rev] = LAYOUT.sideWorktops;
  const handoverHolder = placeSheet(sheet(0.297, 0.42, handover.texture), rev.x0 + 0.6, rev.top + 0.002, (rev.z0 + rev.z1) / 2, 0, 0.297, 0.42);
  const handoverRest = handoverHolder.position.clone();

  // Scale rule and pencil on the board ledge.
  const rule = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.6, 3), anodised);
  rule.rotation.x = Math.PI / 2;
  rule.position.set(T.x1 - 0.1, nearEdge + 0.04, cz + 0.6);
  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.17, 8), new THREE.MeshStandardMaterial({ color: BRAND.blue, roughness: 0.4 }));
  pencil.rotation.set(Math.PI / 2, 0, 0.4);
  pencil.position.set(T.x1 - 0.12, nearEdge + 0.03, cz - 0.4);
  group.add(rule, pencil);

  // Suspended task light over the board and a drafting stool.
  const lampHead = new THREE.Vector3(cx - 0.1, nearEdge + 1.15, cz);
  const ceilingY = A.roof - 0.26;
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, ceilingY - lampHead.y, 6).translate(lampHead.x, (ceilingY + lampHead.y) / 2, lampHead.z), anodised));
  const head = new THREE.Mesh(meterBox(0.22, 0.05, 1.4), navy);
  head.position.copy(lampHead);
  group.add(head);
  const bulb = new THREE.Mesh(meterBox(0.16, 0.004, 1.3), new THREE.MeshBasicMaterial({ color: '#fff6e4' }));
  bulb.position.copy(lampHead).add(new THREE.Vector3(0, -0.027, 0));
  group.add(bulb);
  const stool = [
    new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24).translate(T.x1 + 0.75, A.upper + 0.68, cz + 0.2),
    new THREE.CylinderGeometry(0.025, 0.025, 0.62, 12).translate(T.x1 + 0.75, A.upper + 0.34, cz + 0.2),
    new THREE.CylinderGeometry(0.26, 0.26, 0.03, 5).translate(T.x1 + 0.75, A.upper + 0.05, cz + 0.2),
  ];
  group.add(shadowed(new THREE.Mesh(mergeGeometries(stool)!, darkSteel), ctx));

  // Navy plan chest on the outer wall and linear ceiling lights.
  group.add(shadowed(new THREE.Mesh(meterBox(0.9, 0.95, 1.8).translate(A.x1 - 0.5, A.upper + 0.475, -14), navy), ctx));
  const ceiling = A.roof - 0.26;
  const strips = new THREE.Mesh(
    mergeGeometries([meterBox(0.16, 0.03, 13).translate(18.4, ceiling, -12.5), meterBox(0.16, 0.03, 13).translate(21.8, ceiling, -12.5)])!,
    new THREE.MeshBasicMaterial({ color: '#fbf8f1' }),
  );
  group.add(strips);

  const room = new THREE.PointLight('#fff4e6', 22, 0, 2);
  room.position.set(20.2, ceiling - 0.3, -12.5);
  const task = new THREE.SpotLight('#fff1dc', 5, 0, 0.95, 0.9, 2);
  task.position.copy(lampHead).add(new THREE.Vector3(0, -0.05, 0));
  task.target.position.set(cx, nearEdge + 0.15, cz);
  ctx.scene.add(task.target);

  return {
    group,
    lights: mobile ? [room] : [room, task],
    ready,
    update(s) {
      const d = drawingState(s);
      (layers[1].material as THREE.MeshStandardMaterial).opacity = d.construction;
      (layers[2].material as THREE.MeshStandardMaterial).opacity = d.review;
      layers[1].visible = d.construction > 0.001;
      layers[2].visible = d.review > 0.001;
      // The handover sheet slides in beside the drawing as the plan is reviewed.
      handoverHolder.position.set(handoverRest.x + lerp(0.32, 0, d.review), handoverRest.y, handoverRest.z + lerp(0.18, 0, d.review));
      handoverHolder.rotation.y = lerp(0.45, 0.02, d.review);
    },
  };
}
