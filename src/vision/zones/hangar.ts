/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V1 — dark aviation threshold: long-span painted-steel portal frames, profiled
 * anodised cladding with roof light apertures, and one sculptural brushed
 * aluminium rib that becomes the rigid occluder of the V1 → V2 transition.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, zoneWeight } from '../../utils/visionJourney';
import { archRingShape, bandShape, extrude, floorPlane, meterBox, shadowed, type Zone, type ZoneContext } from '../geometry';

const { halfWidth: A, apex: B, ribZ, endZ } = LAYOUT.hangar;
const APERTURES: [number, number][] = [[1.2, 1.31], [1.83, 1.94]];
const inAperture = (t: number) => APERTURES.some(([a, b]) => t > a && t < b);

/** Trapezoidal profiled cladding following the arch, normals facing inwards. */
function claddingGeometry(z0: number, z1: number) {
  const steps = 200;
  const pos: number[] = [];
  const uv: number[] = [];
  let arc = 0;
  const point = (k: number) => {
    const t = (k / steps) * Math.PI;
    const r = k % 4 < 2 ? 0.02 : 0.075;
    return new THREE.Vector2((A + r) * Math.cos(t), (B + r) * Math.sin(t));
  };
  for (let k = 0; k < steps; k++) {
    const tMid = ((k + 0.5) / steps) * Math.PI;
    const a = point(k);
    const b = point(k + 1);
    const u0 = arc;
    arc += a.distanceTo(b);
    if (inAperture(tMid)) continue;
    const quad = [
      [a.x, a.y, z0, u0, z0], [b.x, b.y, z0, arc, z0], [b.x, b.y, z1, arc, z1],
      [a.x, a.y, z0, u0, z0], [b.x, b.y, z1, arc, z1], [a.x, a.y, z1, u0, z1],
    ];
    for (const [x, y, z, u, v] of quad) {
      pos.push(x, y, z);
      uv.push(u, v);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function apertureGeometry(z0: number, z1: number) {
  const parts = APERTURES.map(([a, b]) => {
    const g = new THREE.PlaneGeometry(1, z0 - z1, 6, 1);
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const t = a + (p.getX(i) + 0.5) * (b - a);
      const z = (z0 + z1) / 2 + p.getY(i);
      p.setXYZ(i, (A + 0.55) * Math.cos(t), (B + 0.55) * Math.sin(t), z);
    }
    g.computeVertexNormals();
    return g;
  });
  return mergeGeometries(parts)!;
}

function ribGeometry() {
  const web = extrude(archRingShape(A - 0.04, B - 0.04, 0.82), 0.3, 0.015, 48);
  const outer = extrude(archRingShape(A, B, 0.07), 0.62, 0.012, 48);
  const inner = extrude(archRingShape(A - 0.83, B - 0.83, 0.07), 0.62, 0.012, 48);
  return mergeGeometries([web, outer, inner])!;
}

function heroRibGeometry() {
  const curve = new THREE.CubicBezierCurve(
    new THREE.Vector2(3.5, 0),
    new THREE.Vector2(3.5, 10.5),
    new THREE.Vector2(0.5, 15.8),
    new THREE.Vector2(-13.5, 15.2),
  );
  const shape = bandShape(curve.getPoints(64), (t) => 2.6 - 1.25 * t);
  const { heroRib } = LAYOUT;
  const body = extrude(shape, heroRib.depth, 0.06, 1);
  // A slightly proud, cross-brushed face panel gives the rib a precise, fabricated edge.
  const insetShape = bandShape(curve.getPoints(64), (t) => 2.6 - 1.25 * t - 0.5);
  const face = extrude(insetShape, heroRib.depth + 0.12, 0.01, 1);
  return { body, face };
}

export function buildHangar(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V1-hangar';
  const { materials, mobile } = ctx;

  const paintedSteel = new THREE.MeshStandardMaterial({
    color: '#1f2e44',
    metalness: 0.3,
    roughness: 0.78,
    ...materials.maps('metal', 2.2, Math.PI / 2),
    normalScale: new THREE.Vector2(0.3, 0.3),
  });
  paintedSteel.metalnessMap = null;
  const anodised = new THREE.MeshStandardMaterial({
    color: '#3b4757',
    metalness: 0.85,
    envMapIntensity: 1.6,
    roughness: 0.8,
    ...materials.maps('metal', 3),
    normalScale: new THREE.Vector2(0.4, 0.4),
  });
  const brushedAluminium = new THREE.MeshPhysicalMaterial({
    color: '#d5dbe2',
    metalness: 0.72,
    roughness: 0.85,
    ...materials.maps('metal', 1.6),
    normalScale: new THREE.Vector2(0.55, 0.55),
    anisotropy: 0.55,
    envMapIntensity: 3.2,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
  });
  const recessAluminium = new THREE.MeshStandardMaterial({ color: '#9aa3ad', metalness: 1, roughness: 0.42, envMapIntensity: 2.6, ...materials.maps('metal', 1.2, Math.PI / 2), normalScale: new THREE.Vector2(0.4, 0.4) });
  const floor = new THREE.MeshStandardMaterial({
    color: '#1f242b',
    roughness: 4.6,
    metalness: 0,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2.5, 2.5),
  });
  const skylight = new THREE.MeshBasicMaterial({ color: '#d9e3ee' });
  const inset = new THREE.MeshBasicMaterial({ color: '#f3e6cf' });

  // Portal frames: instanced, one draw call.
  const ribs = new THREE.InstancedMesh(ribGeometry(), paintedSteel, ribZ.length);
  const m = new THREE.Matrix4();
  ribZ.forEach((z, i) => ribs.setMatrixAt(i, m.makeTranslation(0, 0, z)));
  group.add(shadowed(ribs, ctx));

  // Purlins framing into the ribs at mid-web depth.
  const purlinAngles: number[] = [];
  for (let t = 0.28; t < Math.PI - 0.2; t += 0.19) if (!inAperture(t) && !inAperture(t + 0.05) && !inAperture(t - 0.05)) purlinAngles.push(t);
  const zFront = 9.5;
  const length = zFront - endZ;
  const purlins = new THREE.InstancedMesh(meterBox(0.18, 0.32, length), paintedSteel, purlinAngles.length);
  purlinAngles.forEach((t, i) => {
    const r = 0.45;
    const x = (A - r) * Math.cos(t);
    const y = (B - r) * Math.sin(t);
    m.compose(new THREE.Vector3(x, y, (zFront + endZ) / 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), t - Math.PI / 2), new THREE.Vector3(1, 1, 1));
    purlins.setMatrixAt(i, m);
  });
  group.add(shadowed(purlins, ctx));

  const cladding = new THREE.Mesh(claddingGeometry(zFront, endZ), anodised);
  cladding.material.side = THREE.DoubleSide;
  group.add(shadowed(cladding, ctx));
  group.add(new THREE.Mesh(apertureGeometry(zFront, endZ), skylight));

  const back = new THREE.Mesh(meterBox(2 * A + 2, B + 1, 0.4), anodised);
  back.position.set(0, (B + 1) / 2, zFront + 0.6);
  group.add(back);

  const floorMesh = new THREE.Mesh(floorPlane(-A, A, zFront + 1, endZ), floor);
  floorMesh.receiveShadow = ctx.shadows;
  group.add(floorMesh);

  // Low inset floor lights leading towards the exit.
  const insetCount = 9;
  const lights = new THREE.InstancedMesh(meterBox(0.5, 0.02, 0.09), inset, insetCount * 2);
  for (let i = 0; i < insetCount; i++) {
    const z = 4 - i * 5.4;
    lights.setMatrixAt(i * 2, m.makeTranslation(-5.2, 0.006, z));
    lights.setMatrixAt(i * 2 + 1, m.makeTranslation(5.2, 0.006, z));
  }
  group.add(lights);

  // The sculptural aluminium rib at the threshold.
  const hero = heroRibGeometry();
  const rib = new THREE.Mesh(hero.body, brushedAluminium);
  rib.position.z = LAYOUT.heroRib.z;
  const ribFace = new THREE.Mesh(hero.face, recessAluminium);
  ribFace.position.z = LAYOUT.heroRib.z;
  group.add(shadowed(rib, ctx), ribFace);
  const plinth = new THREE.Mesh(meterBox(3.4, 0.28, 1.5), new THREE.MeshStandardMaterial({ color: '#1b222b', roughness: 0.5, metalness: 0.6 }));
  plinth.position.set(3.5, 0.14, LAYOUT.heroRib.z);
  group.add(shadowed(plinth, ctx));

  // Daylight falling through the roof apertures.
  const spots: THREE.SpotLight[] = [];
  for (const [x, z] of [[-3.6, -10], [3.6, -27]] as [number, number][]) {
    const spot = new THREE.SpotLight('#dfe8f4', 0, 0, 0.62, 0.85, 2);
    spot.position.set(x, B - 0.8, z);
    spot.target.position.set(x * 0.9, 0, z - 2);
    ctx.scene.add(spot.target);
    spots.push(spot);
  }
  // Daylight spilling in at the threshold, grazing the aluminium rib's face.
  const spill = new THREE.SpotLight('#fff3e2', 0, 0, 0.5, 0.7, 2);
  spill.position.set(13, 10, -36);
  spill.target.position.set(3.5, 4.5, LAYOUT.heroRib.z);
  ctx.scene.add(spill.target);
  spots.push(spill);
  const intensities = mobile ? [110, 110, 520] : [130, 130, 620];

  return {
    group,
    lights: spots,
    update(s) {
      const w = zoneWeight(0, s);
      spots.forEach((spot, i) => (spot.intensity = intensities[i] * w));
    },
  };
}
