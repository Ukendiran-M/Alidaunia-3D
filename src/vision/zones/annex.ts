/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The technical annex beside the hangar: a two-storey glazed block with the
 * planning studio upstairs and the briefing room below, both looking into the
 * aircraft bay. Low-iron glazing on anodised mullions, real door openings
 * where the camera passes, an external stair and landing, and a frosted logo
 * manifestation on the briefing-room glass.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../../utils/visionJourney';
import { BRAND, glassManifestation, panelTexture } from '../artwork';
import { meterBox, shadowed, useArtwork, worldPlane, type Zone, type ZoneContext } from '../geometry';

const A = LAYOUT.annex;
const CEILING = A.roof - 0.25;
const MULLION = 1.5;

type Span = [number, number];

/** Glazing along X = const (hangar side) between z spans; returns glass + mullion geometry. */
function glazingX(x: number, spans: Span[], y0: number, y1: number, glass: THREE.BufferGeometry[], frame: THREE.BufferGeometry[]) {
  for (const [z0, z1] of spans) {
    glass.push(meterBox(0.024, y1 - y0, z1 - z0).translate(x, (y0 + y1) / 2, (z0 + z1) / 2));
    const n = Math.max(1, Math.round((z1 - z0) / MULLION));
    for (let i = 0; i <= n; i++) frame.push(meterBox(0.07, y1 - y0, 0.07).translate(x, (y0 + y1) / 2, z0 + ((z1 - z0) * i) / n));
    frame.push(meterBox(0.08, 0.08, z1 - z0).translate(x, y0 + 0.04, (z0 + z1) / 2));
    frame.push(meterBox(0.08, 0.08, z1 - z0).translate(x, y1 - 0.04, (z0 + z1) / 2));
  }
}

/** Glazing along Z = const (front, end partition) between x spans. */
function glazingZ(z: number, spans: Span[], y0: number, y1: number, glass: THREE.BufferGeometry[], frame: THREE.BufferGeometry[]) {
  for (const [x0, x1] of spans) {
    glass.push(meterBox(x1 - x0, y1 - y0, 0.024).translate((x0 + x1) / 2, (y0 + y1) / 2, z));
    const n = Math.max(1, Math.round((x1 - x0) / MULLION));
    for (let i = 0; i <= n; i++) frame.push(meterBox(0.07, y1 - y0, 0.07).translate(x0 + ((x1 - x0) * i) / n, (y0 + y1) / 2, z));
    frame.push(meterBox(x1 - x0, 0.08, 0.08).translate((x0 + x1) / 2, y0 + 0.04, z));
    frame.push(meterBox(x1 - x0, 0.08, 0.08).translate((x0 + x1) / 2, y1 - 0.04, z));
  }
}

