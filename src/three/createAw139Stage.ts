import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { computeAssemblyState, type GroupTiming } from '../utils/helicopterPose';

export type Aw139StageOptions = {
  modelUrl?: string;
  environmentUrl?: string;
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
};

type Part = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  offset: THREE.Vector3;
  order: number;
};

/** A rendering stage only. The existing React/GSAP hero owns scrolling and HTML. */
export function createAw139Stage(container: HTMLElement, options: Aw139StageOptions = {}) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#081C33');
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 300);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.ShadowMaterial({ color: '#000000', opacity: 0.22 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.025;
  ground.receiveShadow = true;
  scene.add(ground);

  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(8, 14, 9);
  key.castShadow = !mobile;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 0.1, far: 50 });
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#8BBEFF', 1.6);
  rim.position.set(-10, 6, -12);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#C9DBF0', '#101A25', 0.55));

  let disposed = false;
  let model: THREE.Group | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let progress = 0;
  let frame = 0;
  const parts: Part[] = [];
  const groupTimings: GroupTiming[] = [];
  const rootRest = new THREE.Vector3();
  const framingBox = new THREE.Box3();
  const frameSamples: number[] = [];
  const viewDirection = new THREE.Vector3(1, 0.35, 1.3).normalize();
  const viewRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewDirection).normalize();
  const viewUp = new THREE.Vector3().crossVectors(viewDirection, viewRight).normalize();
  const rotation = new THREE.Quaternion();
  const mainAxis = new THREE.Vector3(0, 1, 0);
  const tailAxis = new THREE.Vector3(0, 0, 1);
  const explosionScale = mobile ? 0.62 : 1;
  function pose(p: number) {
    if (!model) return;
    const state = computeAssemblyState(p, groupTimings);
    for (const part of parts) {
      const separation = state.groupFactors[part.object.name] ?? 0;
      part.object.position.copy(part.position).addScaledVector(part.offset, separation * explosionScale);
      part.object.quaternion.copy(part.quaternion);
      if (part.object.name === 'mainRotor') {
        rotation.setFromAxisAngle(mainAxis, state.rotorAngle);
        part.object.quaternion.multiply(rotation);
      } else if (part.object.name === 'tailRotor') {
        rotation.setFromAxisAngle(tailAxis, state.rotorAngle * 1.5);
        part.object.quaternion.multiply(rotation);
      }
    }
    model.position.copy(rootRest).add(new THREE.Vector3(...state.liftPosition));
    model.position.y -= state.explosionLift * (1 - explosionScale);
    model.rotation.set(...state.bankRotation);
    model.updateMatrixWorld(true);
  }

  function render() {
    frame = 0;
    if (!disposed) renderer.render(scene, camera);
  }
  function invalidate() {
    if (!disposed && !frame) frame = requestAnimationFrame(render);
  }
  function fitCamera(width: number, height: number) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (framingBox.isEmpty()) return;
    const target = framingBox.getCenter(new THREE.Vector3());
    target.y += 0.15;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const targetR = target.dot(viewRight);
    const targetU = target.dot(viewUp);
    const targetD = target.dot(viewDirection);
    let distance = 1;
    for (let i = 0; i < frameSamples.length; i += 3) {
      const depth = frameSamples[i + 2] - targetD;
      distance = Math.max(distance, depth + Math.abs(frameSamples[i] - targetR) / tanH, depth + Math.abs(frameSamples[i + 1] - targetU) / tanV);
    }
    camera.position.copy(target).addScaledVector(viewDirection, distance * 1.10);
    camera.lookAt(target);
  }
  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    fitCamera(width, height);
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function disposeObject(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    object.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m);
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const modelRequest = loader.loadAsync(options.modelUrl ?? '/models/aw139-assembly.glb');
  const hdrRequest = new HDRLoader().loadAsync(options.environmentUrl ?? (mobile
    ? '/environments/studio_small_09_1k.hdr'
    : '/environments/studio_small_09_2k.hdr'));

  Promise.allSettled([modelRequest, hdrRequest]).then(([m, h]) => {
    if (disposed) {
      if (m.status === 'fulfilled') disposeObject(m.value.scene);
      if (h.status === 'fulfilled') h.value.dispose();
      return;
    }
    if (m.status === 'rejected') {
      if (h.status === 'fulfilled') h.value.dispose();
      options.onError?.(m.reason, true);
      pmrem.dispose();
      return;
    }
    if (h.status === 'fulfilled') {
      environment = pmrem.fromEquirectangular(h.value);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.5;
      h.value.dispose();
    } else {
      // The aircraft can still render under the explicit lights; surface the asset failure to the caller.
      options.onError?.(h.reason, false);
    }
    pmrem.dispose();
    model = m.value.scene;
    rootRest.copy(model.position);
    model.traverse((o) => {
      const offset = o.userData.assemblyOffset;
      if (Array.isArray(offset) && offset.length === 3) {
        parts.push({ object: o, position: o.position.clone(), quaternion: o.quaternion.clone(), offset: new THREE.Vector3(...offset), order: Number(o.userData.assemblyOrder ?? 0) });
        groupTimings.push({ name: o.name, order: Number(o.userData.assemblyOrder ?? 0) });
      }
      if (o instanceof THREE.Mesh) {
        o.castShadow = !mobile;
        o.receiveShadow = !mobile;
      }
    });
    scene.add(model);
    for (const p of options.reducedMotion ? [0] : [0, 0.46]) {
      pose(p);
      framingBox.union(new THREE.Box3().setFromObject(model));
      const world = new THREE.Vector3();
      model.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const position = o.geometry.getAttribute('position');
        for (let i = 0; i < position.count; i++) {
          world.fromBufferAttribute(position, i).applyMatrix4(o.matrixWorld);
          frameSamples.push(world.dot(viewRight), world.dot(viewUp), world.dot(viewDirection));
        }
      });
    }
    pose(progress);
    resize();
    options.onReady?.();
    invalidate();
  }).catch((error: unknown) => {
    if (!disposed) options.onError?.(error, true);
  });

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
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      scene.environment = null;
      environment?.dispose();
      pmrem.dispose();
      disposeObject(scene);
      parts.length = 0;
      groupTimings.length = 0;
      frameSamples.length = 0;
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
