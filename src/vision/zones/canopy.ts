/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V5 — shared tensile canopy: one woven ivory membrane held by three masts
 * (Cliente, Progetto, Gestione), with blue edge ropes and simple anchoring
 * hardware. Tension and the final lift are authored parametric deformations
 * (canopyState), so every run produces exactly the same surface.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, canopyState, lerp, type Vec3 } from '../../utils/visionJourney';
import { createDynamicTube, floorPlane, meterBox, segmentMatrix, shadowed, type Zone, type ZoneContext } from '../geometry';

const { cliente, progetto, gestione } = LAYOUT.canopy;
const LIFT = 9;

/** Masts stand just outside each membrane corner. */
function mastBase(corner: Vec3): THREE.Vector3 {
  const centroid = new THREE.Vector3((cliente[0] + progetto[0] + gestione[0]) / 3, 0, (cliente[2] + progetto[2] + gestione[2]) / 3);
  const c = new THREE.Vector3(corner[0], 0, corner[2]);
  return c.add(c.clone().sub(centroid).setY(0).normalize().multiplyScalar(1.1));
}

export function buildCanopy(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V5-canopy';
  const { materials, mobile } = ctx;
  const n = mobile ? 26 : 40;

  const fabric = new THREE.MeshPhysicalMaterial({
    color: '#efe8db',
    roughness: 1,
    ...materials.maps('fabric', 0.32),
    normalScale: new THREE.Vector2(0.45, 0.45),
    sheen: 0.6,
    sheenColor: new THREE.Color('#fff6e6'),
    sheenRoughness: 0.55,
    // Daylight transmitted through the weave lifts the underside.
    emissive: new THREE.Color('#f3ead8'),
    emissiveIntensity: 0.16,
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
  });
  const rope = new THREE.MeshStandardMaterial({ color: '#0b4584', roughness: 0.42, metalness: 0.1 });
  const mastPaint = new THREE.MeshStandardMaterial({ color: '#e8ebee', roughness: 0.38, metalness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: '#a9aeb4', metalness: 1, roughness: 0.6, ...materials.maps('metal', 0.5), envMapIntensity: 1.8 });
  const paving = new THREE.MeshStandardMaterial({
    color: '#d9d4ca',
    roughness: 6.5,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2.5, 2.5),
  });

  // Barycentric grid over the three corners.
  const bary: [number, number, number][] = [];
  const rowStart: number[] = [];
  for (let r = 0; r <= n; r++) {
    rowStart.push(bary.length);
    for (let c = 0; c <= n - r; c++) bary.push([1 - (r + c) / n, r / n, c / n]); // [cliente, progetto, gestione]
  }
  const index: number[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n - r; c++) {
      const a = rowStart[r] + c;
      const b = rowStart[r + 1] + c;
      index.push(a, a + 1, b);
      if (c < n - r - 1) index.push(a + 1, b + 1, b);
    }
  }
  const position = new THREE.BufferAttribute(new Float32Array(bary.length * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uv = new THREE.BufferAttribute(new Float32Array(bary.length * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const membraneGeometry = new THREE.BufferGeometry();
  membraneGeometry.setAttribute('position', position);
  membraneGeometry.setAttribute('uv', uv);
  membraneGeometry.setIndex(index);
  const membrane = new THREE.Mesh(membraneGeometry, fabric);
  group.add(shadowed(membrane, ctx));

  // Edge ropes along the three free edges.
  const edgeRows: number[][] = [
    Array.from({ length: n + 1 }, (_, c) => rowStart[0] + c), // cliente → gestione (far edge)
    Array.from({ length: n + 1 }, (_, r) => rowStart[r]), // cliente → progetto
    Array.from({ length: n + 1 }, (_, r) => rowStart[r] + (n - r)), // gestione → progetto
  ];
  const tubes = edgeRows.map(() => createDynamicTube(n, 8, 0.11));
  tubes.forEach((t) => group.add(new THREE.Mesh(t.geometry, rope)));

  // Masts with backstays and base plates.
  const corners = [cliente, progetto, gestione];
  const heights = [24, 22, 24];
  const bases = corners.map(mastBase);
  const mastParts: THREE.BufferGeometry[] = [];
  const steelParts: THREE.BufferGeometry[] = [];
  const centroid = new THREE.Vector3();
  bases.forEach((b) => centroid.add(b));
  centroid.divideScalar(3);
  bases.forEach((b, i) => {
    mastParts.push(new THREE.CylinderGeometry(0.2, 0.34, heights[i], 20).translate(b.x, heights[i] / 2, b.z));
    steelParts.push(meterBox(1.3, 0.12, 1.3).translate(b.x, 0.06, b.z));
    steelParts.push(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 20).translate(b.x, heights[i] - 0.25, b.z));
    const outward = b.clone().sub(centroid).setY(0).normalize();
    const side = new THREE.Vector3(-outward.z, 0, outward.x);
    for (const k of [-1, 1]) {
      const anchor = b.clone().addScaledVector(outward, 7).addScaledVector(side, 3.2 * k);
      const cable = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
      cable.applyMatrix4(segmentMatrix(new THREE.Vector3(b.x, heights[i] - 0.4, b.z), anchor));
      steelParts.push(cable);
      steelParts.push(meterBox(0.7, 0.18, 0.7).translate(anchor.x, 0.09, anchor.z));
    }
  });
  group.add(shadowed(new THREE.Mesh(mergeGeometries(mastParts)!, mastPaint), ctx));
  group.add(shadowed(new THREE.Mesh(mergeGeometries(steelParts)!, steel), ctx));

  // Corner plates and the short links to the masts (they slide up during the lift).
  const plates = new THREE.InstancedMesh(meterBox(0.7, 0.7, 0.08), steel, 3);
  const links = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), steel, 3);
  group.add(plates, links);

  const floor = new THREE.Mesh(floorPlane(0, 72, -140, -200), paving);
  floor.receiveShadow = ctx.shadows;
  group.add(floor);

  const P = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const v = new THREE.Vector3();
  const flat = (a: THREE.Vector3) => new THREE.Vector3(a.x, 0, a.z);
  const m = new THREE.Matrix4();
  const points = Array.from({ length: n + 1 }, () => new THREE.Vector3());
  let lastKey = '';

  return {
    group,
    lights: [],
    update(s) {
      const { tension, lift } = canopyState(s);
      const key = `${tension.toFixed(4)}|${lift.toFixed(4)}`;
      if (key === lastKey) return;
      lastKey = key;
      P[0].set(cliente[0], cliente[1] + LIFT * lift, cliente[2]);
      P[1].set(...progetto);
      P[2].set(gestione[0], gestione[1] + LIFT * lift, gestione[2]);
      const sagPlanNear = lerp(4.2, 2.6, tension);
      const sagPlanFar = lerp(5.6, 3.3, tension);
      const dropNear = lerp(3.2, 1.7, tension);
      const dropFar = lerp(lerp(8.2, 5.0, tension), -5.5, lift);
      const belly = lerp(2.4, 0.9, tension);
      // Each edge: [corner i, corner j, opposite corner k].
      const edges: [number, number, number, number, number][] = [
        [0, 2, 1, sagPlanFar, dropFar],
        [0, 1, 2, sagPlanNear, dropNear],
        [2, 1, 0, sagPlanNear, dropNear],
      ];
      const inward = edges.map(([i, j, k]) => flat(P[k]).sub(flat(P[i]).add(flat(P[j])).multiplyScalar(0.5)).normalize());
      for (let idx = 0; idx < bary.length; idx++) {
        const w = bary[idx];
        v.set(0, 0, 0).addScaledVector(P[0], w[0]).addScaledVector(P[1], w[1]).addScaledVector(P[2], w[2]);
        edges.forEach(([i, j, k, plan, drop], e) => {
          const along = w[i] + w[j];
          if (along <= 1e-6) return;
          const t = w[j] / along;
          const bulge = 4 * t * (1 - t);
          const proximity = Math.pow(1 - w[k], 3);
          v.addScaledVector(inward[e], plan * proximity * bulge);
          v.y -= drop * proximity * bulge;
        });
        v.y -= belly * 27 * w[0] * w[1] * w[2];
        position.setXYZ(idx, v.x, v.y, v.z);
        uv.setXY(idx, v.x, v.z);
      }
      position.needsUpdate = true;
      uv.needsUpdate = true;
      membraneGeometry.computeVertexNormals();
      membraneGeometry.computeBoundingSphere();
      edgeRows.forEach((row, e) => {
        row.forEach((k, i) => points[i].fromBufferAttribute(position, k));
        tubes[e].update(points);
      });
      P.forEach((corner, i) => {
        const base = bases[i];
        m.lookAt(corner, new THREE.Vector3(base.x, corner.y, base.z), new THREE.Vector3(0, 1, 0)).setPosition(corner);
        plates.setMatrixAt(i, m);
        segmentMatrix(corner, new THREE.Vector3(base.x, corner.y + 0.3, base.z), 1, m);
        links.setMatrixAt(i, m);
      });
      plates.instanceMatrix.needsUpdate = true;
      links.instanceMatrix.needsUpdate = true;
      plates.computeBoundingSphere();
      links.computeBoundingSphere();
    },
  };
}
