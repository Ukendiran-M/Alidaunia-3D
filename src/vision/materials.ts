/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Material maps for the Vision journey: loading, cache and ownership.
 *
 * Every texture slot exists from the first frame with a 1×1 neutral
 * placeholder, so shader programs are compiled once with their final defines.
 * When an image arrives it replaces the placeholder in the shared texture
 * Source; nothing recompiles and nothing pops structurally.
 */

import * as THREE from 'three';

export type MaterialFamily = 'metal' | 'concrete' | 'carbon' | 'glass' | 'ceramic' | 'fabric';
type Slot = 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap';

const ROOT = '/materials/vision-journey';

/** Exact files from Alidaunia_Claude_Vision_Kit/material_manifest.json. */
const FILES: Record<MaterialFamily, Partial<Record<Slot, { desktop: string; mobile?: string }>>> = {
  metal: {
    map: { desktop: 'metal/basecolor_2k.webp', mobile: 'metal/basecolor_1k.webp' },
    normalMap: { desktop: 'metal/normal_gl_1k.png' },
    roughnessMap: { desktop: 'metal/roughness_1k.png' },
    metalnessMap: { desktop: 'metal/metalness_1k.png' },
  },
  concrete: {
    map: { desktop: 'concrete/basecolor_2k.webp', mobile: 'concrete/basecolor_1k.webp' },
    normalMap: { desktop: 'concrete/normal_gl_1k.png' },
    roughnessMap: { desktop: 'concrete/roughness_1k.png' },
  },
  carbon: {
    map: { desktop: 'carbon/basecolor_1k.webp' },
    normalMap: { desktop: 'carbon/normal_gl_1k.png' },
    roughnessMap: { desktop: 'carbon/roughness_1k.png' },
  },
  glass: {
    normalMap: { desktop: 'glass/normal_gl_1k.png' },
    roughnessMap: { desktop: 'glass/roughness_1k.png' },
  },
  ceramic: {
    normalMap: { desktop: 'ceramic/normal_gl_1k.png' },
    roughnessMap: { desktop: 'ceramic/roughness_1k.png' },
  },
  fabric: {
    map: { desktop: 'fabric/basecolor_2k.webp', mobile: 'fabric/basecolor_1k.webp' },
    normalMap: { desktop: 'fabric/normal_gl_1k.png' },
    roughnessMap: { desktop: 'fabric/roughness_1k.png' },
  },
};

const PLACEHOLDER: Record<Slot, string> = {
  map: '#ffffff',
  normalMap: '#8080ff',
  roughnessMap: '#ffffff',
  metalnessMap: '#ffffff',
};

function solidCanvas(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return canvas;
}

export type MapSet = Partial<Record<Slot, THREE.Texture>>;

export function createMaterialLibrary(renderer: THREE.WebGLRenderer, mobile: boolean) {
  const anisotropy = Math.min(mobile ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
  const bases = new Map<string, THREE.Texture>();
  const users = new Map<string, THREE.Texture[]>();
  const owned = new Set<THREE.Texture>();
  const loaded = new Set<MaterialFamily>();
  const loader = new THREE.ImageLoader();
  let disposed = false;

  function base(family: MaterialFamily, slot: Slot) {
    const key = `${family}.${slot}`;
    let texture = bases.get(key);
    if (!texture) {
      texture = new THREE.Texture(solidCanvas(PLACEHOLDER[slot]));
      texture.colorSpace = slot === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
      bases.set(key, texture);
      users.set(key, [texture]);
      owned.add(texture);
    }
    return texture;
  }

  /**
   * Map set for one material. Geometry UVs are authored in metres, so `tile`
   * is the physical size one texture repeat covers.
   */
  function maps(family: MaterialFamily, tile: number, rotation = 0): MapSet {
    const set: MapSet = {};
    for (const slot of Object.keys(FILES[family]) as Slot[]) {
      const texture = base(family, slot).clone();
      texture.repeat.set(1 / tile, 1 / tile);
      texture.rotation = rotation;
      texture.needsUpdate = true;
      users.get(`${family}.${slot}`)!.push(texture);
      owned.add(texture);
      set[slot] = texture;
    }
    return set;
  }

  /** Register a texture generated in code (e.g. glazed tile layout) for disposal. */
  function adopt<T extends THREE.Texture>(texture: T) {
    texture.anisotropy = anisotropy;
    owned.add(texture);
    return texture;
  }

  async function load(families: MaterialFamily[]) {
    const jobs: Promise<void>[] = [];
    for (const family of families) {
      if (loaded.has(family)) continue;
      loaded.add(family);
      for (const [slot, file] of Object.entries(FILES[family]) as [Slot, { desktop: string; mobile?: string }][]) {
        const url = `${ROOT}/${mobile && file.mobile ? file.mobile : file.desktop}`;
        jobs.push(
          loader.loadAsync(url).then((image) => {
            if (disposed) return;
            const key = `${family}.${slot}`;
            base(family, slot).image = image;
            for (const texture of users.get(key) ?? []) texture.needsUpdate = true;
          }),
        );
      }
    }
    const results = await Promise.allSettled(jobs);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed && failed.status === 'rejected') throw failed.reason;
  }

  return {
    maps,
    adopt,
    load,
    dispose() {
      disposed = true;
      owned.forEach((t) => t.dispose());
      owned.clear();
      bases.clear();
      users.clear();
    },
  };
}

export type MaterialLibrary = ReturnType<typeof createMaterialLibrary>;

/**
 * Glazed tile layout for the V6 ceramic (colour only; micro relief and
 * roughness come from the supplied ceramic data maps). Deterministic.
 */
export function glazedTileTexture(glaze: string, joint: string, variation: number, size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = joint;
  ctx.fillRect(0, 0, size, size);
  const cols = 4;
  const rows = 2;
  const w = size / cols;
  const h = size / rows;
  const gap = Math.max(3, Math.round(size / 150));
  const colour = new THREE.Color(glaze);
  let seed = 991;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tone = colour.clone().offsetHSL(0, (rand() - 0.5) * variation * 0.4, (rand() - 0.5) * variation);
      const x = c * w + gap / 2;
      const y = r * h + gap / 2;
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, `#${tone.clone().offsetHSL(0, 0, 0.012).getHexString()}`);
      gradient.addColorStop(1, `#${tone.clone().offsetHSL(0, 0, -0.012).getHexString()}`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w - gap, h - gap);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Soft vertical daylight band used as a spot-light cookie on the V2 wall. */
export function daylightBandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(0.36, '#000');
  gradient.addColorStop(0.46, '#fff');
  gradient.addColorStop(0.58, '#fff');
  gradient.addColorStop(0.7, '#000');
  gradient.addColorStop(1, '#000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
