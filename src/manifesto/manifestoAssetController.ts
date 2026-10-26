/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapted from the Manifesto M2–M6 kit (integration/manifestoAssetController.ts).
 * A deterministic object-animation driver: the bundled clip is paused and
 * evaluated at an absolute time derived from measured scroll progress, never
 * advanced by delta time, so every pose is reversible. Camera, renderer and
 * resource ownership stay with the host; dispose() only releases this mixer.
 */

import { AnimationMixer, LoopOnce, MathUtils, type Mesh, type Object3D } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { ChapterId } from '../utils/manifestoChoreography';

const clamp = (value: number) => MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
const smooth = (p: number, a: number, b: number) => {
  const x = clamp((p - a) / (b - a));
  return x * x * (3 - 2 * x);
};

type RouteData = { segments: number; radialSegments: number; drawFrom: number; drawTo: number };

export type ManifestoAssetController = ReturnType<typeof createManifestoAssetController>;

export function createManifestoAssetController(gltf: GLTF, id: ChapterId) {
  const clip = gltf.animations[0];
  if (!clip) throw new Error(`${id}: missing bundled animation clip`);
  const mixer = new AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip);
  action.setLoop(LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  action.paused = true;
  let disposed = false;
  let current = Number.NaN;

  // M5 traces its seven routes with index draw ranges; the clip alone does not do this.
  const routes: Mesh[] = [];
  if (id === 'M5') {
    gltf.scene.traverse((node: Object3D) => {
      if ((node as Mesh).isMesh && node.name.startsWith('M5_route_')) routes.push(node as Mesh);
    });
  }

  function setProgress(value: number, reducedMotion = false) {
    if (disposed) return;
    const p = reducedMotion ? 1 : clamp(value);
    if (p === current) return;
    current = p;
    action.enabled = true;
    action.paused = true;
    action.time = p * clip.duration;
    mixer.update(0);
    for (const node of routes) {
      const data = node.userData as RouteData;
      const visibleSegments = Math.floor(smooth(p, data.drawFrom, data.drawTo) * data.segments);
      node.geometry.setDrawRange(0, visibleSegments * data.radialSegments * 6);
    }
    gltf.scene.updateMatrixWorld(true);
  }

  setProgress(0);
  return {
    root: gltf.scene,
    duration: clip.duration,
    clipName: clip.name,
    setProgress,
    get progress() {
      return current;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
    },
  };
}
