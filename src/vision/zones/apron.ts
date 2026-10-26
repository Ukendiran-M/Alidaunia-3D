/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The apron and its engineered edge: concrete slabs with sealed joints and
 * light wear, a slot drain with a steel grating, a draw-pit cover with the
 * resealed trench of a service conduit, and an elevated airside edge light
 * modelled as a real fixture (footing, base plate and bolts, frangible
 * coupling, stem, housing, ribbed lens, cap). Illustrative, not a specification.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT, fixtureLight } from '../../utils/visionJourney';
import { apronConcreteTexture, gratingTexture } from '../artwork';
import { meterBox, shadowed, worldPlane, type Zone, type ZoneContext } from '../geometry';

const AP = LAYOUT.apron;
const [FX, , FZ] = LAYOUT.fixture;

function lensProfile() {
  const points: THREE.Vector2[] = [new THREE.Vector2(0.001, 0), new THREE.Vector2(0.044, 0)];
  const ribs = 9;
  for (let i = 0; i <= ribs * 2; i++) points.push(new THREE.Vector2(i % 2 === 0 ? 0.044 : 0.0475, (i / (ribs * 2)) * 0.075));
  points.push(new THREE.Vector2(0.001, 0.075));
  return new THREE.LatheGeometry(points, 40);
}

function edgeLight(metal: THREE.Material, dark: THREE.Material, footing: THREE.Material, lens: THREE.Material, lamp: THREE.Material) {
  const g = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    g.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 40), footing, 0.008);
  add(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 40), metal, 0.024);
  const bolts = mergeGeometries(
    [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return new THREE.CylinderGeometry(0.013, 0.013, 0.014, 6).translate(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1);
    }),
  )!;
  add(bolts, metal, 0.035);
  add(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 24), metal, 0.055);
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.005, 24), dark, 0.06);
  add(new THREE.CylinderGeometry(0.021, 0.021, 0.17, 20), metal, 0.165);
  add(new THREE.CylinderGeometry(0.052, 0.046, 0.04, 32), dark, 0.27);
  add(new THREE.CylinderGeometry(0.019, 0.019, 0.05, 16), lamp, 0.33);
  add(lensProfile(), lens, 0.29);
  add(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 32), metal, 0.371);
  add(new THREE.SphereGeometry(0.05, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.35, 1), metal, 0.376);
  return g;
}

