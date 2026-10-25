/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V4 — precision composite vault: a folded-plate carbon shell with real edge
 * thickness, an apex seam bridged by machined titanium knuckles and a pleated
 * end diaphragm whose petals fold outwards to reveal the tensile canopy.
 * Four calibrated adjustments follow Esperienza, Tecnologia, Dinamismo and
 * Modernità (see vaultState); the geometry is rebuilt in place from state.
 */

import * as THREE from 'three';
import { LAYOUT, vaultState, zoneWeight } from '../../utils/visionJourney';
import { floorPlane, meterBox, orientIndex, shadowed, type Zone, type ZoneContext } from '../geometry';

const V = LAYOUT.vault;
const THICK = 0.14;
const FACETS = V.pleats * 2;
const PETALS = 8;

interface ShellParams {
  b: number;
  amp: number;
  gap: number;
}

function shellPoint(side: -1 | 1, u: number, k: number, p: ShellParams, out = new THREE.Vector3()) {
  const theta = side < 0 ? Math.PI - (u * Math.PI) / 2 : (u * Math.PI) / 2;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const nx = c / V.halfSpan;
  const ny = s / p.b;
  const nl = Math.hypot(nx, ny);
  const zig = k % 2 === 0 ? 0.5 : -0.5;
  const pleat = p.amp * zig * (0.45 + 0.55 * s);
  return out.set(
    V.cx + V.halfSpan * c + (nx / nl) * pleat + (side * p.gap) / 2,
    p.b * s + (ny / nl) * pleat,
    V.z0 + ((V.z1 - V.z0) * k) / FACETS,
  );
}

