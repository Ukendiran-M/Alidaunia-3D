/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * One visibility-managed WebGL renderer for Manifesto M2–M6.
 *
 * The renderer's own canvas is never in the page. Each chapter has a static
 * orthographic composition camera and its own small scene; when a chapter's
 * pose or size changes, the renderer draws that scene once into the corner of
 * its canvas and copies the pixels into the chapter's 2D canvas, which sits
 * in normal document flow. Only visible (or handing-off) chapters are drawn,
 * nothing renders unless something changed, and there is no animation loop.
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MANIFESTO_ASSETS } from '../config/assets';
import type { ChapterId, SlotPoint } from '../utils/manifestoChoreography';
import { createManifestoAssetController, type ManifestoAssetController } from './manifestoAssetController';

/** Share of the slot kept free on each side when the object is fitted. */
export type Insets = { top: number; right: number; bottom: number; left: number };

type Look = {
  /** Shadow tint and strength on the section background. */
  shadow: [string, number];
  exposure: number;
  environment: number;
  key: number;
  fill: number;
  hemisphere: number;
  /** Progress samples whose silhouettes define the fixed frame: the whole motion envelope. */
  frameSamples: number[];
};

const LOOKS: Record<ChapterId, Look> = {
  M2: { shadow: ['#000000', 0.42], exposure: 1.0, environment: 0.55, key: 2.3, fill: 0.7, hemisphere: 0.9, frameSamples: [0, 0.15, 0.3, 0.45, 0.7, 1] },
  M3: { shadow: ['#081C33', 0.2], exposure: 1.0, environment: 0.7, key: 2.4, fill: 0.8, hemisphere: 1.0, frameSamples: [0, 0.3, 0.6, 1] },
  M4: { shadow: ['#000000', 0.4], exposure: 1.02, environment: 0.75, key: 2.6, fill: 1.1, hemisphere: 0.8, frameSamples: [0, 0.25, 0.5, 0.75, 1] },
  M5: { shadow: ['#081C33', 0.18], exposure: 1.0, environment: 0.7, key: 2.3, fill: 0.8, hemisphere: 1.0, frameSamples: [0, 0.1, 0.2, 0.3, 0.6, 1] },
  M6: { shadow: ['#081C33', 0.14], exposure: 1.0, environment: 0.75, key: 2.2, fill: 0.9, hemisphere: 1.0, frameSamples: [0, 0.25, 0.5, 0.75, 1] },
};

type Slot = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  insets: Insets;
};

type Chapter = {
  id: ChapterId;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  controller: ManifestoAssetController;
  gltf: GLTF;
  /** Union of the sampled silhouettes in camera space: [minU, maxU, minV, maxV]. */
  bounds: [number, number, number, number];
  /** Centre of the settled silhouette in camera space: the composition's axis. */
  centre: [number, number];
  anchors: Record<string, THREE.Vector3>;
  slot?: Slot;
  drawn: { progress: number; width: number; height: number } | null;
};

export type ManifestoRenderer = ReturnType<typeof createManifestoRenderer>;

