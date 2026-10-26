import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Mesh, Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MANIFESTO_ASSETS } from '../config/assets';
import { M5_NETWORK_CONNECTIONS, M5_NETWORK_NODES } from '../config/manifestoContent';
import { createManifestoAssetController } from '../manifesto/manifestoAssetController';
import { CHAPTERS, type ChapterId } from './manifestoChoreography';

// GLTFLoader needs a few browser globals in Node. Embedded maps only have their
// headers decoded here: this checks geometry, clips and control, not pixels.
const g = globalThis as Record<string, unknown>;
g.self ??= globalThis;
g.ProgressEvent ??= class {
  constructor(public type: string, data: object) {
    Object.assign(this, data);
  }
};
g.createImageBitmap ??= async (blob: Blob) => {
  const b = Buffer.from(await blob.arrayBuffer());
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), close() {} };
};

async function load(id: ChapterId): Promise<GLTF> {
  const bytes = readFileSync(new URL(`../../public${MANIFESTO_ASSETS.chapters[id].model}`, import.meta.url));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

function snapshot(root: Object3D) {
  const out: Record<string, unknown> = {};
  root.traverse((n) => {
    const mesh = n as Mesh;
    out[n.uuid] = [n.position.toArray(), n.quaternion.toArray(), n.scale.toArray(), mesh.morphTargetInfluences?.slice(), n.name.startsWith('M5_route_') ? mesh.geometry.drawRange.count : null];
  });
  return JSON.stringify(out);
}

const SEMANTIC: Record<ChapterId, string[]> = {
  M2: ['M2_paper_sheet', 'M2_system_01', 'M2_system_02', 'M2_system_03', 'M2_system_04', 'M2_system_05'],
  M3: ['M3_site_ground', 'M3_survey', 'M3_design_grid', 'M3_foundation', 'M3_surface', 'M3_markings', 'M3_drainage', 'M3_lighting', 'M3_inspection_sweep'],
  M4: ['M4_mast', 'M4_windsock_bearing', 'M4_cloth_band_1', 'M4_cloth_band_5', 'M4_anemometer_rotor', 'M4_inlet_ring'],
  M5: ['M5_hinge_left', 'M5_hinge_right', 'M5_routes', ...M5_NETWORK_NODES.map((n) => `M5_node_${n.id}`)],
  M6: ['M6_signature', 'M6_blue_1', 'M6_red_2', 'M6_white_detail_7'],
};

for (const id of CHAPTERS) {
  test(`${id}: bundled clip is driven by absolute progress, reversibly, and settles for reduced motion`, async () => {
    const gltf = await load(id);
    const c = createManifestoAssetController(gltf, id);
    assert.equal(c.clipName, MANIFESTO_ASSETS.chapters[id].clip);
    for (const name of SEMANTIC[id]) assert.ok(c.root.getObjectByName(name), `${id}: ${name} missing`);
    // No cameras inside the assets: the page owns its fixed composition cameras.
    let cameras = 0;
    c.root.traverse((n) => { if ((n as { isCamera?: boolean }).isCamera) cameras++; });
    assert.equal(cameras, 0);

    c.setProgress(0);
    const start = snapshot(c.root);
    c.setProgress(0.37);
    const middle = snapshot(c.root);
    c.setProgress(1);
    const end = snapshot(c.root);
    assert.notEqual(start, end);
    c.setProgress(0.37);
    assert.equal(snapshot(c.root), middle, 'reverse scroll restores the same pose');
    c.setProgress(0);
    assert.equal(snapshot(c.root), start);
    c.setProgress(0.2, true);
    assert.equal(snapshot(c.root), end, 'reduced motion shows the settled pose');
    c.dispose();
    c.dispose();
  });
}

test('M5 traces its seven routes progressively and its nodes carry the approved names', async () => {
  const gltf = await load('M5');
  const c = createManifestoAssetController(gltf, 'M5');
  const routes: Mesh[] = [];
  c.root.traverse((n) => { if (n.name.startsWith('M5_route_')) routes.push(n as Mesh); });
  assert.deepEqual(
    routes.map((r) => `${r.userData.from}>${r.userData.to}`).sort(),
    M5_NETWORK_CONNECTIONS.map((l) => `${l.from}>${l.to}`).sort(),
  );
  const drawn = (p: number) => {
    c.setProgress(p);
    return routes.reduce((sum, r) => sum + r.geometry.drawRange.count, 0);
  };
  const counts = [0, 0.4, 0.5, 0.6, 0.7, 0.8, 1].map(drawn);
  assert.equal(counts[0], 0);
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i] >= counts[i - 1]);
  assert.ok(counts[3] > 0 && counts[3] < counts[6], 'routes are partly traced mid-way');
  assert.equal(drawn(0.3), 0, 'tracing reverses');
  const labels: Record<string, string> = {};
  c.root.traverse((n) => {
    if (n.userData.networkId) labels[n.userData.networkId] = n.userData.label;
  });
  assert.deepEqual(labels, Object.fromEntries(M5_NETWORK_NODES.map((n) => [n.id, n.name])));
  c.dispose();
});