export function buildApron(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'apron';
  const { materials } = ctx;
  const metalMaps = materials.maps('metal', 0.4);
  const concreteMap = materials.adopt(apronConcreteTexture(ctx.mobile ? 1024 : 2048));
  concreteMap.repeat.set(1 / 12, 1 / 12);
  const concrete = new THREE.MeshStandardMaterial({
    map: concreteMap,
    roughness: 6.2,
    ...materials.maps('ceramic', 0.45),
    normalScale: new THREE.Vector2(3.2, 3.2),
  });

  // Slabs: in front of the hangar, beside the annex and around its front.
  const slabs = [
    worldPlane(AP.x0, AP.x1, AP.z0 + 0.6, AP.z1, 0, -1.5, 3),
    worldPlane(LAYOUT.annex.x1, AP.x1, -34, AP.z0 + 0.6, 0, -1.5, 3),
    worldPlane(LAYOUT.hangar.x1 + 0.3, LAYOUT.annex.x1, LAYOUT.annex.z1, AP.z0 + 0.6, 0, -1.5, 3),
  ];
  const apron = new THREE.Mesh(mergeGeometries(slabs)!, concrete);
  apron.receiveShadow = ctx.shadows;
  group.add(apron);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ color: '#8f957f', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(10, -0.04, 0);
  ground.receiveShadow = ctx.shadows;
  group.add(ground);

  // Slot drain: dark channel, steel grating, edge angles.
  const drainX0 = LAYOUT.hangar.x0;
  const drainX1 = AP.x1 - 2;
  const length = drainX1 - drainX0;
  const cx = (drainX0 + drainX1) / 2;
  const z = LAYOUT.drainZ;
  const channel = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#15181b', roughness: 0.9 }));
  channel.position.set(cx, 0.002, z);
  const gratingMap = materials.adopt(gratingTexture());
  gratingMap.repeat.set(length / 0.5, 1);
  const grating = new THREE.Mesh(
    new THREE.PlaneGeometry(length, 0.2).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#4a5056', metalness: 0.85, roughness: 0.55, alphaMap: gratingMap, alphaTest: 0.5 }),
  );
  grating.position.set(cx, 0.005, z);
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#9aa2a8', metalness: 0.9, roughness: 0.4, ...metalMaps });
  const edges = new THREE.Mesh(
    mergeGeometries([meterBox(length, 0.012, 0.035).translate(cx, 0.006, z - 0.137), meterBox(length, 0.012, 0.035).translate(cx, 0.006, z + 0.137)])!,
    edgeMaterial,
  );
  group.add(channel, grating, edges);

  // Draw-pit cover and the resealed trench of the conduit feeding the light.
  const pit = new THREE.Group();
  const plate = new THREE.Mesh(meterBox(0.86, 0.016, 0.86), new THREE.MeshStandardMaterial({ color: '#8c949a', metalness: 0.2, roughness: 0.7, normalMap: materials.maps('metal', 0.25, Math.PI / 4).normalMap }));
  const frame = new THREE.Mesh(
    mergeGeometries([
      meterBox(0.96, 0.02, 0.05).translate(0, 0, 0.455),
      meterBox(0.96, 0.02, 0.05).translate(0, 0, -0.455),
      meterBox(0.05, 0.02, 0.86).translate(0.455, 0, 0),
      meterBox(0.05, 0.02, 0.86).translate(-0.455, 0, 0),
    ])!,
    edgeMaterial,
  );
  const keyholes = new THREE.Mesh(
    mergeGeometries([meterBox(0.05, 0.004, 0.018).translate(-0.25, 0.01, 0), meterBox(0.05, 0.004, 0.018).translate(0.25, 0.01, 0)])!,
    new THREE.MeshBasicMaterial({ color: '#0e1012' }),
  );
  plate.position.y = 0.008;
  frame.position.y = 0.01;
  pit.add(plate, frame, keyholes);
  pit.position.set(FX + 2.4, 0, FZ + 1.3);
  group.add(pit);
  const trench = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.22).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#8e8b85', roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 }),
  );
  const tdx = pit.position.x - FX;
  const tdz = pit.position.z - FZ;
  trench.scale.x = Math.hypot(tdx, tdz) - 0.5;
  trench.rotation.y = -Math.atan2(tdz, tdx);
  trench.position.set(FX + tdx / 2, 0.003, FZ + tdz / 2);
  group.add(trench);

  // Edge lights along the service joint; the first is the modelled close-up subject.
  const galvanised = new THREE.MeshStandardMaterial({ color: '#b9c0c6', metalness: 1, roughness: 0.42, ...metalMaps, envMapIntensity: 1.6 });
  const housing = new THREE.MeshStandardMaterial({ color: '#2f3439', metalness: 0.6, roughness: 0.5 });
  const footing = new THREE.MeshStandardMaterial({ color: '#cdcac3', roughness: 0.9 });
  const lens = new THREE.MeshPhysicalMaterial({
    color: '#3f9b67',
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.88,
    emissive: new THREE.Color('#4bdc85'),
    emissiveIntensity: 0,
    envMapIntensity: 1.4,
  });
  const lamp = new THREE.MeshBasicMaterial({ color: '#203a2b' });
  const lampOff = new THREE.Color('#203a2b');
  const lampOn = new THREE.Color('#d9ffe6');
  for (const x of [FX, FX + 6, FX + 12]) {
    const light = shadowed(edgeLight(galvanised, housing, footing, lens, lamp), ctx, true, false);
    light.position.set(x, 0, FZ);
    group.add(light);
  }

  // Yellow bollards protecting the annex corner.
  const bollards = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 1.0, 20), new THREE.MeshStandardMaterial({ color: '#e7b21e', roughness: 0.5 }), 2);
  const m = new THREE.Matrix4();
  bollards.setMatrixAt(0, m.makeTranslation(LAYOUT.annex.x1 + 0.6, 0.5, LAYOUT.annex.z1 + 0.8));
  bollards.setMatrixAt(1, m.makeTranslation(LAYOUT.annex.x1 + 0.6, 0.5, LAYOUT.annex.z1 + 3.2));
  group.add(shadowed(bollards, ctx));

  // Distant airfield context: a low tree line and a few service buildings, softened by haze.
  const trees = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: '#56664a', roughness: 1 }), 220);
  let seed = 991;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const q = new THREE.Quaternion();
  for (let i = 0; i < 220; i++) {
    const a = (i / 220) * Math.PI * 2;
    const r = 230 + rand() * 60;
    const size = 5 + rand() * 6;
    m.compose(new THREE.Vector3(10 + Math.cos(a) * r, size * 0.6, Math.sin(a) * r), q, new THREE.Vector3(size * (1 + rand()), size * (0.8 + rand() * 0.6), size * (1 + rand())));
    trees.setMatrixAt(i, m);
  }
  group.add(trees);
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#c3c8cc', roughness: 0.8 }), 7);
  [[120, 150, 40, 7, 18], [-90, 170, 30, 9, 22], [180, 40, 22, 6, 30], [-160, 60, 36, 8, 20], [60, 200, 26, 5, 14], [-40, -160, 44, 10, 24], [140, -120, 30, 7, 26]].forEach(([bx, bz, w, h, d], i) => {
    m.compose(new THREE.Vector3(bx, h / 2, bz), q, new THREE.Vector3(w, h, d));
    buildings.setMatrixAt(i, m);
  });
  group.add(buildings);

  const glow = new THREE.PointLight('#5cf09a', 0, 3.2, 2);
  glow.position.set(FX, 0.34, FZ);

  return {
    group,
    lights: [glow],
    update(s) {
      const on = fixtureLight(s);
      lens.emissiveIntensity = 1.6 * on;
      lamp.color.copy(lampOff).lerp(lampOn, on);
      glow.intensity = 0.9 * on;
    },
  };
}