/** One half of the shell: outer + inner skins, seam edge, entry and end edges. */
function createShellHalf(side: -1 | 1, segments: number) {
  const U = segments;
  const block = FACETS * (U + 1) * 2;
  const seamBase = block * 2;
  const edgeBase = seamBase + FACETS * 4;
  const count = edgeBase + (U + 1) * 4;
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uv = new THREE.BufferAttribute(new Float32Array(count * 2), 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('normal', normal);
  geometry.setAttribute('uv', uv);

  const outerIdx = (f: number, i: number, j: number) => (f * (U + 1) + i) * 2 + j;
  const blocks: number[][] = [[], [], [], [], []];
  for (let f = 0; f < FACETS; f++) {
    for (let i = 0; i < U; i++) {
      const a = outerIdx(f, i, 0);
      const b = outerIdx(f, i, 1);
      const c = outerIdx(f, i + 1, 0);
      const d = outerIdx(f, i + 1, 1);
      blocks[0].push(a, c, b, b, c, d);
      blocks[1].push(a + block, c + block, b + block, b + block, c + block, d + block);
    }
    const q = seamBase + f * 4;
    blocks[2].push(q, q + 1, q + 2, q, q + 2, q + 3);
  }
  for (let e = 0; e < 2; e++) {
    const base = edgeBase + e * (U + 1) * 2;
    for (let i = 0; i < U; i++) {
      const a = base + i * 2;
      blocks[3 + e].push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const ringLength = (Math.PI / 2) * ((V.halfSpan + V.apex) / 2);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const du = new THREE.Vector3();
  const dv = new THREE.Vector3();
  const n = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const facetNormal = new THREE.Vector3();
  const centre = new THREE.Vector3();
  let oriented = false;

  // Static UVs, in metres.
  for (let f = 0; f < FACETS; f++) {
    for (let i = 0; i <= U; i++) {
      for (let j = 0; j < 2; j++) {
        const k = outerIdx(f, i, j);
        const v = (Math.abs(V.z1 - V.z0) * (f + j)) / FACETS;
        uv.setXY(k, (i / U) * ringLength, v);
        uv.setXY(k + block, (i / U) * ringLength, v);
      }
    }
  }

  function write(k: number, p: THREE.Vector3, nn: THREE.Vector3) {
    position.setXYZ(k, p.x, p.y, p.z);
    normal.setXYZ(k, nn.x, nn.y, nn.z);
  }

  function update(params: ShellParams) {
    for (let f = 0; f < FACETS; f++) {
      for (let i = 0; i <= U; i++) {
        const u = i / U;
        const ua = Math.max(0, u - 0.01);
        const ub = Math.min(1, u + 0.01);
        for (let j = 0; j < 2; j++) {
          const k = f + j;
          shellPoint(side, u, k, params, p0);
          du.subVectors(shellPoint(side, ub, k, params, p1), shellPoint(side, ua, k, params, tmp));
          dv.subVectors(shellPoint(side, u, f + 1, params, p1), shellPoint(side, u, f, params, tmp));
          n.crossVectors(du, dv).normalize();
          centre.set(V.cx, 0, p0.z);
          if (n.dot(tmp.subVectors(p0, centre)) < 0) n.negate();
          const idx = outerIdx(f, i, j);
          write(idx, p0, n);
          tmp.copy(p0).addScaledVector(n, -THICK);
          write(idx + block, tmp, facetNormal.copy(n).negate());
        }
      }
      // Seam edge at the apex (u = 1): a thin face across the shell thickness.
      const q = seamBase + f * 4;
      facetNormal.set(-side, 0, 0);
      for (let j = 0; j < 2; j++) {
        const idx = outerIdx(f, U, j);
        p0.fromBufferAttribute(position, idx);
        p1.fromBufferAttribute(position, idx + block);
        write(q + j, p0, facetNormal);
        write(q + 3 - j, p1, facetNormal);
      }
    }
    // Entry (k = 0) and end (k = FACETS) edges show the true thickness.
    for (let e = 0; e < 2; e++) {
      const base = edgeBase + e * (U + 1) * 2;
      const f = e === 0 ? 0 : FACETS - 1;
      const j = e === 0 ? 0 : 1;
      facetNormal.set(0, 0, e === 0 ? 1 : -1);
      for (let i = 0; i <= U; i++) {
        const idx = outerIdx(f, i, j);
        p0.fromBufferAttribute(position, idx);
        p1.fromBufferAttribute(position, idx + block);
        write(base + i * 2, p0, facetNormal);
        write(base + i * 2 + 1, p1, facetNormal);
        uv.setXY(base + i * 2, (i / U) * ringLength, 0);
        uv.setXY(base + i * 2 + 1, (i / U) * ringLength, THICK);
      }
    }
    if (!oriented) {
      oriented = true;
      for (const list of blocks) orientIndex(list, position.array, normal.array);
      geometry.setIndex(blocks.flat());
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    geometry.computeBoundingSphere();
  }
  return { geometry, update };
}

/** Pleated end diaphragm: triangular petals hinged on the shell rim. */
function createDiaphragm() {
  const vertsPerPetal = 24;
  const position = new THREE.BufferAttribute(new Float32Array(PETALS * vertsPerPetal * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const normal = new THREE.BufferAttribute(new Float32Array(PETALS * vertsPerPetal * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uv = new THREE.BufferAttribute(new Float32Array(PETALS * vertsPerPetal * 2), 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('normal', normal);
  geometry.setAttribute('uv', uv);
  const rim: THREE.Vector3[] = Array.from({ length: PETALS + 2 }, () => new THREE.Vector3());
  const hinges: [THREE.Vector3, THREE.Vector3][] = [];
  const axis = new THREE.Vector3();
  const hub = new THREE.Vector3();
  const off = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const corners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const back = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const q = new THREE.Quaternion();

  function update(params: ShellParams, opening: number) {
    // Rim points along the end ridge of both halves (left: ground → apex, right: apex → ground).
    const half = PETALS / 2;
    for (let i = 0; i <= half; i++) shellPoint(-1, i / half, FACETS, params, rim[i]);
    for (let i = 0; i <= half; i++) shellPoint(1, 1 - i / half, FACETS, params, rim[half + 1 + i]);
    hinges.length = 0;
    let v = 0;
    let petal = 0;
    for (let i = 0; i < PETALS + 1; i++) {
      if (i === half) continue; // the apex seam stays open as a slot of light
      const a = rim[i];
      const b = rim[i + 1];
      hinges.push([a, b]);
      // Alternate hub depth: a folded, pleated fan rather than a flat disc.
      hub.set(V.cx, 0.02, V.z1 + (petal % 2 === 0 ? -0.55 : 0.35));
      axis.subVectors(b, a).normalize();
      off.subVectors(hub, a);
      // Rotate the free corner about the rim hinge, always swinging outwards (−Z).
      q.setFromAxisAngle(axis, 0.1);
      const sign = off.clone().applyQuaternion(q).z < off.z ? 1 : -1;
      q.setFromAxisAngle(axis, sign * opening);
      hub.copy(a).add(off.applyQuaternion(q));
      corners[0].copy(a);
      corners[1].copy(b);
      corners[2].copy(hub);
      nrm.subVectors(corners[1], corners[0]).cross(off.subVectors(corners[2], corners[0])).normalize();
      for (let c = 0; c < 3; c++) back[c].copy(corners[c]).addScaledVector(nrm, -THICK);
      const tri = (p: THREE.Vector3, r: THREE.Vector3, s: THREE.Vector3, n: THREE.Vector3) => {
        for (const point of [p, r, s]) {
          position.setXYZ(v, point.x, point.y, point.z);
          normal.setXYZ(v, n.x, n.y, n.z);
          uv.setXY(v, point.x, point.y);
          v++;
        }
      };
      const neg = nrm.clone().negate();
      tri(corners[0], corners[1], corners[2], nrm);
      tri(back[0], back[2], back[1], neg);
      for (let e = 0; e < 3; e++) {
        const e1 = (e + 1) % 3;
        const side = new THREE.Vector3().subVectors(corners[e1], corners[e]).cross(nrm).normalize();
        tri(corners[e], back[e], corners[e1], side);
        tri(corners[e1], back[e], back[e1], side);
      }
      petal++;
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    uv.needsUpdate = true;
    geometry.computeBoundingSphere();
    return hinges;
  }
  return { geometry, update };
}

export function buildVault(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V4-vault';
  const { materials, mobile } = ctx;

  const carbon = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 1,
    metalness: 0.05,
    ...materials.maps('carbon', 0.42, Math.PI / 4),
    normalScale: new THREE.Vector2(0.55, 0.55),
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    anisotropy: 0.35,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
  });
  const titanium = new THREE.MeshPhysicalMaterial({
    color: '#b9bcc1',
    metalness: 1,
    roughness: 0.72,
    ...materials.maps('metal', 0.5),
    normalScale: new THREE.Vector2(0.3, 0.3),
    anisotropy: 0.5,
    envMapIntensity: 2.2,
  });
  const resin = new THREE.MeshPhysicalMaterial({
    color: '#1d2126',
    roughness: 4.2,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2, 2),
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
  });

  const segments = mobile ? 24 : 40;
  const halves = [createShellHalf(-1, segments), createShellHalf(1, segments)];
  halves.forEach((h) => group.add(shadowed(new THREE.Mesh(h.geometry, carbon), ctx)));
  const diaphragm = createDiaphragm();
  group.add(shadowed(new THREE.Mesh(diaphragm.geometry, carbon), ctx));

  // Machined hardware: rim hinge pins, apex seam knuckles and base shoes.
  const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 12), titanium, PETALS);
  const knuckleCount = V.pleats + 1;
  const knuckles = new THREE.InstancedMesh(meterBox(1, 0.12, 0.34), titanium, knuckleCount);
  const shoes = new THREE.InstancedMesh(meterBox(0.62, 0.36, 0.34), titanium, (FACETS + 1) * 2);
  group.add(pins, knuckles, shadowed(shoes, ctx));

  const floor = new THREE.Mesh(floorPlane(24, 48, LAYOUT.glazing.endZ, -140), resin);
  floor.receiveShadow = ctx.shadows;
  group.add(floor);

  const warm = new THREE.PointLight('#ffd9b4', 0, 0, 2);
  warm.position.set(30.5, 2.6, -124);
  const cool = new THREE.PointLight('#c6dbff', 0, 0, 2);
  cool.position.set(41.5, 5.2, -129);

  const m = new THREE.Matrix4();
  const a = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let lastKey = '';

  return {
    group,
    lights: [warm, cool],
    update(s) {
      const st = vaultState(s);
      const w = zoneWeight(3, s);
      warm.intensity = 70 * w;
      cool.intensity = 90 * w;
      const params: ShellParams = {
        b: V.apex * (0.8 + 0.2 * st.support) + 0.45 * st.resolve,
        amp: 0.2 + 0.2 * st.support + 0.8 * st.fold + 0.12 * st.resolve,
        gap: 0.46 * st.seam,
      };
      const opening = 1.95 * (0.22 * st.resolve + 0.78 * st.open);
      const key = `${params.b.toFixed(4)}|${params.amp.toFixed(4)}|${params.gap.toFixed(4)}|${opening.toFixed(4)}`;
      if (key === lastKey) return;
      lastKey = key;
      halves.forEach((h) => h.update(params));
      const hinges = diaphragm.update(params, opening);
      hinges.forEach(([p, r], i) => {
        q.setFromUnitVectors(up, a.subVectors(r, p).normalize());
        m.compose(a.addVectors(p, r).multiplyScalar(0.5), q, scale.set(1, p.distanceTo(r), 1));
        pins.setMatrixAt(i, m);
      });
      pins.instanceMatrix.needsUpdate = true;
      for (let k = 0; k <= V.pleats; k++) {
        const crease = k * 2;
        shellPoint(-1, 1, crease, params, a);
        a.x = V.cx;
        a.y -= THICK + 0.05;
        const visible = Math.max(0.001, st.seam);
        m.compose(a, q.identity(), scale.set(params.gap + 0.3, visible, 1));
        knuckles.setMatrixAt(k, m);
      }
      knuckles.instanceMatrix.needsUpdate = true;
      for (let k = 0; k <= FACETS; k++) {
        for (const side of [-1, 1] as const) {
          shellPoint(side, 0, k, params, a);
          m.makeTranslation(a.x, 0.18, a.z);
          shoes.setMatrixAt(k * 2 + (side < 0 ? 0 : 1), m);
        }
      }
      shoes.instanceMatrix.needsUpdate = true;
      shoes.computeBoundingSphere();
      pins.computeBoundingSphere();
      knuckles.computeBoundingSphere();
    },
  };
}
