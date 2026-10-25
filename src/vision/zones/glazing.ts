/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V3 — translucent Mission gallery: seven full-height laminated, frosted
 * glazing thresholds (3 + 2 + 2) with clear polished edges and stainless
 * patch fittings, then a frosted screen whose edge hands over to the vault.
 * Only the nearest panes use physical transmission; the rest use a matching
 * translucent treatment.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, phase, zoneWeight } from '../../utils/visionJourney';
import { floorPlane, meterBox, shadowed, type Zone, type ZoneContext } from '../geometry';

const GL = LAYOUT.glazing;
const PANE = 0.05;
const NEAR_PANES = 2;
const NEAR_DISTANCE = 16;

export function buildGlazing(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V3-glazing';
  const { materials, mobile } = ctx;

  const glassMaps = materials.maps('glass', 1.1);
  const frostedNear = new THREE.MeshPhysicalMaterial({
    color: '#f4f8f7',
    roughness: 1,
    metalness: 0,
    ...glassMaps,
    transmission: 1,
    thickness: PANE,
    ior: 1.5,
    attenuationColor: new THREE.Color('#cfe4dd'),
    attenuationDistance: 0.9,
    envMapIntensity: 1.1,
  });
  // Matching, inexpensive treatment for distant panes (and every pane on phones).
  const frostedFar = new THREE.MeshPhysicalMaterial({
    color: '#e3ecea',
    roughness: 1,
    ...glassMaps,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    envMapIntensity: 1.1,
  });
  const screenMaterial = mobile
    ? frostedFar
    : new THREE.MeshPhysicalMaterial({
        color: '#f1f6f5',
        roughness: 1,
        ...materials.maps('glass', 0.8),
        roughnessMap: glassMaps.roughnessMap,
        transmission: 1,
        thickness: 0.08,
        ior: 1.5,
        attenuationColor: new THREE.Color('#cde3dc'),
        attenuationDistance: 0.7,
      });
  const edge = new THREE.MeshPhysicalMaterial({
    color: '#5f8f85',
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.8,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: '#c9cdd1',
    metalness: 1,
    roughness: 0.6,
    ...materials.maps('metal', 0.6),
    envMapIntensity: 1.8,
  });
  const fittingSteel = new THREE.MeshStandardMaterial({ color: '#e4e8ec', metalness: 1, roughness: 0.25, envMapIntensity: 3 });
  const { normalMap: plasterNormal } = materials.maps('concrete', 3);
  const plaster = new THREE.MeshStandardMaterial({ color: '#e7e4de', roughness: 0.93, normalMap: plasterNormal, normalScale: new THREE.Vector2(0.08, 0.08) });
  const stone = new THREE.MeshStandardMaterial({
    color: '#d8d4cc',
    roughness: 6,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2.5, 2.5),
  });

  // Seven thresholds.
  const fins: THREE.Mesh[] = [];
  const shoeGeometries: THREE.BufferGeometry[] = [];
  const fittings = new THREE.InstancedMesh(meterBox(0.11, 0.11, PANE + 0.04), fittingSteel, GL.fins.length * 4);
  const m = new THREE.Matrix4();
  GL.fins.forEach((fin, i) => {
    const cx = GL.pathX + fin.side * (GL.finInnerGap + GL.finWidth / 2);
    const mesh = new THREE.Mesh(meterBox(GL.finWidth, GL.finHeight, PANE), [edge, edge, edge, edge, frostedFar, frostedFar]);
    mesh.position.set(cx, 0.14 + GL.finHeight / 2, fin.z);
    mesh.userData.centre = mesh.position.clone();
    fins.push(mesh);
    group.add(mesh);
    shoeGeometries.push(meterBox(GL.finWidth + 0.08, 0.14, 0.16).translate(cx, 0.07, fin.z));
    const inner = GL.pathX + fin.side * (GL.finInnerGap + 0.25);
    const outer = GL.pathX + fin.side * (GL.finInnerGap + GL.finWidth - 0.25);
    [inner, outer].forEach((x, k) => {
      fittings.setMatrixAt(i * 4 + k * 2, m.makeTranslation(x, GL.finHeight - 0.15, fin.z));
      fittings.setMatrixAt(i * 4 + k * 2 + 1, m.makeTranslation(x, GL.finHeight * 0.5, fin.z));
    });
  });
  group.add(shadowed(new THREE.Mesh(mergeGeometries(shoeGeometries)!, steel), ctx), fittings);

  // Frosted handoff screen in front of the vault, with a polished vertical edge.
  const { screen } = GL;
  const screenWidth = screen.x1 - screen.x0;
  const screenMesh = new THREE.Mesh(meterBox(screenWidth, 8.4, 0.08), [edge, edge, edge, edge, screenMaterial, screenMaterial]);
  screenMesh.position.set((screen.x0 + screen.x1) / 2, 4.32, screen.z);
  group.add(screenMesh);
  group.add(new THREE.Mesh(meterBox(screenWidth + 0.1, 0.14, 0.18).translate(screenMesh.position.x, 0.07, screen.z), steel));

  // Pale gallery walls, open to the sky.
  const [wx0, wx1] = GL.sideWallX;
  const length = LAYOUT.gallery.wallZ - LAYOUT.gallery.wallThickness - GL.endZ;
  const zMid = (LAYOUT.gallery.wallZ - LAYOUT.gallery.wallThickness + GL.endZ) / 2;
  const walls = new THREE.Mesh(
    mergeGeometries([
      meterBox(0.6, 9, length).translate(wx0 - 0.3, 4.5, zMid),
      meterBox(0.6, 9, length).translate(wx1 + 0.3, 4.5, zMid),
    ])!,
    plaster,
  );
  group.add(shadowed(walls, ctx));
  const floor = new THREE.Mesh(floorPlane(wx0 - 0.6, wx1 + 0.6, LAYOUT.gallery.wallZ, GL.endZ), stone);
  floor.receiveShadow = ctx.shadows;
  group.add(floor);

  // Highlight that travels along the polished screen edge and on into the vault.
  const glint = new THREE.PointLight('#f4fbff', 0, 0, 2);
  glint.position.set(screen.x1 + 1.2, 3.1, screen.z + 1.4);
  const fill = new THREE.PointLight('#eef4f6', 0, 0, 2);
  fill.position.set(GL.pathX, 6.5, -86);

  const camPos = new THREE.Vector3();
  const order = fins.map((_, i) => i);

  return {
    group,
    lights: [glint, fill],
    update(s, camera) {
      camPos.copy(camera.position);
      // Physical transmission only for the nearest panes.
      order.sort((a, b) => fins[a].userData.centre.distanceTo(camPos) - fins[b].userData.centre.distanceTo(camPos));
      order.forEach((index, rank) => {
        const mesh = fins[index];
        const near = !mobile && rank < NEAR_PANES && mesh.userData.centre.distanceTo(camPos) < NEAR_DISTANCE;
        const face = near ? frostedNear : frostedFar;
        const list = mesh.material as THREE.Material[];
        list[4] = face;
        list[5] = face;
      });
      const handoff = phase(s, 2.66, 2.88) * (1 - phase(s, 3.05, 3.35));
      glint.intensity = 48 * handoff;
      glint.position.z = screen.z + 1.4 - 3.6 * phase(s, 2.8, 3.2);
      fill.intensity = 160 * zoneWeight(2, s);
    },
  };
}
