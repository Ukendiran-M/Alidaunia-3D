/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The Alidaunia working hangar: long-span roof trusses, insulated cladding
 * with a navy dado, blue structural columns, high-bay practicals, tracked
 * doors (one moving leaf provides the V1 → V2 wipe), a modest branded sign
 * inside and on the front fascia, the parking line and a maintenance stand.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, aircraftToWorld, doorLeafX0 } from '../../utils/visionJourney';
import { BRAND, hangarSign, panelTexture } from '../artwork';
import { meterBox, segmentMatrix, shadowed, useArtwork, worldPlane, type Zone, type ZoneContext } from '../geometry';

const HG = LAYOUT.hangar;
const DR = LAYOUT.door;
const WALL = 0.3;

function trussGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const bottom = HG.doorHeight + 0.45;
  const chord = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const g = new THREE.CylinderGeometry(r, r, 1, 8);
    g.applyMatrix4(segmentMatrix(a, b));
    parts.push(g);
  };
  for (const z of HG.trussZ) {
    const eave = new THREE.Vector3(HG.x0 + 0.3, HG.eave - 0.15, z);
    const ridge = new THREE.Vector3(0, HG.ridge - 0.2, z);
    const eaveR = new THREE.Vector3(HG.x1 - 0.3, HG.eave - 0.15, z);
    parts.push(meterBox(HG.x1 - HG.x0 - 0.6, 0.26, 0.3).translate(0, bottom, z));
    chord(eave, ridge, 0.15);
    chord(ridge, eaveR, 0.15);
    // Warren web between the bottom chord and the rafters.
    const top = (x: number) => (x < 0 ? THREE.MathUtils.lerp(eave.y, ridge.y, (x - eave.x) / -eave.x) : THREE.MathUtils.lerp(ridge.y, eaveR.y, x / eaveR.x));
    const panels = 12;
    for (let i = 0; i < panels; i++) {
      const xa = THREE.MathUtils.lerp(HG.x0 + 0.3, HG.x1 - 0.3, i / panels);
      const xb = THREE.MathUtils.lerp(HG.x0 + 0.3, HG.x1 - 0.3, (i + 1) / panels);
      const low = i % 2 === 0;
      chord(new THREE.Vector3(xa, low ? bottom : top(xa), z), new THREE.Vector3(xb, low ? top(xb) : bottom, z), 0.055);
      chord(new THREE.Vector3(xb, bottom, z), new THREE.Vector3(xb, top(xb), z), 0.045);
    }
  }
  return mergeGeometries(parts)!;
}

function roofGeometry(offset: number) {
  const half = (sign: 1 | -1) => {
    const g = new THREE.PlaneGeometry(1, 1);
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5;
      const v = p.getY(i) + 0.5;
      const x = sign * u * (HG.x1 + 0.4);
      const y = THREE.MathUtils.lerp(HG.ridge, HG.eave, u) + offset;
      const z = THREE.MathUtils.lerp(HG.zBack - 0.4, HG.zFront + 0.6, v);
      p.setXYZ(i, x, y, z);
      uv.setXY(i, x, z);
    }
    g.computeVertexNormals();
    return g;
  };
  return mergeGeometries([half(1), half(-1)])!;
}

