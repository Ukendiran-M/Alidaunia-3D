/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * V2 — tactile mineral gallery: one room-scale wall of board-formed cast
 * panels, a deep vertical joint, a broad opening into the glazed gallery and
 * restrained dark mineral surfaces. A daylight band glides over the wall.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, galleryBandX, zoneWeight } from '../../utils/visionJourney';
import { daylightBandTexture } from '../materials';
import { floorPlane, meterBox, shadowed, type Zone, type ZoneContext } from '../geometry';

const G = LAYOUT.gallery;
const PANEL_DEPTH = 0.16;
const JOINT = 0.028;

function panelWall(x0: number, x1: number, columns: number, seed: number) {
  const parts: THREE.BufferGeometry[] = [];
  const rows = 3;
  const w = (x1 - x0) / columns;
  const h = G.height / rows;
  let r = seed;
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let c = 0; c < columns; c++) {
    for (let k = 0; k < rows; k++) {
      // Each cast panel samples a different region of the map: no visible tiling across the wall.
      const g = meterBox(w - JOINT, h - JOINT, PANEL_DEPTH, rand() * 6.4, rand() * 6.4);
      g.translate(x0 + w * (c + 0.5), h * (k + 0.5), G.wallZ - PANEL_DEPTH / 2);
      parts.push(g);
    }
  }
  return mergeGeometries(parts)!;
}

export function buildGallery(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'V2-gallery';
  const { materials } = ctx;

  const concrete = new THREE.MeshStandardMaterial({
    color: '#d2dbe8',
    roughness: 1,
    metalness: 0,
    // Boards run horizontally, ~0.55 m per board.
    ...materials.maps('concrete', 2.2, Math.PI / 2),
    // Attenuated relief: architectural finish, not a distressed set.
    normalScale: new THREE.Vector2(0.65, 0.65),
  });
  const core = new THREE.MeshStandardMaterial({
    color: '#7c8592',
    roughness: 1,
    ...materials.maps('concrete', 2.2, Math.PI / 2),
    normalScale: new THREE.Vector2(0.4, 0.4),
  });
  const mineral = new THREE.MeshPhysicalMaterial({
    color: '#22262b',
    roughness: 0.5,
    ...materials.maps('concrete', 2.4),
    normalScale: new THREE.Vector2(0.12, 0.12),
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const floor = new THREE.MeshPhysicalMaterial({
    color: '#2b3035',
    roughness: 3.6,
    ...materials.maps('ceramic', 2.4),
    normalScale: new THREE.Vector2(2, 2),
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
  });

  const back = G.wallZ - G.wallThickness;
  const coreDepth = G.wallThickness - PANEL_DEPTH + 0.04;
  const coreBox = (x0: number, x1: number, depth = coreDepth) => {
    const g = meterBox(x1 - x0, G.height - 0.02, depth);
    g.translate((x0 + x1) / 2, G.height / 2 - 0.01, back + depth / 2);
    return g;
  };

  const panels = new THREE.Mesh(
    mergeGeometries([
      panelWall(G.wallX0, G.jointX - 0.3, 10, 4187),
      panelWall(G.jointX + 0.3, G.wallEndX, 1, 712),
      panelWall(G.openingX1, G.farWallX1, 4, 991),
    ])!,
    concrete,
  );
  group.add(shadowed(panels, ctx));

  const coreMesh = new THREE.Mesh(
    mergeGeometries([coreBox(G.wallX0, G.jointX - 0.3), coreBox(G.jointX + 0.3, G.wallEndX), coreBox(G.openingX1, G.farWallX1)])!,
    core,
  );
  group.add(shadowed(coreMesh, ctx));

  // Deep vertical joint: dark mineral backing set 0.9 m into the wall.
  const joint = new THREE.Mesh(coreBox(G.jointX - 0.3, G.jointX + 0.3, G.wallThickness - 0.9), mineral);
  group.add(shadowed(joint, ctx));

  // Dark mineral base course and one monolithic bench to give human scale.
  const base = new THREE.Mesh(
    mergeGeometries([
      meterBox(G.wallEndX - G.wallX0, 0.42, 0.42).translate((G.wallX0 + G.wallEndX) / 2, 0.21, G.wallZ + 0.2),
      meterBox(G.farWallX1 - G.openingX1, 0.42, 0.42).translate((G.openingX1 + G.farWallX1) / 2, 0.21, G.wallZ + 0.2),
      meterBox(6.5, 0.46, 0.95).translate(12.5, 0.23, G.wallZ + 3.2),
    ])!,
    mineral,
  );
  group.add(shadowed(base, ctx));

  const floorMesh = new THREE.Mesh(floorPlane(G.wallX0, G.farWallX1, LAYOUT.hangar.endZ, G.wallZ), floor);
  floorMesh.receiveShadow = ctx.shadows;
  group.add(floorMesh);

  // Daylight band: a spot light shaped by a soft slot cookie.
  const band = new THREE.SpotLight('#fff1dc', 0, 0, 0.44, 0.2, 2);
  band.map = materials.adopt(daylightBandTexture());
  ctx.scene.add(band.target);

  return {
    group,
    lights: [band],
    update(s) {
      const x = galleryBandX(s);
      band.position.set(x - 3.5, 16, G.wallZ + 11);
      band.target.position.set(x, 5.5, G.wallZ);
      band.target.updateMatrixWorld();
      band.intensity = 1500 * zoneWeight(1, s);
    },
  };
}