export function createManifestoRenderer(options: { mobile: boolean; onContextLost?: () => void }) {
  const { mobile } = options;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral tone mapping keeps the brand red/blue and the paper white close to their source values.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setScissorTest(true);
  const gl = renderer.domElement;
  let bufferWidth = 0;
  let bufferHeight = 0;

  const chapters = new Map<ChapterId, Chapter>();
  const pending = new Map<ChapterId, Promise<void>>();
  const slots = new Map<ChapterId, Slot>();
  const loader = new GLTFLoader();
  let disposed = false;
  let environment: THREE.Texture | null = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentReady = new HDRLoader()
    .loadAsync(MANIFESTO_ASSETS.environment)
    .then((hdr) => {
      if (disposed) {
        hdr.dispose();
        return;
      }
      environment = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      for (const chapter of chapters.values()) applyEnvironment(chapter);
    })
    // The scenes have their own lights; the studio reflections are a refinement.
    .catch((error) => console.warn('[manifesto] studio lighting unavailable', error));

  const onContextLost = (event: Event) => {
    event.preventDefault();
    options.onContextLost?.();
  };
  gl.addEventListener('webglcontextlost', onContextLost);

  function applyEnvironment(chapter: Chapter) {
    chapter.scene.environment = environment;
    chapter.scene.environmentIntensity = LOOKS[chapter.id].environment;
    chapter.drawn = null;
  }

  function buildScene(id: ChapterId, gltf: GLTF): Chapter {
    const look = LOOKS[id];
    const asset = MANIFESTO_ASSETS.chapters[id];
    const scene = new THREE.Scene();
    const controller = createManifestoAssetController(gltf, id);
    scene.add(controller.root);
    controller.root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // morphs and draw ranges change the true bounds
    });

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.fromArray(asset.view.position);
    camera.lookAt(new THREE.Vector3().fromArray(asset.view.target));
    camera.updateMatrixWorld(true);

    // Settled world bounds: ground, shadow camera and light distances follow the object.
    controller.setProgress(1);
    const world = new THREE.Box3().setFromObject(controller.root, true);
    const size = world.getSize(new THREE.Vector3());
    const centre = world.getCenter(new THREE.Vector3());
    const reach = Math.max(size.x, size.y, size.z);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(reach * 6, reach * 6), new THREE.ShadowMaterial({ color: look.shadow[0], opacity: look.shadow[1] }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(centre.x, world.min.y - 0.004, centre.z);
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.HemisphereLight('#EEF4FF', '#3A4B5F', look.hemisphere));
    const key = new THREE.DirectionalLight('#FFF7EC', look.key);
    key.position.copy(centre).add(new THREE.Vector3(0.45, 1, 0.62).normalize().multiplyScalar(reach * 2.2));
    key.target.position.copy(centre);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
    const extent = reach * 0.85;
    Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 0.1, far: reach * 5 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight('#B9D3F5', look.fill);
    fill.position.copy(centre).add(new THREE.Vector3(-0.8, 0.5, -0.4).normalize().multiplyScalar(reach * 2));
    scene.add(fill);

    const chapter: Chapter = {
      id,
      scene,
      camera,
      controller,
      gltf,
      bounds: viewBounds(controller, camera, look.frameSamples),
      centre: settledCentre(controller, camera),
      anchors: findAnchors(id, controller, camera),
      drawn: null,
    };
    controller.setProgress(0);
    applyEnvironment(chapter);
    return chapter;
  }

  /** Camera-space silhouette of the object over the sampled poses (vertex-accurate for morphs). */
  function viewBounds(controller: ManifestoAssetController, camera: THREE.OrthographicCamera, samples: number[]): Chapter['bounds'] {
    const inverse = camera.matrixWorldInverse;
    const v = new THREE.Vector3();
    const box = new THREE.Box3();
    const corner = new THREE.Vector3();
    for (const p of samples) {
      controller.setProgress(p);
      controller.root.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || !mesh.visible) return;
        const geometry = mesh.geometry;
        if (mesh.morphTargetInfluences?.length) {
          const count = geometry.attributes.position.count;
          for (let i = 0; i < count; i++) {
            mesh.getVertexPosition(i, v);
            box.expandByPoint(v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
          }
          return;
        }
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        const b = geometry.boundingBox!;
        for (let i = 0; i < 8; i++) {
          corner.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
          box.expandByPoint(corner.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
        }
      });
    }
    return [box.min.x, box.max.x, box.min.y, box.max.y];
  }

  function settledCentre(controller: ManifestoAssetController, camera: THREE.OrthographicCamera): Chapter['centre'] {
    const [u0, u1, v0, v1] = viewBounds(controller, camera, [1]);
    return [(u0 + u1) / 2, (v0 + v1) / 2];
  }

  /** World points that boundary cues and labels attach to, taken from the settled object. */
  function findAnchors(id: ChapterId, controller: ManifestoAssetController, camera: THREE.OrthographicCamera) {
    controller.setProgress(1);
    const anchors: Record<string, THREE.Vector3> = {};
    const root = controller.root;
    const lowestOnScreen = (name: string) => {
      const mesh = root.getObjectByName(name) as THREE.Mesh | undefined;
      if (!mesh?.isMesh) return null;
      const v = new THREE.Vector3();
      let best: THREE.Vector3 | null = null;
      let bestY = Infinity;
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
        const y = v.clone().project(camera).y;
        if (y < bestY) {
          bestY = y;
          best = v.clone();
        }
      }
      return best;
    };
    if (id === 'M2') {
      // The sheet's nearest corner, where the datum line leaves the drawing.
      const corner = lowestOnScreen('M2_paper_sheet');
      if (corner) anchors.datum = corner;
    } else if (id === 'M3') {
      const lens = lowestOnScreen('M3_light_lenses_Lens_Green');
      if (lens) anchors.light = lens;
    } else if (id === 'M4') {
      const tail = root.getObjectByName('M4_cloth_band_5') as THREE.Mesh;
      const ring = new THREE.Box3().setFromObject(root.getObjectByName('M4_inlet_ring')!, true).getCenter(new THREE.Vector3());
      const v = new THREE.Vector3();
      const tip = new THREE.Vector3();
      let far = -Infinity;
      let count = 0;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < tail.geometry.attributes.position.count; i++) {
        points.push(tail.getVertexPosition(i, v).applyMatrix4(tail.matrixWorld).clone());
      }
      for (const point of points) far = Math.max(far, point.distanceTo(ring));
      for (const point of points) {
        if (point.distanceTo(ring) > far - 0.06) {
          tip.add(point);
          count++;
        }
      }
      anchors.tail = tip.divideScalar(Math.max(1, count));
      anchors.inlet = ring;
    } else if (id === 'M5') {
      root.traverse((node) => {
        const data = node.userData as { networkId?: string; worldFinalPosition?: number[] };
        if (data.networkId && data.worldFinalPosition) anchors[data.networkId] = new THREE.Vector3().fromArray(data.worldFinalPosition);
      });
    } else if (id === 'M6') {
      const mark = new THREE.Box3().setFromObject(root.getObjectByName('M6_signature')!, true);
      anchors.markMin = mark.min.clone().setZ(mark.max.z);
      anchors.markMax = mark.max.clone();
      anchors.markCentre = mark.getCenter(new THREE.Vector3()).setZ(mark.max.z);
    }
    return anchors;
  }

  function frame(chapter: Chapter) {
    const slot = chapter.slot;
    if (!slot || !slot.width || !slot.height) return;
    const [u0, u1, v0, v1] = chapter.bounds;
    const [su] = chapter.centre;
    const { top, right, bottom, left } = slot.insets;
    const free = { w: Math.max(0.05, 1 - left - right), h: Math.max(0.05, 1 - top - bottom) };
    const aspect = slot.width / slot.height;
    // The settled object sits on the slot's vertical axis, with room on both sides for the
    // whole motion envelope; vertically the envelope itself is fitted. Nothing is refitted
    // while the object moves.
    const halfU = Math.max(su - u0, u1 - su);
    const height = Math.max((v1 - v0) / free.h, (2 * halfU) / (aspect * free.w));
    const width = height * aspect;
    // Place the composition centre at the centre of the free region.
    const cu = su - width * (left + free.w / 2 - 0.5);
    const cv = (v0 + v1) / 2 + height * (top + free.h / 2 - 0.5);
    const camera = chapter.camera;
    camera.left = cu - width / 2;
    camera.right = cu + width / 2;
    camera.top = cv + height / 2;
    camera.bottom = cv - height / 2;
    camera.updateProjectionMatrix();
    chapter.drawn = null;
  }

  function ensureBuffer(width: number, height: number) {
    if (width <= bufferWidth && height <= bufferHeight) return;
    bufferWidth = Math.max(bufferWidth, width);
    bufferHeight = Math.max(bufferHeight, height);
    renderer.setSize(bufferWidth, bufferHeight, false);
  }

  return {
    pixelRatio,
    environmentReady,

    /** Loads a chapter once; later calls share the same promise. */
    load(id: ChapterId) {
      const existing = pending.get(id);
      if (existing) return existing;
      const promise = loader.loadAsync(MANIFESTO_ASSETS.chapters[id].model).then(async (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        // The studio environment changes shader variants; wait for it so each scene compiles once.
        await environmentReady;
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const chapter = buildScene(id, gltf);
        // Compile shaders in parallel before the first draw, so revealing an object never stalls a frame.
        await renderer.compileAsync(chapter.scene, chapter.camera).catch(() => undefined);
        if (disposed) {
          chapter.controller.dispose();
          disposeObject(chapter.scene);
          return;
        }
        const slot = slots.get(id);
        if (slot) chapter.slot = slot;
        chapters.set(id, chapter);
        frame(chapter);
      });
      pending.set(id, promise);
      return promise;
    },

    isReady(id: ChapterId) {
      return chapters.has(id);
    },

    /** Connects a chapter to the 2D canvas it is shown in, at its CSS size. */
    setSlot(id: ChapterId, canvas: HTMLCanvasElement, width: number, height: number, insets: Insets) {
      let slot = slots.get(id);
      if (!slot || slot.canvas !== canvas) {
        const context = canvas.getContext('2d');
        if (!context) return;
        slot = { canvas, context, width: 0, height: 0, insets };
        slots.set(id, slot);
      }
      slot.width = width;
      slot.height = height;
      slot.insets = insets;
      const pw = Math.max(1, Math.round(width * pixelRatio));
      const ph = Math.max(1, Math.round(height * pixelRatio));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const chapter = chapters.get(id);
      if (chapter) {
        chapter.slot = slot;
        frame(chapter);
      }
    },

    /** Draws a chapter at `progress` if its pose or size changed since the last draw. */
    render(id: ChapterId, progress: number, reducedMotion: boolean) {
      const chapter = chapters.get(id);
      const slot = chapter?.slot;
      if (disposed || !chapter || !slot || !slot.width || !slot.height) return false;
      chapter.controller.setProgress(progress, reducedMotion);
      const p = chapter.controller.progress;
      const { canvas, context } = slot;
      const drawn = chapter.drawn;
      if (drawn && drawn.progress === p && drawn.width === canvas.width && drawn.height === canvas.height) return false;
      const w = canvas.width;
      const h = canvas.height;
      ensureBuffer(w, h);
      renderer.toneMappingExposure = LOOKS[id].exposure;
      renderer.setViewport(0, 0, w, h);
      renderer.setScissor(0, 0, w, h);
      renderer.render(chapter.scene, chapter.camera);
      context.clearRect(0, 0, w, h);
      // The viewport is anchored bottom-left in GL; in canvas coordinates that is the bottom rows.
      context.drawImage(gl, 0, bufferHeight - h, w, h, 0, 0, w, h);
      chapter.drawn = { progress: p, width: w, height: h };
      return true;
    },

    /** Projects a named anchor of a loaded chapter into its slot (CSS px). */
    project(id: ChapterId, anchor: string): SlotPoint | null {
      const chapter = chapters.get(id);
      const point = chapter?.anchors[anchor];
      const slot = chapter?.slot;
      if (!chapter || !point || !slot) return null;
      const v = point.clone().project(chapter.camera);
      return { x: ((v.x + 1) / 2) * slot.width, y: ((1 - v.y) / 2) * slot.height };
    },

    /** World scale of a named node (used to reveal M5 labels as their nodes rise). */
    nodeScale(id: ChapterId, name: string) {
      const node = chapters.get(id)?.controller.root.getObjectByName(name);
      return node ? node.scale.x : 0;
    },

    info() {
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, buffer: [bufferWidth, bufferHeight], pixelRatio, loaded: [...chapters.keys()] };
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      gl.removeEventListener('webglcontextlost', onContextLost);
      for (const chapter of chapters.values()) {
        chapter.controller.dispose();
        disposeObject(chapter.scene);
      }
      chapters.clear();
      slots.clear();
      environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/** Releases geometry, materials and maps owned by this route's own GLB instances. */
function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
  });
  for (const texture of textures) texture.dispose();
}
