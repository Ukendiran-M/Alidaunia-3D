/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The page-two world: one renderer, one camera rig and one connected aviation
 * base (hangar, parked AW139, apron edge, planning studio, briefing room).
 * The React page owns scrolling and HTML; it only tells the world the
 * scroll-derived journey position. Rendering is on demand.
 */

import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { HERO_ASSETS } from '../config/assets';
import { sampleAtmosphere, sampleCamera, sampleCameraMobile, stepJourney, sunDirection } from '../utils/visionJourney';
import { loadBrandArt } from './artwork';
import { createMaterialLibrary, type MaterialFamily } from './materials';
import type { Zone, ZoneContext } from './geometry';
import { buildAircraft } from './zones/aircraft';
import { buildAnnex } from './zones/annex';
import { buildApron } from './zones/apron';
import { buildBriefing } from './zones/briefing';
import { buildHangar } from './zones/hangar';
import { buildStudio } from './zones/studio';

export interface VisionWorldOptions {
  mobile: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

const BUILDERS = [buildHangar, buildApron, buildAnnex, buildStudio, buildBriefing, buildAircraft];
/** Supplied maps actually used: brushed/anodised metal and the fine ceramic micro-relief for floors and paving. */
const FAMILIES: MaterialFamily[] = ['metal', 'ceramic'];

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
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.06, 900);
  const fog = new THREE.Fog('#e6ebee', 120, 620);
  scene.fog = fog;
  const sampleCameraFor = mobile ? sampleCameraMobile : sampleCamera;

  const skyUniforms = {
    top: { value: new THREE.Color() },
    horizon: { value: new THREE.Color() },
    ground: { value: new THREE.Color('#8f957f') },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(800, 32, 16),
    new THREE.ShaderMaterial({ uniforms: skyUniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false }),
  );
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight('#e4edf6', '#5f5a52', 0.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3e2', 3);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 260 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);

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

  const materials = createMaterialLibrary(renderer, mobile);
  const ctx: ZoneContext = { scene, materials, mobile, shadows: !mobile, brand: loadBrandArt(), alive: () => !disposed };
  const zones: Zone[] = BUILDERS.map((build) => build(ctx));
  for (const zone of zones) {
    scene.add(zone.group);
    zone.lights.forEach((light) => scene.add(light));
  }

  const forward = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const sunDir = new THREE.Vector3(...sunDirection());

  function frameCamera() {
    const aspect = width / height;
    camera.aspect = aspect;
    // One lens for the whole journey; portrait screens open the vertical angle to keep the horizontal field.
    camera.fov = aspect >= 1.2 ? 44 : THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(30)) / aspect)), 44, 70);
  }

  function apply(s: number) {
    const pose = sampleCameraFor(s);
    camera.position.set(...pose.pos);
    camera.lookAt(...pose.target);
    const shift = width / height > 1.25 && width >= 900 ? pose.shift : 0;
    camera.setViewOffset(width, height, -shift * width, 0, width, height);
    for (const zone of zones) zone.update(s, camera);

    const air = sampleAtmosphere(s);
    skyUniforms.top.value.setRGB(...air.skyTop, THREE.SRGBColorSpace);
    skyUniforms.horizon.value.setRGB(...air.skyHorizon, THREE.SRGBColorSpace);
    fog.color.copy(skyUniforms.horizon.value);
    hemi.intensity = air.hemi;
    renderer.toneMappingExposure = air.exposure;
    scene.environmentIntensity = air.envIntensity;
    sky.position.copy(camera.position);

    // The sun's shadow frustum follows the region in front of the camera.
    camera.getWorldDirection(forward);
    focus.copy(camera.position).addScaledVector(forward, 14);
    focus.y = 0;
    sun.intensity = air.sun;
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sunDir, 120);
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
    // Very large viewports (ultra-wide, 4K at 1×) keep a bounded drawing buffer.
    const cap = Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5);
    renderer.setPixelRatio(Math.min(cap, Math.max(0.8, Math.sqrt(6e6 / (width * height)))));
    renderer.setSize(width, height, false);
    frameCamera();
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

  // Reflections: the Manifesto's studio HDR. PMREM blurs it for these
  // materials, so the 1K derivative is sufficient at every size.
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

  const essentials = [
    materials.load(FAMILIES).catch((e: unknown) => options.onError?.(e, false)),
    hdrRequest,
    // The aircraft is essential: without it the route falls back to its static compositions.
    ...zones.map((z) => z.ready).filter((p): p is Promise<void> => !!p),
  ];
  Promise.all(essentials)
    .then(() => (disposed ? undefined : renderer.compileAsync(scene, camera)))
    .then(() => {
      if (disposed) return;
      ready = true;
      if (Number.isNaN(current)) current = target;
      render(performance.now());
      options.onReady?.();
    })
    .catch((error: unknown) => {
      if (!disposed) options.onError?.(error, true);
    });

  if (import.meta.env.DEV) {
    (window as unknown as { __visionWorld?: unknown }).__visionWorld = {
      info: () => ({ ...renderer.info.render, programs: renderer.info.programs?.length, journey: current, target }),
      canvas: () => renderer.domElement,
      /** Development only: render a still pose at a fixed size and return it as WebP (fallback posters). */
      capture: (s: number, w: number, h: number, quality = 0.8) => {
        const saved = [width, height];
        width = w;
        height = h;
        renderer.setPixelRatio(1);
        renderer.setSize(w, h, false);
        frameCamera();
        apply(s);
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL('image/webp', quality);
        [width, height] = saved;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
        resize();
        return url;
      },
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
      // Everything in this scene was created or loaded by this route, including its own AW139 instance.
      const geometries = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            mats.add(m);
            for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
          }
        }
        if ((o as THREE.Light).isLight) (o as THREE.Light).dispose();
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      materials.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (import.meta.env.DEV) delete (window as unknown as { __visionWorld?: unknown }).__visionWorld;
    },
  };
}

export type VisionWorld = ReturnType<typeof createVisionWorld>;
