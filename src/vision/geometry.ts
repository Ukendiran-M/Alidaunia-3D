/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Small geometry helpers for the Vision journey. All UVs are in metres so that
 * a material's `tile` gives the physical scale of its maps.
 */

import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import type { Artwork, BrandArt } from './artwork';

export interface ZoneContext {
  scene: THREE.Scene;
  materials: MaterialLibrary;
  mobile: boolean;
  shadows: boolean;
  /** Logo image and fonts; artwork repaints itself once they are available. */
  brand: Promise<BrandArt>;
  /** False once the route has been left: late async work must discard its results. */
  alive(): boolean;
}

export interface Zone {
  group: THREE.Group;
  /** Lights owned by the zone. They live at the scene root so the light count never changes. */
  lights: THREE.Light[];
  /** Apply the complete state for journey position `s`. Must be a pure function of `s`. */
  update(s: number, camera: THREE.PerspectiveCamera): void;
  /** Resolves when the zone's essential assets are in place (first frame waits for it). */
  ready?: Promise<void>;
}

/** Register artwork textures with the library and repaint them once brand assets load. */
export function useArtwork(ctx: ZoneContext, ...items: Artwork[]) {
  for (const item of items) ctx.materials.adopt(item.texture);
  return ctx.brand.then((art) => {
    if (ctx.alive()) items.forEach((item) => item.paint(art));
  });
}

/** Horizontal plane whose UVs are world X/Z (metres), optionally offset. */
export function worldPlane(x0: number, x1: number, z0: number, z1: number, y = 0, u0 = 0, v0 = 0) {
  const geometry = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const p = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) - u0, p.getZ(i) - v0);
  return geometry;
}

/** Thin flat label/decal plane facing +Z (rotate as needed), with a canvas texture. */
export function decal(width: number, height: number, map: THREE.Texture, transparent = false) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, roughness: 0.55, transparent, depthWrite: !transparent, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
}

/** Box whose UVs are scaled to metres; `u0`/`v0` offset the pattern per instance. */
export function meterBox(w: number, h: number, d: number, u0 = 0, v0 = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  const sizes: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * sizes[f][0] + u0, uv.getY(k) * sizes[f][1] + v0);
    }
  }
  return geometry;
}

/** Horizontal plane at y = 0 spanning [x0, x1] × [z1, z0], UVs in metres. */
export function floorPlane(x0: number, x1: number, z0: number, z1: number) {
  const w = x1 - x0;
  const d = z0 - z1;
  const geometry = new THREE.PlaneGeometry(w, d);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return geometry;
}

/**
 * A planar band that follows `centre` with varying width, as a Shape suitable
 * for extrusion (structural ribs).
 */
export function bandShape(centre: THREE.Vector2[], width: (t: number) => number) {
  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  for (let i = 0; i < centre.length; i++) {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(centre.length - 1, i + 1)];
    const tangent = new THREE.Vector2().subVectors(b, a).normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x);
    const half = width(i / (centre.length - 1)) / 2;
    left.push(centre[i].clone().addScaledVector(normal, half));
    right.push(centre[i].clone().addScaledVector(normal, -half));
  }
  return new THREE.Shape([...left, ...right.reverse()]);
}

export function extrude(shape: THREE.Shape, depth: number, bevel: number, curveSegments = 24) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/** Elliptical arch ring (between two concentric semi-ellipses) as a Shape in the XY plane. */
export function archRingShape(a: number, b: number, depth: number, segments = 64) {
  const outer: THREE.Vector2[] = [];
  const inner: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    outer.push(new THREE.Vector2(a * Math.cos(t), b * Math.sin(t)));
    inner.push(new THREE.Vector2((a - depth) * Math.cos(t), (b - depth) * Math.sin(t)));
  }
  return new THREE.Shape([...outer, ...inner.reverse()]);
}

/**
 * Tube along a changing polyline with preallocated buffers (membrane edge
 * ropes). Rebuilt in place, never reallocated.
 */
export function createDynamicTube(segments: number, radial: number, radius: number) {
  const ring = radial + 1;
  const count = (segments + 1) * ring;
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  const index: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('normal', normal);
  geometry.setIndex(index);
  position.setUsage(THREE.DynamicDrawUsage);
  normal.setUsage(THREE.DynamicDrawUsage);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3();
  const n = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  function update(points: THREE.Vector3[]) {
    for (let i = 0; i <= segments; i++) {
      const p = points[i];
      tangent.subVectors(points[Math.min(segments, i + 1)], points[Math.max(0, i - 1)]).normalize();
      side.crossVectors(tangent, worldUp);
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
      side.normalize();
      up.crossVectors(side, tangent).normalize();
      for (let j = 0; j <= radial; j++) {
        const angle = (j / radial) * Math.PI * 2;
        n.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(up, Math.sin(angle));
        const k = i * ring + j;
        position.setXYZ(k, p.x + n.x * radius, p.y + n.y * radius, p.z + n.z * radius);
        normal.setXYZ(k, n.x, n.y, n.z);
      }
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    geometry.computeBoundingSphere();
  }
  return { geometry, update };
}

/** Place an instance so its local +Y axis runs from `a` to `b` (cylinders, cables). */
export function segmentMatrix(a: THREE.Vector3, b: THREE.Vector3, radiusScale = 1, out = new THREE.Matrix4()) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return out.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(radiusScale, length, radiusScale));
}

export function shadowed<T extends THREE.Object3D>(object: T, ctx: ZoneContext, cast = true, receive = true) {
  object.traverse((o) => {
    o.castShadow = ctx.shadows && cast;
    o.receiveShadow = ctx.shadows && receive;
  });
  return object;
}

export type SurfacePoint = { p: THREE.Vector3; n: THREE.Vector3; uv: [number, number] };

/**
 * Indexed (nu × nv) parametric surface with explicit normals. Winding is made
 * consistent with the supplied normals so double-sided shading stays correct.
 */
export function paramSurface(nu: number, nv: number, at: (u: number, v: number) => SurfacePoint) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const { p, n, uv } = at(i / nu, j / nv);
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      uvs.push(uv[0], uv[1]);
    }
  }
  const index: number[] = [];
  const row = nu + 1;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * row + i;
      index.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  orientIndex(index, pos, nor);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}

/** Reverse all triangles if the first one's winding disagrees with its vertex normal. */
export function orientIndex(index: number[] | Uint32Array | Uint16Array, pos: ArrayLike<number>, nor: ArrayLike<number>) {
  const v = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  for (let t = 0; t < index.length; t += 3) {
    const a = v(index[t]);
    const face = new THREE.Vector3().subVectors(v(index[t + 1]), a).cross(new THREE.Vector3().subVectors(v(index[t + 2]), a));
    if (face.lengthSq() < 1e-10) continue;
    const k = index[t];
    if (face.dot(new THREE.Vector3(nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2])) < 0) {
      for (let s = 0; s < index.length; s += 3) {
        const tmp = index[s + 1];
        index[s + 1] = index[s + 2];
        index[s + 2] = tmp;
      }
    }
    return;
  }
}