export function buildHangar(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'hangar';
  const { materials, mobile } = ctx;
  const metal = (tile: number, rotation = 0) => materials.maps('metal', tile, rotation);

  const cladding = materials.adopt(panelTexture('#46515e', '#323b46', 256));
  const wallPanel = new THREE.MeshStandardMaterial({ map: cladding, roughness: 0.62, metalness: 0.15 });
  const dado = new THREE.MeshStandardMaterial({ color: '#0e1b2c', roughness: 0.5, metalness: 0.25 });
  const exteriorCladding = materials.adopt(panelTexture('#c5ccd3', '#98a2ab', 256));
  const exterior = new THREE.MeshStandardMaterial({ map: exteriorCladding, roughness: 0.5, metalness: 0.3 });
  const steelWhite = new THREE.MeshStandardMaterial({ color: '#5a6571', roughness: 0.5, metalness: 0.45 });
  const brandSteel = new THREE.MeshStandardMaterial({ color: BRAND.blue, roughness: 0.42, metalness: 0.3 });
  const roofUnderside = new THREE.MeshStandardMaterial({ color: '#262d36', roughness: 0.75, metalness: 0.4, side: THREE.DoubleSide });
  const roofTop = new THREE.MeshStandardMaterial({ color: '#6f7984', roughness: 0.55, metalness: 0.5, side: THREE.DoubleSide });
  const floor = new THREE.MeshPhysicalMaterial({
    color: '#565d64',
    roughness: 2.6,
    ...materials.maps('ceramic', 1.6),
    normalScale: new THREE.Vector2(1.6, 1.6),
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });
  const lineYellow = new THREE.MeshStandardMaterial({ color: '#e5b21c', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1 });
  const luminaire = new THREE.MeshBasicMaterial({ color: '#fbf7ee' });
  const skylight = new THREE.MeshBasicMaterial({ color: '#dfe8f0', side: THREE.DoubleSide });
  const anodised = new THREE.MeshStandardMaterial({ color: '#8d969f', metalness: 0.9, roughness: 0.5, ...metal(1.2) });

  // Floor, the yellow parking line and a stop bar at the nose wheel.
  const floorMesh = new THREE.Mesh(worldPlane(HG.x0, HG.x1, HG.zBack, HG.zFront + 0.6), floor);
  floorMesh.receiveShadow = ctx.shadows;
  group.add(floorMesh);
  const nose = aircraftToWorld([3.69, 0, -0.04]);
  const ahead = aircraftToWorld([4.69, 0, -0.04]);
  const dx = ahead[0] - nose[0];
  const dz = ahead[2] - nose[2];
  const lineLength = (LAYOUT.apron.z1 - 6 - nose[2]) / dz;
  const heading = Math.atan2(dx, dz);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.16, lineLength), lineYellow);
  line.rotation.set(-Math.PI / 2, 0, -heading);
  line.position.set(nose[0] + (dx * lineLength) / 2, 0.012, nose[2] + (dz * lineLength) / 2);
  const stop = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.16), lineYellow);
  stop.rotation.set(-Math.PI / 2, 0, -heading);
  stop.position.set(nose[0] + dx * 0.55, 0.012, nose[2] + dz * 0.55);
  group.add(line, stop);

  // Walls: interior cladding; the right wall gives way to the annex glazing.
  const h = HG.eave;
  const an = LAYOUT.annex;
  const wallParts: THREE.BufferGeometry[] = [
    meterBox(WALL, h, HG.zFront - HG.zBack).translate(HG.x0 - WALL / 2, h / 2, (HG.zBack + HG.zFront) / 2),
    meterBox(HG.x1 - HG.x0 + WALL * 2, h, WALL).translate(0, h / 2, HG.zBack - WALL / 2),
    meterBox(WALL, h, an.z0 - HG.zBack).translate(HG.x1 + WALL / 2, h / 2, (HG.zBack + an.z0) / 2),
    meterBox(WALL, h, HG.zFront - an.z1).translate(HG.x1 + WALL / 2, h / 2, (an.z1 + HG.zFront) / 2),
    meterBox(WALL, h - an.roof, an.z1 - an.z0).translate(HG.x1 + WALL / 2, (h + an.roof) / 2, (an.z0 + an.z1) / 2),
  ];
  group.add(shadowed(new THREE.Mesh(mergeGeometries(wallParts)!, wallPanel), ctx));
  group.add(
    new THREE.Mesh(
      mergeGeometries([
        meterBox(0.04, 1.2, HG.zFront - HG.zBack).translate(HG.x0 + 0.02, 0.6, (HG.zBack + HG.zFront) / 2),
        meterBox(HG.x1 - HG.x0, 1.2, 0.04).translate(0, 0.6, HG.zBack + 0.02),
      ])!,
      dado,
    ),
  );

  // Front gable above the door, brand-blue header beam, outer faces and roof.
  const gableShape = new THREE.Shape([
    new THREE.Vector2(HG.x0 - WALL, HG.doorHeight + 0.9),
    new THREE.Vector2(HG.x1 + WALL, HG.doorHeight + 0.9),
    new THREE.Vector2(HG.x1 + WALL, HG.eave),
    new THREE.Vector2(0, HG.ridge),
    new THREE.Vector2(HG.x0 - WALL, HG.eave),
  ]);
  const gable = new THREE.ExtrudeGeometry(gableShape, { depth: 0.4, bevelEnabled: false });
  gable.translate(0, 0, HG.zFront + 0.1);
  group.add(shadowed(new THREE.Mesh(gable, exterior), ctx));
  const header = new THREE.Mesh(meterBox(HG.x1 - HG.x0 + WALL * 2, 0.9, 0.7), brandSteel);
  header.position.set(0, HG.doorHeight + 0.45, HG.zFront + 0.3);
  group.add(shadowed(header, ctx));
  group.add(
    new THREE.Mesh(
      mergeGeometries([
        meterBox(0.06, h, HG.zFront - HG.zBack + 0.6).translate(HG.x0 - WALL - 0.03, h / 2, (HG.zBack + HG.zFront) / 2),
        meterBox(HG.x1 - HG.x0 + 0.66, h, 0.06).translate(0, h / 2, HG.zBack - WALL - 0.03),
      ])!,
      exterior,
    ),
  );
  group.add(shadowed(new THREE.Mesh(roofGeometry(-0.02), roofUnderside), ctx, true, false));
  group.add(shadowed(new THREE.Mesh(roofGeometry(0.18), roofTop), ctx));
  for (const x of [-7.5, 7.5]) {
    const slope = Math.atan2(HG.ridge - HG.eave, HG.x1 + 0.4);
    const stripGeometry = new THREE.PlaneGeometry(1.2, HG.zFront - HG.zBack - 4).rotateX(Math.PI / 2).rotateZ(-Math.sign(x) * slope);
    const strip = new THREE.Mesh(stripGeometry, skylight);
    strip.position.set(x, THREE.MathUtils.lerp(HG.ridge, HG.eave, Math.abs(x) / (HG.x1 + 0.4)) - 0.06, (HG.zBack + HG.zFront) / 2);
    group.add(strip);
  }

  // Long-span trusses and blue columns.
  group.add(shadowed(new THREE.Mesh(trussGeometry(), steelWhite), ctx, true, false));
  const columns = new THREE.InstancedMesh(meterBox(0.42, HG.eave, 0.5), brandSteel, HG.trussZ.length * 2);
  const m = new THREE.Matrix4();
  HG.trussZ.forEach((tz, i) => {
    columns.setMatrixAt(i * 2, m.makeTranslation(HG.x0 + 0.21, HG.eave / 2, tz));
    columns.setMatrixAt(i * 2 + 1, m.makeTranslation(HG.x1 - 0.21, HG.eave / 2, tz));
  });
  group.add(shadowed(columns, ctx));

  // High-bay practicals under the bottom chords.
  const lampSpots: [number, number][] = [];
  for (const lz of [-6, -12, -18, -24, -30]) for (const lx of [-9, 0, 9]) lampSpots.push([lx, lz]);
  const lamps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.42, 0.22, 20), luminaire, lampSpots.length);
  const housings = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 20), anodised, lampSpots.length);
  lampSpots.forEach(([lx, lz], i) => {
    lamps.setMatrixAt(i, m.makeTranslation(lx, HG.doorHeight - 0.05, lz));
    housings.setMatrixAt(i, m.makeTranslation(lx, HG.doorHeight + 0.12, lz));
  });
  group.add(lamps, housings);

  // Door tracks, stacked leaves and the moving leaf.
  const tracks = [0.36, 0.68, DR.trackZ].flatMap((tz) => [
    meterBox(HG.x1 - HG.x0 + 2, 0.16, 0.2).translate(0, HG.doorHeight + 0.02, tz),
    meterBox(HG.x1 - HG.x0 + 2, 0.012, 0.08).translate(0, 0.006, tz),
  ]);
  group.add(new THREE.Mesh(mergeGeometries(tracks)!, anodised));
  const doorTexture = materials.adopt(panelTexture('#eef1f3', '#c3cad0', 256, false));
  doorTexture.repeat.set(1, 1 / 0.8);
  const doorPanel = new THREE.MeshStandardMaterial({ map: doorTexture, roughness: 0.45, metalness: 0.25 });
  const doorGlass = new THREE.MeshPhysicalMaterial({ color: '#2b3f52', roughness: 0.08, metalness: 0.1, envMapIntensity: 1.6 });
  const leaf = (width: number) => {
    const g = new THREE.Group();
    const leafHeight = HG.doorHeight - 0.1;
    const panel = new THREE.Mesh(meterBox(width, leafHeight, DR.thickness), doorPanel);
    panel.position.y = leafHeight / 2;
    const band = new THREE.Mesh(meterBox(width - 0.6, 0.7, DR.thickness + 0.04), doorGlass);
    band.position.y = 6.9;
    const kick = new THREE.Mesh(meterBox(width, 0.9, DR.thickness + 0.02), dado);
    kick.position.y = 0.45;
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(meterBox(0.14, leafHeight, DR.thickness + 0.06), brandSteel);
      stile.position.set(side * (width / 2 - 0.07), leafHeight / 2, 0);
      g.add(stile);
    }
    g.add(panel, band, kick);
    return shadowed(g, ctx);
  };
  for (const [x0, x1, tz] of DR.stack) {
    const stacked = leaf(x1 - x0);
    stacked.position.set((x0 + x1) / 2, 0, tz);
    group.add(stacked);
  }
  const moving = leaf(DR.leafWidth);
  moving.position.z = DR.trackZ;
  group.add(moving);

  // Signs: a modest plate inside on the back wall and one on the front fascia.
  const inside = hangarSign(1536, 480, BRAND.navy);
  const outside = hangarSign(1536, 480, BRAND.blue, '#cfe0f3');
  const signsReady = useArtwork(ctx, inside, outside);
  const signFrame = new THREE.MeshStandardMaterial({ color: '#9aa3ab', metalness: 0.9, roughness: 0.35, ...metal(0.8) });
  const sign = (map: THREE.Texture, w: number, x: number, y: number, z: number) => {
    const s = new THREE.Group();
    const frame = new THREE.Mesh(meterBox(w + 0.12, w / 3.2 + 0.12, 0.08), signFrame);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 3.2), new THREE.MeshStandardMaterial({ map, roughness: 0.4, metalness: 0.05 }));
    face.position.z = 0.045;
    s.add(frame, face);
    s.position.set(x, y, z);
    return s;
  };
  group.add(sign(inside.texture, 5.2, 0, 6.6, HG.zBack + 0.08));
  group.add(sign(outside.texture, 7.2, 0, HG.eave + 0.2, HG.zFront + 0.56));

  // Mobile maintenance stand beside the cabin.
  const st = LAYOUT.stand;
  const standYellow = new THREE.MeshStandardMaterial({ color: '#e7b21e', roughness: 0.55, metalness: 0.2 });
  const grating = new THREE.MeshStandardMaterial({ color: '#7d868e', roughness: 0.6, metalness: 0.7 });
  const standParts: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      standParts.push(meterBox(0.06, st.deck, 0.06).translate(sx * (st.halfX - 0.04), st.deck / 2, sz * (st.halfZ - 0.04)));
      standParts.push(meterBox(0.05, st.rail - st.deck, 0.05).translate(sx * (st.halfX - 0.03), (st.rail + st.deck) / 2, sz * (st.halfZ - 0.03)));
    }
    standParts.push(meterBox(0.05, 0.05, st.halfZ * 2).translate(sx * (st.halfX - 0.03), st.rail, 0));
    standParts.push(meterBox(0.05, 0.05, st.halfZ * 2).translate(sx * (st.halfX - 0.03), (st.rail + st.deck) / 2, 0));
  }
  standParts.push(meterBox(st.halfX * 2, 0.05, 0.05).translate(0, st.rail, -st.halfZ + 0.03));
  for (let i = 0; i < 5; i++) standParts.push(meterBox(0.28, 0.04, 0.8).translate(st.halfX + 0.16 + i * 0.28, st.deck - (i + 1) * (st.deck / 6), st.halfZ - 0.45));
  const standGroup = new THREE.Group();
  standGroup.add(new THREE.Mesh(mergeGeometries(standParts)!, standYellow), new THREE.Mesh(meterBox(st.halfX * 2, 0.06, st.halfZ * 2).translate(0, st.deck, 0), grating));
  standGroup.position.set(st.x, 0, st.z);
  standGroup.rotation.y = -0.35;
  group.add(shadowed(standGroup, ctx));

  // Navy tool cabinets along the back wall and an extinguisher on a column.
  const cabinets = new THREE.InstancedMesh(meterBox(1.6, 1.05, 0.6), dado, 6);
  for (let i = 0; i < 6; i++) cabinets.setMatrixAt(i, m.makeTranslation(-11 + i * 1.7, 0.525, HG.zBack + 0.35));
  group.add(shadowed(cabinets, ctx));
  const extinguisher = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 16), new THREE.MeshStandardMaterial({ color: BRAND.red, roughness: 0.4 }));
  extinguisher.position.set(HG.x0 + 0.55, 1.1, HG.trussZ[1] + 0.4);
  group.add(extinguisher);

  // Light pools from the high-bays (one shadowed, over the aircraft) and daylight through the door.
  const lights: THREE.Light[] = [];
  const pool = (x: number, z: number, intensity: number, shadow: boolean) => {
    const l = new THREE.SpotLight('#fff3e3', intensity, 0, 0.75, 0.9, 2);
    l.position.set(x, HG.doorHeight - 0.2, z);
    l.target.position.set(x, 0, z);
    ctx.scene.add(l.target);
    if (shadow && ctx.shadows) {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
      l.shadow.bias = -0.0006;
      l.shadow.normalBias = 0.03;
      l.shadow.camera.near = 2;
      l.shadow.camera.far = 16;
    }
    lights.push(l);
  };
  pool(LAYOUT.aircraft.x, LAYOUT.aircraft.z, 150, true);
  pool(-6, -16, 170, false);
  if (!mobile) pool(6, -26, 150, false);
  const daylight = new THREE.SpotLight('#eef3f8', 1100, 0, 0.34, 1, 2);
  daylight.position.set(1, 9, 24);
  daylight.target.position.set(4, 1.5, -12);
  ctx.scene.add(daylight.target);
  lights.push(daylight);

  return {
    group,
    lights,
    ready: signsReady,
    update(s) {
      moving.position.x = doorLeafX0(s) + DR.leafWidth / 2;
    },
  };
}
