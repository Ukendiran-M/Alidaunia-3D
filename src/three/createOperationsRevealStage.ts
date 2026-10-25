/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M4: Operations Architectural Reveal WebGL Stage
 * Renders a full-width deep navy composition with an authentic operations photograph.
 * A shallow 3D architectural frame with two solid, bevelled structural panels
 * parts along the horizontal axis to reveal the operations photo as the visitor scrolls.
 */

import * as THREE from 'three';
import { computeOperationsRevealState, type OperationsRevealState } from '../utils/operationsRevealPose';
import { BRAND_ASSETS } from '../config/assets';

export interface OperationsRevealStageOptions {
  imageUrl?: string;
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

export function createOperationsRevealStage(
  container: HTMLElement,
  options: OperationsRevealStageOptions = {}
) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#081C33');

  // Camera looking directly at the architectural frame
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 16.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  // Key directional light highlighting bevelled panel edges and casting subtle shadow
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(8, 12, 10);
  keyLight.castShadow = !mobile;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  // Aviation blue rim light catching the chamfers
  const rimLight = new THREE.DirectionalLight(0x8bbeff, 1.4);
  rimLight.position.set(-10, -6, 8);
  scene.add(rimLight);

  // Soft ambient fill
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x081c33, 0.8);
  scene.add(hemiLight);

  // Geometry and material registry for clean disposal
  const stageGeometries = new Set<THREE.BufferGeometry>();
  const stageMaterials = new Set<THREE.Material>();
  const stageTextures = new Set<THREE.Texture>();

  function trackGeom<T extends THREE.BufferGeometry>(g: T): T {
    stageGeometries.add(g);
    return g;
  }
  function trackMat<T extends THREE.Material>(m: T): T {
    stageMaterials.add(m);
    return m;
  }
  function trackTex<T extends THREE.Texture>(t: T): T {
    stageTextures.add(t);
    return t;
  }

  // Parent pivot group for perspective tilt relaxation
  const pivotGroup = new THREE.Group();
  pivotGroup.name = 'operationsPivotGroup';
  scene.add(pivotGroup);

  // ========================================================
  // FLAT OPERATIONS PHOTOGRAPH
  // ========================================================
  // Exact 2.1132:1 aspect ratio matching the 4032x1908 image
  const photoWidth = 16.0;
  const photoHeight = photoWidth / 2.1132075; // ~7.571

  const photoGeom = trackGeom(new THREE.PlaneGeometry(photoWidth, photoHeight));
  const photoMaterial = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      toneMapped: true,
    })
  );
  const photoMesh = new THREE.Mesh(photoGeom, photoMaterial);
  photoMesh.position.set(0, 0, 0);
  photoMesh.receiveShadow = true;
  pivotGroup.add(photoMesh);

  // Photo backing shadow receiver & subtle border
  const backingGeom = trackGeom(new THREE.PlaneGeometry(photoWidth + 0.15, photoHeight + 0.15));
  const backingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x051222,
      roughness: 0.8,
      metalness: 0.2,
    })
  );
  const backingMesh = new THREE.Mesh(backingGeom, backingMat);
  backingMesh.position.set(0, 0, -0.05);
  pivotGroup.add(backingMesh);

  // ========================================================
  // TWO SOLID, BEVELLED ARCHITECTURAL PANELS (Parting Frame)
  // ========================================================
  const panelWidth = 6.4;
  const panelHeight = photoHeight + 1.2;
  const panelDepth = 0.32;

  const panelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x061527,
      roughness: 0.35,
      metalness: 0.25,
      flatShading: false,
    })
  );

  const trimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b4584,
      roughness: 0.25,
      metalness: 0.8,
    })
  );

  // Left solid panel group
  const leftPanelGroup = new THREE.Group();
  leftPanelGroup.name = 'leftPanel';
  const leftBoxGeom = trackGeom(new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth));
  const leftBoxMesh = new THREE.Mesh(leftBoxGeom, panelMat);
  leftBoxMesh.castShadow = !mobile;
  leftPanelGroup.add(leftBoxMesh);

  // Bevelled metallic edge trim along the inner parting seam
  const trimGeom = trackGeom(new THREE.BoxGeometry(0.08, panelHeight, panelDepth + 0.04));
  const leftTrim = new THREE.Mesh(trimGeom, trimMat);
  leftTrim.position.set(panelWidth / 2 - 0.04, 0, 0.02);
  leftPanelGroup.add(leftTrim);

  leftPanelGroup.position.set(-panelWidth / 2 - 0.05, 0, panelDepth / 2 + 0.05);
  pivotGroup.add(leftPanelGroup);

  // Right solid panel group
  const rightPanelGroup = new THREE.Group();
  rightPanelGroup.name = 'rightPanel';
  const rightBoxMesh = new THREE.Mesh(leftBoxGeom, panelMat);
  rightBoxMesh.castShadow = !mobile;
  rightPanelGroup.add(rightBoxMesh);

  const rightTrim = new THREE.Mesh(trimGeom, trimMat);
  rightTrim.position.set(-panelWidth / 2 + 0.04, 0, 0.02);
  rightPanelGroup.add(rightTrim);

  rightPanelGroup.position.set(panelWidth / 2 + 0.05, 0, panelDepth / 2 + 0.05);
  pivotGroup.add(rightPanelGroup);

  // Base X resting coordinates for panels
  const leftBaseX = -panelWidth / 2 - 0.05;
  const rightBaseX = panelWidth / 2 + 0.05;

  let disposed = false;
  let isVisible = true;
  let progress = 0;
  let frame = 0;

  // Load the real operations photograph
  const imageUrl = options.imageUrl ?? BRAND_ASSETS.operationsReference.url;
  new THREE.TextureLoader().load(
    imageUrl,
    (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      trackTex(texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      photoMaterial.map = texture;
      photoMaterial.needsUpdate = true;
      invalidate();
      options.onReady?.();
    },
    undefined,
    (err) => {
      console.warn('Could not load operations photograph texture:', err);
      options.onError?.(err, false);
    }
  );

  function pose(p: number) {
    if (disposed) return;
    const state: OperationsRevealState = computeOperationsRevealState(p);

    // 1. Tilt relaxation
    pivotGroup.rotation.x = state.tiltRotation[0];
    pivotGroup.rotation.y = state.tiltRotation[1];
    pivotGroup.rotation.z = state.tiltRotation[2];

    // 2. Photo scaling (78% -> 100%)
    photoMesh.scale.set(state.imageScale, state.imageScale, 1);
    backingMesh.scale.set(state.imageScale, state.imageScale, 1);

    // 3. Solid bevelled panels parting to the left and right
    leftPanelGroup.position.x = leftBaseX + state.panelOffsetLeft;
    rightPanelGroup.position.x = rightBaseX + state.panelOffsetRight;

    // When fully settled, move panels cleanly out of view
    if (state.isSettled) {
      leftPanelGroup.visible = false;
      rightPanelGroup.visible = false;
    } else {
      leftPanelGroup.visible = true;
      rightPanelGroup.visible = true;
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

    // Adjust camera Z distance slightly on narrower aspect ratios to frame photo cleanly
    const aspect = width / height;
    if (aspect < 1.6) {
      camera.position.z = 16.5 * (1.6 / aspect);
    } else {
      camera.position.z = 16.5;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // Visibility Gate: only render when stage intersects viewport
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
      stageGeometries.forEach((g) => g.dispose());
      stageMaterials.forEach((m) => m.dispose());
      stageTextures.forEach((t) => t.dispose());
      stageGeometries.clear();
      stageMaterials.clear();
      stageTextures.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
