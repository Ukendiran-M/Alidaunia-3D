/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V6 — luminous ceramic horizon: one large, upright, curved wall clad in
 * ivory glazed ceramic, with blue-glazed reveals and base course, opening
 * through its full height towards diffuse sky. Deliberately no deck, ring or
 * logo object: the movement settles and the composition stays still.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../../utils/visionJourney';
import { glazedTileTexture } from '../materials';
import { floorPlane, paramSurface, shadowed, type Zone, type ZoneContext } from '../geometry';

const H = LAYOUT.horizon;
const BAND = 1.35;
const TILE = 2.4;

const at = (phi: number, r: number, y: number) => new THREE.Vector3(H.cx + r * Math.sin(phi), y, H.cz - r * Math.cos(phi));

export function buildHorizon(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V6-horizon';
  const { materials, mobile } = ctx;
  const tileSize = mobile ? 512 : 1024;

  const ceramic = (glaze: string, joint: string, variation: number) => {
    const map = materials.adopt(glazedTileTexture(glaze, joint, variation, tileSize));
    map.repeat.set(1 / TILE, 1 / TILE);
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map,
      roughness: 1,
      ...materials.maps('ceramic', 0.6),
      normalScale: new THREE.Vector2(1, 1),
      clearcoat: 0.8,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.15,
      side: THREE.DoubleSide,
    });
  };
  const ivory = ceramic('#f2ece0', '#bdb3a1', 0.045);
  const blue = ceramic('#1f4f88', '#10304f', 0.07);
  const stone = new THREE.MeshStandardMaterial({
    color: '#dcd8cf',
    roughness: 6.5,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2.5, 2.5),
  });

  const R0 = H.radius;
  const R1 = H.radius + H.thickness;
  const pieces: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => pieces.push({ geometry, material });
  const segs = mobile ? 28 : 48;

  for (const [p0, p1] of [[-H.sweep, -H.openingHalfAngle], [H.openingHalfAngle, H.sweep]] as [number, number][]) {
    const phi = (u: number) => p0 + (p1 - p0) * u;
    const inward = (f: number) => new THREE.Vector3(-Math.sin(f), 0, Math.cos(f));
    // Concave inner face: blue base course, ivory above.
    add(paramSurface(segs, 1, (u, v) => ({ p: at(phi(u), R0, v * BAND), n: inward(phi(u)), uv: [phi(u) * R0, v * BAND] })), blue);
    add(paramSurface(segs, 8, (u, v) => {
      const y = BAND + v * (H.height - BAND);
      return { p: at(phi(u), R0, y), n: inward(phi(u)), uv: [phi(u) * R0, y] };
    }), ivory);
    add(paramSurface(segs, 4, (u, v) => ({ p: at(phi(u), R1, v * H.height), n: inward(phi(u)).negate(), uv: [phi(u) * R1, v * H.height] })), ivory);
    add(paramSurface(segs, 1, (u, v) => ({ p: at(phi(u), R0 + v * H.thickness, H.height), n: new THREE.Vector3(0, 1, 0), uv: [phi(u) * R0, v * H.thickness] })), ivory);
    // Radial end faces. Each normal points away from the wall body: the reveals at the
    // opening are glazed blue, the far ends ivory.
    const left = p1 < 0;
    const ends: [number, number, THREE.Material][] = left
      ? [[p1, 1, blue], [p0, -1, ivory]]
      : [[p0, -1, blue], [p1, 1, ivory]];
    for (const [e, sign, material] of ends) {
      const n = new THREE.Vector3(Math.cos(e), 0, Math.sin(e)).multiplyScalar(sign);
      add(paramSurface(1, 4, (u, v) => ({ p: at(e, R0 + u * H.thickness, v * H.height), n, uv: [u * H.thickness, v * H.height] })), material);
    }
  }

  const merged = mergeGeometries(pieces.map((p) => p.geometry), true)!;
  const wall = new THREE.Mesh(merged, pieces.map((p) => p.material));
  group.add(shadowed(wall, ctx));

  const floor = new THREE.Mesh(floorPlane(0, 72, -200, -262), stone);
  floor.receiveShadow = ctx.shadows;
  group.add(floor);

  return { group, lights: [], update() {} };
}