export function buildAnnex(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'annex';
  const { materials } = ctx;

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e7f0f2',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide,
  });
  const anodised = new THREE.MeshStandardMaterial({ color: '#a1aab2', metalness: 0.9, roughness: 0.38, ...materials.maps('metal', 0.9, Math.PI / 2), envMapIntensity: 1.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#f1f2f0', roughness: 0.85 });
  const navy = new THREE.MeshStandardMaterial({ color: BRAND.navy, roughness: 0.5, metalness: 0.2 });
  const cladding = materials.adopt(panelTexture('#c5ccd3', '#98a2ab', 256));
  const exterior = new THREE.MeshStandardMaterial({ map: cladding, roughness: 0.5, metalness: 0.3 });
  const floorFinish = new THREE.MeshPhysicalMaterial({ color: '#d5d3cd', roughness: 4, ...materials.maps('ceramic', 1.2), normalScale: new THREE.Vector2(1.2, 1.2), clearcoat: 0.3, clearcoatRoughness: 0.25 });
  const galvanised = new THREE.MeshStandardMaterial({ color: '#8f989f', metalness: 0.8, roughness: 0.45 });

  // Floors, slab with navy edge, roof and solid outer walls.
  const floors = new THREE.Mesh(
    mergeGeometries([worldPlane(A.x0, A.x1, A.z0, A.z1, 0.004), worldPlane(A.x0, A.x1, A.z0, A.z1, A.upper + 0.002)])!,
    floorFinish,
  );
  floors.receiveShadow = ctx.shadows;
  group.add(floors);
  group.add(shadowed(new THREE.Mesh(meterBox(A.x1 - A.x0 + 0.3, A.upper - A.slab, A.z1 - A.z0).translate((A.x0 + A.x1 + 0.3) / 2, (A.slab + A.upper) / 2, (A.z0 + A.z1) / 2), white), ctx));
  group.add(new THREE.Mesh(mergeGeometries([
    meterBox(A.x1 - A.x0 + 0.34, A.upper - A.slab + 0.04, 0.05).translate((A.x0 + A.x1 + 0.3) / 2, (A.slab + A.upper) / 2, A.z1 + 0.02),
    meterBox(0.05, A.upper - A.slab + 0.04, A.z1 - A.z0).translate(A.x0 - 0.02, (A.slab + A.upper) / 2, (A.z0 + A.z1) / 2),
  ])!, navy));
  group.add(shadowed(new THREE.Mesh(meterBox(A.x1 - A.x0 + 0.3, A.roof - CEILING, A.z1 - A.z0 + 0.3).translate((A.x0 + A.x1 + 0.3) / 2, (A.roof + CEILING) / 2, (A.z0 + A.z1 - 0.3) / 2), white), ctx));
  group.add(new THREE.Mesh(meterBox(A.x1 - A.x0 + 0.34, 0.32, 0.05).translate((A.x0 + A.x1 + 0.3) / 2, A.roof - 0.1, A.z1 + 0.02), navy));
  const walls = [
    meterBox(0.3, A.roof, A.z1 - A.z0 + 0.3).translate(A.x1 + 0.15, A.roof / 2, (A.z0 + A.z1 - 0.3) / 2),
    meterBox(A.x1 - A.x0, A.roof, 0.3).translate((A.x0 + A.x1) / 2, A.roof / 2, A.z0 - 0.15),
  ];
  group.add(shadowed(new THREE.Mesh(mergeGeometries(walls)!, exterior), ctx));
  group.add(new THREE.Mesh(mergeGeometries([
    meterBox(0.02, A.roof - 0.02, A.z1 - A.z0).translate(A.x1 - 0.01, A.roof / 2, (A.z0 + A.z1) / 2),
    meterBox(A.x1 - A.x0, A.roof - 0.02, 0.02).translate((A.x0 + A.x1) / 2, A.roof / 2, A.z0 + 0.01),
  ])!, white));

  // Glazing: hangar side (both floors), front façade, studio end partition, balustrade.
  const glass: THREE.BufferGeometry[] = [];
  const frame: THREE.BufferGeometry[] = [];
  const doorHeight = 2.4;
  glazingX(A.x0, [[A.z0, A.groundDoorZ[0]], [A.groundDoorZ[1], A.z1]], 0, A.slab, glass, frame);
  glazingX(A.x0, [[A.groundDoorZ[0], A.groundDoorZ[1]]], doorHeight, A.slab, glass, frame);
  glazingX(A.x0, [[A.studioEndZ, A.z1]], A.upper, CEILING, glass, frame);
  glazingX(A.x0, [[A.z0, A.studioEndZ]], A.upper, A.upper + 1.1, glass, frame);
  glazingZ(A.z1, [[A.x0, A.groundFrontDoorX[0]], [A.groundFrontDoorX[1], A.x1]], 0, A.slab, glass, frame);
  glazingZ(A.z1, [A.groundFrontDoorX], doorHeight, A.slab, glass, frame);
  glazingZ(A.z1, [[A.x0, A.upperFrontDoorX[0]], [A.upperFrontDoorX[1], A.x1]], A.upper, CEILING, glass, frame);
  glazingZ(A.z1, [A.upperFrontDoorX], A.upper + 2.5, CEILING, glass, frame);
  glazingZ(A.studioEndZ, [[A.studioEndDoorX[1], A.x1]], A.upper, CEILING, glass, frame);
  glazingZ(A.studioEndZ, [A.studioEndDoorX], A.upper + 2.5, CEILING, glass, frame);
  // Door frames: heavier jambs at every opening the camera passes.
  const jamb = (x: number, z: number, y0: number, y1: number, alongX: boolean) =>
    frame.push(meterBox(alongX ? 0.12 : 0.16, y1 - y0, alongX ? 0.16 : 0.12).translate(x, (y0 + y1) / 2, z));
  for (const z of A.groundDoorZ) jamb(A.x0, z, 0, doorHeight, false);
  for (const x of A.groundFrontDoorX) jamb(x, A.z1, 0, doorHeight, true);
  for (const x of A.upperFrontDoorX) jamb(x, A.z1, A.upper, A.upper + 2.5, true);
  for (const x of A.studioEndDoorX) jamb(x, A.studioEndZ, A.upper, A.upper + 2.5, true);
  group.add(new THREE.Mesh(mergeGeometries(glass)!, glassMaterial));
  group.add(shadowed(new THREE.Mesh(mergeGeometries(frame)!, anodised), ctx));

  // Frosted logo manifestation on the briefing-room glass (hangar side), at eye height.
  const manifestation = glassManifestation(2048, 128, 8);
  manifestation.texture.wrapS = THREE.RepeatWrapping;
  const bandTextures: THREE.Texture[] = [];
  const manifestReady = useArtwork(ctx, manifestation).then(() => bandTextures.forEach((t) => (t.needsUpdate = true)));
  for (const [z0, z1] of [[A.z0, A.groundDoorZ[0]], [A.groundDoorZ[1], A.z1]] as Span[]) {
    const tex = manifestation.texture.clone();
    bandTextures.push(tex);
    tex.repeat.set((z1 - z0) / 10, 1);
    tex.needsUpdate = true;
    ctx.materials.adopt(tex);
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(z1 - z0, 0.32),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    );
    band.rotation.y = -Math.PI / 2;
    band.position.set(A.x0 - 0.02, 1.15, (z0 + z1) / 2);
    group.add(band);
  }

  // External stair and landing to the studio's front door.
  const L = A.landing;
  const stairParts: THREE.BufferGeometry[] = [meterBox(L.x1 - L.x0, 0.15, L.z1 - L.z0).translate((L.x0 + L.x1) / 2, A.upper - 0.075, (L.z0 + L.z1) / 2)];
  const steps = 20;
  const rise = A.upper / steps;
  const going = 0.31;
  for (let i = 0; i < steps; i++) {
    stairParts.push(meterBox(going, 0.05, 1.1).translate(L.x1 + going * (steps - i - 0.5), rise * (i + 1) - 0.025, -3.05));
  }
  for (const sz of [-3.62, -2.48]) {
    const run = Math.hypot(going * steps, A.upper);
    const stringer = meterBox(run, 0.28, 0.05);
    stringer.rotateZ(-Math.atan2(A.upper, going * steps));
    stringer.translate(L.x1 + (going * steps) / 2, A.upper / 2 - 0.12, sz);
    stairParts.push(stringer);
  }
  // Railings: landing edge (below the camera's passage) and the stair's outer side.
  stairParts.push(meterBox(L.x1 - L.x0, 0.05, 0.05).translate((L.x0 + L.x1) / 2, A.upper + 1.1, L.z1));
  for (let x = L.x0; x <= L.x1 + 0.01; x += (L.x1 - L.x0) / 3) stairParts.push(meterBox(0.04, 1.1, 0.04).translate(x, A.upper + 0.55, L.z1));
  const railRun = Math.hypot(going * steps, A.upper);
  const rail = meterBox(railRun, 0.05, 0.05);
  rail.rotateZ(-Math.atan2(A.upper, going * steps));
  rail.translate(L.x1 + (going * steps) / 2, A.upper / 2 + 1.0, -2.45);
  stairParts.push(rail);
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const x = L.x1 + going * steps * t;
    const y = A.upper * (1 - t);
    stairParts.push(meterBox(0.04, 1.0, 0.04).translate(x, y + 0.5, -2.45));
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(stairParts)!, galvanised), ctx));

  return { group, lights: [], ready: manifestReady, update() {} };
}
