/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M3: Project Lifecycle 3D WebGL Stage
 * Manages in-place evolution of a single heliport site through:
 * 1. Analisi: Topographical contour lines & unbuilt footprint
 * 2. Progetto: Architectural CAD wireframe & structural alignment axes
 * 3. Realizzazione: In-place material reveal of physical slab, markings & equipment
 * 4. Gestione: Active operational illumination, service path highlight & calm M4 transition
 */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createHeliportModel, type HeliportModel } from './createHeliportModel';
import { computeLifecycleState } from '../utils/projectLifecyclePose';

export interface ProjectLifecycleStageOptions {
  environmentUrl?: string;
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

export function createProjectLifecycleStage(
  container: HTMLElement,
  options: ProjectLifecycleStageOptions = {}
) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();

  // Initial pale studio background
  const bgPale = new THREE.Color('#F5F6F7');
  const bgNavy = new THREE.Color('#081C33');
  scene.background = bgPale.clone();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 150);
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

  // Soft grounding shadow receiver plane below the site
  const groundShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ color: 0x081c33, opacity: 0.28 })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = -0.62;
  groundShadow.receiveShadow = true;
  scene.add(groundShadow);

  // Key directional light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(12, 18, 10);
  keyLight.castShadow = !mobile;
  keyLight.shadow.mapSize.set(1536, 1536);
  Object.assign(keyLight.shadow.camera, {
    left: -10,
    right: 10,
    top: 10,
    bottom: -10,
    near: 0.5,
    far: 45,
  });
  keyLight.shadow.bias = -0.00015;
  keyLight.shadow.normalBias = 0.03;
  scene.add(keyLight);

  // Rim directional light
  const rimLight = new THREE.DirectionalLight(0x0b4584, 1.4);
  rimLight.position.set(-14, 8, -12);
  scene.add(rimLight);

  // Hemisphere ambient fill
  const hemiLight = new THREE.HemisphereLight(0xf5f6f7, 0x1e293b, 0.7);
  scene.add(hemiLight);

  // Reusable collection for clean stage resource disposal
  const stageGeometries = new Set<THREE.BufferGeometry>();
  const stageMaterials = new Set<THREE.Material>();

  function trackGeom<T extends THREE.BufferGeometry>(g: T): T {
    stageGeometries.add(g);
    return g;
  }
  function trackMat<T extends THREE.Material>(m: T): T {
    stageMaterials.add(m);
    return m;
  }

  // ========================================================
  // 1. ANALISI & PROGETTO VISUAL ELEMENTS (In place on footprint)
  // ========================================================
  const surveyGroup = new THREE.Group();
  surveyGroup.name = 'surveyGroup';
  scene.add(surveyGroup);

  // 1A. Topographical contour rings on the terrain
  const contourMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x0b4584,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
  );

  const contourRadii = [6.5, 8.2, 10.0, 12.0, 14.5];
  contourRadii.forEach((rad, idx) => {
    const points: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Slight organic terrain perturbation
      const r = rad + Math.sin(theta * 3 + idx) * 0.45 + Math.cos(theta * 2) * 0.3;
      points.push(new THREE.Vector3(Math.cos(theta) * r, -0.60 + idx * 0.04, Math.sin(theta) * r));
    }
    const lineGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(points));
    const contourLine = new THREE.Line(lineGeom, contourMat);
    surveyGroup.add(contourLine);
  });

  // 1B. Unbuilt platform footprint outline (8.6m x 8.6m)
  const footprintMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x0b4584,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })
  );

  const fpPoints = [
    new THREE.Vector3(-4.3, 0.01, -4.3),
    new THREE.Vector3(4.3, 0.01, -4.3),
    new THREE.Vector3(4.3, 0.01, 4.3),
    new THREE.Vector3(-4.3, 0.01, 4.3),
    new THREE.Vector3(-4.3, 0.01, -4.3),
  ];
  const fpGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(fpPoints));
  const footprintLine = new THREE.Line(fpGeom, footprintMat);
  surveyGroup.add(footprintLine);

  // 1C. Survey axes crosshairs
  const axisMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x0b4584,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
  );
  const axisPoints = [
    new THREE.Vector3(-7.5, 0.01, 0),
    new THREE.Vector3(7.5, 0.01, 0),
    new THREE.Vector3(0, 0.01, -7.5),
    new THREE.Vector3(0, 0.01, 7.5),
  ];
  const axisGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(axisPoints));
  const axisLine = new THREE.LineSegments(axisGeom, axisMat);
  surveyGroup.add(axisLine);

  // ========================================================
  // 2. PROGETTO BLUEPRINT CAD WIREFRAME
  // ========================================================
  const blueprintGroup = new THREE.Group();
  blueprintGroup.name = 'blueprintGroup';
  scene.add(blueprintGroup);

  const blueprintMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x0b4584,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );

  // Foundation perimeter CAD outline
  const fCadPoints = [
    new THREE.Vector3(-4.7, 0.02, -4.7),
    new THREE.Vector3(4.7, 0.02, -4.7),
    new THREE.Vector3(4.7, 0.02, 4.7),
    new THREE.Vector3(-4.7, 0.02, 4.7),
    new THREE.Vector3(-4.7, 0.02, -4.7),
  ];
  const fCadGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(fCadPoints));
  blueprintGroup.add(new THREE.Line(fCadGeom, blueprintMat));

  // TLOF circle CAD guide
  const circlePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(Math.cos(theta) * 2.75, 0.02, Math.sin(theta) * 2.75));
  }
  const circleGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(circlePoints));
  blueprintGroup.add(new THREE.Line(circleGeom, blueprintMat));

  // Structural sub-grid (1m increments)
  const gridPoints: THREE.Vector3[] = [];
  for (let x = -4; x <= 4; x += 1) {
    gridPoints.push(new THREE.Vector3(x, 0.015, -4.3), new THREE.Vector3(x, 0.015, 4.3));
  }
  for (let z = -4; z <= 4; z += 1) {
    gridPoints.push(new THREE.Vector3(-4.3, 0.015, z), new THREE.Vector3(4.3, 0.015, z));
  }
  const gridGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(gridPoints));
  blueprintGroup.add(new THREE.LineSegments(gridGeom, blueprintMat));

  // Approach alignment arrow wireframe (Red accent)
  const redArrowMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0xe31e24,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  const arrowPoints = [
    new THREE.Vector3(0, 0.02, -4.2),
    new THREE.Vector3(0, 0.02, -2.8),
    new THREE.Vector3(-0.4, 0.02, -3.2),
    new THREE.Vector3(0, 0.02, -2.8),
    new THREE.Vector3(0.4, 0.02, -3.2),
    new THREE.Vector3(0, 0.02, -2.8),
  ];
  const arrowLineGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(arrowPoints));
  blueprintGroup.add(new THREE.LineSegments(arrowLineGeom, redArrowMat));

  // ========================================================
  // 3. PHYSICAL HELIPORT MODEL (Reused from M2)
  // ========================================================
  const heliport: HeliportModel = createHeliportModel();
  scene.add(heliport.root);
  heliport.root.visible = false;

  // ========================================================
  // 4. GESTIONE OPERATIONAL SERVICE PATH
  // ========================================================
  const servicePathMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );

  const pathPoints = [
    new THREE.Vector3(5.2, 0.36, -5.2),
    new THREE.Vector3(5.2, 0.36, 5.2),
    new THREE.Vector3(-5.2, 0.36, 5.2),
  ];
  const pathGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(pathPoints));
  const servicePathLine = new THREE.Line(pathGeom, servicePathMat);
  scene.add(servicePathLine);

  let disposed = false;
  let isVisible = true;
  let environment: THREE.WebGLRenderTarget | null = null;
  let progress = 0;
  let frame = 0;

  function pose(p: number) {
    if (disposed) return;
    const state = computeLifecycleState(p);

    // 1. Survey & contour opacity
    contourMat.opacity = state.contourOpacity;
    footprintMat.opacity = state.contourOpacity * 0.9;
    axisMat.opacity = state.contourOpacity * 0.7;

    // 2. Blueprint CAD wireframe opacity
    blueprintMat.opacity = state.blueprintOpacity;
    redArrowMat.opacity = state.blueprintOpacity;

    // 3. Physical heliport reveal (in-place materialization via vertical extrusion/scale)
    if (state.physicalReveal <= 0.005) {
      heliport.root.visible = false;
    } else {
      heliport.root.visible = true;
      // In-place materialization: structural height rises from ground level (y=0) to full thickness
      const revealScaleY = Math.min(1.0, state.physicalReveal);
      heliport.root.scale.set(1.0, revealScaleY, 1.0);
      heliport.root.position.y = -(1.0 - revealScaleY) * 0.35;
    }

    // 4. Management operational highlight
    servicePathMat.opacity = state.managementHighlight * 0.85;

    // 5. Background transition for M4 darkening
    if (state.backgroundDarkening > 0.01) {
      scene.background = bgPale.clone().lerp(bgNavy, state.backgroundDarkening);
      keyLight.intensity = 2.0 * (1 - state.backgroundDarkening * 0.4);
      hemiLight.intensity = 0.7 * (1 - state.backgroundDarkening * 0.5);
    } else {
      scene.background = bgPale;
      keyLight.intensity = 2.0;
      hemiLight.intensity = 0.7;
    }

    // Camera placement
    camera.position.set(...state.cameraPosition);
    camera.lookAt(...state.cameraTarget);
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

  // Environment lighting setup (reuses HDR if available, gracefully falls back)
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envUrl = options.environmentUrl ?? (mobile
    ? '/environments/studio_small_09_1k.hdr'
    : '/environments/studio_small_09_2k.hdr');

  new HDRLoader().loadAsync(envUrl).then((texture) => {
    if (disposed) {
      texture.dispose();
      pmrem.dispose();
      return;
    }
    environment = pmrem.fromEquirectangular(texture);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.65;
    texture.dispose();
    pmrem.dispose();
    invalidate();
  }).catch((err) => {
    if (!disposed) {
      options.onError?.(err, false);
    }
    pmrem.dispose();
  });

  // Initial pose & framing
  pose(options.reducedMotion ? 0.85 : progress);
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
      scene.environment = null;
      environment?.dispose();
      pmrem.dispose();
      heliport.dispose();
      stageGeometries.forEach((g) => g.dispose());
      stageMaterials.forEach((m) => m.dispose());
      stageGeometries.clear();
      stageMaterials.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
