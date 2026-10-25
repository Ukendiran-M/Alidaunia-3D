/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The page-two world: one renderer, one camera rig, six connected
 * environments. The React page owns scrolling and HTML; it only tells the
 * world the scroll-derived journey position. Rendering is on demand.
 */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { HERO_ASSETS } from '../config/assets';
import {
  sampleAtmosphere,
  sampleCamera,
  stepJourney,
  sunDirection,
  zoneVisible,
} from '../utils/visionJourney';
import { createMaterialLibrary, type MaterialFamily } from './materials';
import type { Zone, ZoneContext } from './geometry';
import { buildHangar } from './zones/hangar';
import { buildGallery } from './zones/gallery';
import { buildGlazing } from './zones/glazing';
import { buildVault } from './zones/vault';
import { buildCanopy } from './zones/canopy';
import { buildHorizon } from './zones/horizon';

export interface VisionWorldOptions {
  mobile: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

const BUILDERS = [buildHangar, buildGallery, buildGlazing, buildVault, buildCanopy, buildHorizon];
/** Progressive preload: the opening pair first, then the remaining rooms in journey order. */
const FIRST_FAMILIES: MaterialFamily[] = ['metal', 'concrete'];
const LATER_FAMILIES: MaterialFamily[] = ['glass', 'carbon', 'fabric', 'ceramic'];

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAGMENT = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 ground;
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 colour = h > 0.0
    ? mix(horizon, top, pow(smoothstep(0.0, 0.55, h), 0.75))
    : mix(horizon, ground, smoothstep(0.0, -0.06, h));
  gl_FragColor = vec4(colour, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createVisionWorld(host: HTMLElement, options: VisionWorldOptions) {
  const { mobile } = options;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.transmissionResolutionScale = mobile ? 0.5 : 0.75;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.08, 700);
  const fog = new THREE.Fog('#c4c8cc', 70, 360);
  scene.fog = fog;

  const skyUniforms = {
    top: { value: new THREE.Color() },
    horizon: { value: new THREE.Color() },
    ground: { value: new THREE.Color('#8d8a84') },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(640, 32, 16),
    new THREE.ShaderMaterial({ uniforms: skyUniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false }),
  );
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ color: '#9c9890', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(36, -0.03, -120);
  ground.receiveShadow = !mobile;
  scene.add(ground);

  const hemi = new THREE.HemisphereLight('#dfe8f2', '#3a3630', 0.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e6', 2);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 220 });
  sun.shadow.bias = -0.0009;
  sun.shadow.normalBias = 0.09;
  scene.add(sun, sun.target);

  const materials = createMaterialLibrary(renderer, mobile);
  const ctx: ZoneContext = { scene, materials, mobile, shadows: !mobile };
  const zones: Zone[] = BUILDERS.map((build) => build(ctx));
  for (const zone of zones) {
    scene.add(zone.group);
    zone.lights.forEach((light) => scene.add(light));
  }

  let disposed = false;
  let ready = false;
  let active = true;
  let raf = 0;
  let last = 0;
  let current = Number.NaN;
  let target = 0;
  let width = 1;
  let height = 1;
  let environment: THREE.WebGLRenderTarget | null = null;
  const forward = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const sunDir = new THREE.Vector3();

  function frameCamera() {
    const aspect = width / height;
    camera.aspect = aspect;
    // Common lens for the whole journey; portrait screens open the vertical angle to keep the horizontal field.
    camera.fov = aspect >= 1.2 ? 44 : THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(29)) / aspect)), 44, 68);
  }

  function apply(s: number) {
    const pose = sampleCamera(s);
    camera.position.set(...pose.pos);
    camera.lookAt(...pose.target);
    const shift = width / height > 1.25 && width >= 900 ? pose.shift : 0;
    camera.setViewOffset(width, height, -shift * width, 0, width, height);

    zones.forEach((zone, i) => {
      const visible = zoneVisible(i, s);
      zone.group.visible = visible;
      if (visible) zone.update(s, camera);
      else zone.lights.forEach((light) => (light.intensity = 0));
    });

    const air = sampleAtmosphere(s);
    skyUniforms.top.value.setRGB(...air.skyTop, THREE.SRGBColorSpace);
    skyUniforms.horizon.value.setRGB(...air.skyHorizon, THREE.SRGBColorSpace);
    fog.color.copy(skyUniforms.horizon.value);
    hemi.color.copy(skyUniforms.top.value).lerp(new THREE.Color(1, 1, 1), 0.55);
    hemi.intensity = air.hemi;
    renderer.toneMappingExposure = air.exposure;
    scene.environmentIntensity = air.envIntensity;
    sky.position.copy(camera.position);

    camera.getWorldDirection(forward);
    focus.copy(camera.position).addScaledVector(forward, 16);
    focus.y = 0;
    sunDir.set(...sunDirection(s));
    sun.intensity = air.sun;
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sunDir, 110);
    sun.target.updateMatrixWorld();
  }

  function render(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    current = Number.isNaN(current) ? target : stepJourney(current, target, Math.min(dt, 0.1));
    apply(current);
    renderer.render(scene, camera);
    if (current !== target) schedule();
    else last = 0;
  }

  function schedule() {
    if (!raf && ready && active && !disposed && !document.hidden) raf = requestAnimationFrame(render);
  }

  function resize() {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    frameCamera();
    if (!Number.isNaN(current)) apply(current);
    schedule();
    if (ready && !raf && !Number.isNaN(current)) render(performance.now());
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) schedule();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  });
  visibilityObserver.observe(host);
  const onVisibility = () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else schedule();
  };
  document.addEventListener('visibilitychange', onVisibility);
  resize();

  // Environment reflections: the Manifesto's studio HDR. PMREM blurs it for these
  // architectural materials, so the 1K derivative is sufficient at every size.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const hdrRequest = new HDRLoader()
    .loadAsync(HERO_ASSETS.mobileEnvironment)
    .then((hdr) => {
      if (disposed) {
        hdr.dispose();
        return;
      }
      environment = pmrem.fromEquirectangular(hdr);
      scene.environment = environment.texture;
      scene.environmentRotation.set(0, Math.PI * 0.35, 0);
      hdr.dispose();
    })
    .catch((error: unknown) => options.onError?.(error, false))
    .finally(() => pmrem.dispose());

  async function compileAll() {
    const visibility = zones.map((z) => z.group.visible);
    zones.forEach((z) => (z.group.visible = true));
    try {
      await renderer.compileAsync(scene, camera);
    } finally {
      zones.forEach((z, i) => (z.group.visible = visibility[i]));
    }
  }

  Promise.all([materials.load(FIRST_FAMILIES).catch((e: unknown) => options.onError?.(e, false)), hdrRequest])
    .then(() => (disposed ? undefined : compileAll()))
    .then(() => {
      if (disposed) return;
      ready = true;
      if (Number.isNaN(current)) current = target;
      render(performance.now());
      options.onReady?.();
      return materials.load(LATER_FAMILIES);
    })
    .then(() => {
      if (disposed) return;
      apply(current);
      if (!raf) render(performance.now());
    })
    .catch((error: unknown) => {
      if (!disposed) options.onError?.(error, false);
    });

  if (import.meta.env.DEV) {
    (window as unknown as { __visionWorld?: unknown }).__visionWorld = {
      info: () => ({ ...renderer.info.render, programs: renderer.info.programs?.length, journey: current, target }),
    };
  }

  return {
    /** Set the scroll-derived journey position. `immediate` skips smoothing (reduced motion, re-entry). */
    setJourney(s: number, immediate = false) {
      if (disposed) return;
      target = s;
      if (immediate || Number.isNaN(current)) current = s;
      schedule();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.environment = null;
      environment?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => mats.add(m));
        if ((o as THREE.Light).isLight) (o as THREE.Light).dispose();
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      materials.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (import.meta.env.DEV) delete (window as unknown as { __visionWorld?: unknown }).__visionWorld;
    },
  };
}

export type VisionWorld = ReturnType<typeof createVisionWorld>;
