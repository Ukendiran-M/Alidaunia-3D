/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M6: Closing Finished Heliport Stage
 * Renders the completed operational heliport at a quiet, smaller architectural scale.
 * A single gentle camera move settles into a balanced 3/4 view during entry, then stops completely.
 */

import * as THREE from 'three';
import { createHeliportModel, type HeliportModel } from './createHeliportModel';
import { computeClosingPrinciplesState, type ClosingPrinciplesState } from '../utils/closingPrinciplesPose';

export interface ClosingHeliportStageOptions {
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

export function createClosingHeliportStage(
  container: HTMLElement,
  options: ClosingHeliportStageOptions = {}
) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#F5F6F7');

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // Key architectural light for finished pad depth
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(10, 18, 12);
  keyLight.castShadow = !mobile;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.00015;
  scene.add(keyLight);

  // Cool fill light
  const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
  fillLight.position.set(-12, 10, -10);
  scene.add(fillLight);

  // Soft ambient fill
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.85);
  scene.add(hemiLight);

  // Clean plinth disc underneath the finished heliport
  const plinthGeom = new THREE.CylinderGeometry(8.5, 9.0, 0.4, 48);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.05,
  });
  const plinthMesh = new THREE.Mesh(plinthGeom, plinthMat);
  plinthMesh.position.set(0, -0.4, 0);
  plinthMesh.receiveShadow = true;
  scene.add(plinthMesh);

  // Finished 3D heliport model at quiet architectural scale
  let model: HeliportModel | undefined;
  try {
    model = createHeliportModel();
    // All groups assembled at rest position
    model.groups.foundation.position.set(0, 0, 0);
    model.groups.slab.position.set(0, 0, 0);
    model.groups.markings.position.set(0, 0, 0);
    model.groups.lighting.position.set(0, 0, 0);
    model.groups.serviceZone.position.set(0, 0, 0);

    // Apply quiet architectural scale
    model.root.scale.set(0.65, 0.65, 0.65);
    scene.add(model.root);
  } catch (err) {
    console.warn('Could not initialize closing heliport model:', err);
    options.onError?.(err, true);
  }

  let disposed = false;
  let isVisible = true;
  let progress = 0;
  let frame = 0;

  function pose(p: number) {
    if (disposed) return;
    const state: ClosingPrinciplesState = computeClosingPrinciplesState(p);

    camera.position.set(...state.cameraPosition);
    camera.lookAt(...state.cameraTarget);

    if (model) {
      model.root.rotation.y = state.modelRotationY;
      model.root.scale.set(state.modelScale, state.modelScale, state.modelScale);
    }
  }

  function render() {
    frame = 0;
    if (!disposed && isVisible) {
      renderer.render(scene, camera);
    }
  }

  function invalidate() {
    if (!disposed && isVisible && !frame) {
      frame = requestAnimationFrame(render);
    }
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;

    const aspect = width / height;
    if (aspect < 1.4) {
      camera.fov = 32 * (1.4 / aspect);
    } else {
      camera.fov = 32;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // Visibility Gate
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          invalidate();
        }
      }
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(container);

  // Initial pose
  pose(options.reducedMotion ? 1.0 : progress);
  resize();
  options.onReady?.();
  invalidate();

  return {
    setProgress(p: number) {
      if (disposed) return;
      progress = THREE.MathUtils.clamp(p, 0, 1);
      pose(progress);
      invalidate();
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
      model?.dispose();
      plinthGeom.dispose();
      plinthMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
