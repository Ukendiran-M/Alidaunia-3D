/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The parked AW139 — the same prepared asset as the Manifesto, loaded as this
 * route's own instance. It stays assembled, grounded and stationary in one
 * world position for the whole page: the rotor never turns and nothing is
 * exploded. Materials are cloned before any page-two adjustment so nothing can
 * leak into the first page.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HERO_ASSETS } from '../../config/assets';
import { LAYOUT, aircraftToWorld } from '../../utils/visionJourney';
import { contactShadowTexture } from '../artwork';
import { meterBox, type Zone, type ZoneContext } from '../geometry';

/** Main-gear and nose-gear wheel positions in model space. */
const WHEELS: [number, number][] = [
  [0.08, -1.32],
  [0.08, 1.22],
  [3.69, -0.04],
];

export function buildAircraft(ctx: ZoneContext): Zone {
  const group = new THREE.Group();
  group.name = 'AW139-parked';
  const { x, z, yaw } = LAYOUT.aircraft;
  const aircraft = new THREE.Group();
  aircraft.position.set(x, 0, z);
  aircraft.rotation.y = yaw;
  group.add(aircraft);

  // Soft ground contact: a broad occlusion under the airframe plus tight pads under each wheel.
  const shadowMap = ctx.materials.adopt(contactShadowTexture(256, 0.55));
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: shadowMap, transparent: true, opacity: 0.5, depthWrite: false });
  const body = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 3.8), shadowMaterial);
  body.rotation.x = -Math.PI / 2;
  body.position.set(-0.4, 0.008, 0);
  aircraft.add(body);
  const padMaterial = shadowMaterial.clone();
  padMaterial.opacity = 0.75;
  for (const [wx, wz] of WHEELS) {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.55), padMaterial);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(wx, 0.01, wz);
    aircraft.add(pad);
  }

  // Wheel chocks: an ordinary operational detail that grounds the parked aircraft.
  const chockMaterial = new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.7 });
  const chockShape = new THREE.Shape([new THREE.Vector2(-0.14, 0), new THREE.Vector2(0.14, 0), new THREE.Vector2(0.05, 0.12), new THREE.Vector2(-0.05, 0.12)]);
  const chockGeometry = new THREE.ExtrudeGeometry(chockShape, { depth: 0.22, bevelEnabled: false });
  chockGeometry.translate(0, 0, -0.11);
  const chocks = new THREE.InstancedMesh(chockGeometry, chockMaterial, WHEELS.length * 2);
  const m = new THREE.Matrix4();
  WHEELS.forEach(([wx, wz], i) => {
    chocks.setMatrixAt(i * 2, m.makeTranslation(wx - 0.32, 0, wz));
    chocks.setMatrixAt(i * 2 + 1, m.makeTranslation(wx + 0.32, 0, wz));
  });
  chocks.castShadow = ctx.shadows;
  aircraft.add(chocks);
  // Ground-handling wheel tow bar, parked in front of the nose.
  const towBar = new THREE.Mesh(meterBox(1.9, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.6 }));
  towBar.position.set(4.9, 0.04, 0.9);
  towBar.rotation.y = 0.5;
  aircraft.add(towBar);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const ready = loader.loadAsync(HERO_ASSETS.model).then((gltf) => {
    const model = gltf.scene;
    if (!ctx.alive()) {
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        (Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []).forEach((mat) => mat.dispose());
      });
      return;
    }
    const clones = new Map<THREE.Material, THREE.Material>();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = ctx.shadows;
      mesh.receiveShadow = ctx.shadows;
      const swap = (source: THREE.Material) => {
        let clone = clones.get(source);
        if (!clone) {
          clone = source.clone();
          const physical = clone as THREE.MeshPhysicalMaterial;
          if (/glazing/i.test(clone.name) && physical.isMeshPhysicalMaterial) {
            // Opaque tinted glazing: keeps the reflective look without a transmission pass.
            physical.transmission = 0;
            physical.transparent = true;
            physical.opacity = 0.9;
            physical.envMapIntensity = 1.6;
          } else if (/paint/i.test(clone.name) && physical.isMeshPhysicalMaterial) {
            physical.clearcoat = Math.max(physical.clearcoat, 0.6);
            physical.clearcoatRoughness = 0.12;
          }
          clones.set(source, clone);
        }
        return clone;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
    // The loaded originals are replaced by clones and are not used anywhere else.
    clones.forEach((_, source) => source.dispose());
    aircraft.add(model);
  });

  return {
    group,
    lights: [],
    ready,
    update() {
      // Parked and stationary: no state changes with scroll.
    },
  };
}

/** World-space positions useful to other zones (e.g. the parking line to the nose wheel). */
export const NOSE_WHEEL = aircraftToWorld([3.69, 0, -0.04]);
