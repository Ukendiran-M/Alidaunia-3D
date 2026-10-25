/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Procedural Heliport 3D Model Builder
 * Constructs the 5 functional groups of the architectural heliport visualization:
 * 1. Foundation block & geotechnical drainage base
 * 2. Structural landing deck slab with bevelled edges
 * 3. Surface markings (TLOF circle & "H" designation)
 * 4. Perimeter AVL lighting fixtures & technical equipment conduit
 * 5. Safety perimeter zone, apron boundary & windsock mast
 */

import * as THREE from 'three';

export interface HeliportModel {
  root: THREE.Group;
  groups: {
    foundation: THREE.Group;
    slab: THREE.Group;
    markings: THREE.Group;
    lighting: THREE.Group;
    serviceZone: THREE.Group;
  };
  restPositions: Record<string, THREE.Vector3>;
  dispose: () => void;
}

export function createHeliportModel(): HeliportModel {
  const root = new THREE.Group();
  root.name = 'heliportRoot';

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  function track<T extends THREE.BufferGeometry>(geom: T): T {
    geometries.add(geom);
    return geom;
  }

  function trackMat<T extends THREE.Material>(mat: T): T {
    materials.add(mat);
    return mat;
  }

  // --- Common Palette Materials ---
  // Alidaunia navy / aviation dark asphalt deck
  const deckMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x182433,
      roughness: 0.65,
      metalness: 0.15,
      flatShading: false,
    })
  );

  // Deck bevel trim (slightly darker technical chamfer)
  const deckBevelMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f1822,
      roughness: 0.5,
      metalness: 0.25,
    })
  );

  // Foundation concrete/geotechnical base
  const concreteMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.88,
      metalness: 0.05,
    })
  );

  const drainageGrateMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x273544,
      roughness: 0.45,
      metalness: 0.7,
    })
  );

  // Surface markings: White high-visibility aviation paint
  const whitePaintMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  // Aviation yellow alignment ring
  const yellowPaintMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  // Aviation red accent marking
  const redPaintMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe31e24,
      roughness: 0.4,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  // Perimeter fixtures metal housing
  const metalHousingMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.8,
    })
  );

  // AVL green aviation fixture glow
  const greenLightMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
  );

  // Amber warning light glow
  const amberLightMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    })
  );

  // Service apron material
  const apronMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.1,
    })
  );

  // Windsock mast steel
  const steelMastMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85,
    })
  );

  // ==========================================
  // GROUP 1: Foundation Block & Geotechnical Base
  // ==========================================
  const foundationGroup = new THREE.Group();
  foundationGroup.name = 'foundation';

  // Main concrete footing slab
  const foundationWidth = 9.4;
  const foundationDepth = 9.4;
  const foundationHeight = 0.6;
  const foundationMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(foundationWidth, foundationHeight, foundationDepth)),
    concreteMaterial
  );
  foundationMesh.position.y = -foundationHeight / 2; // top surface at y = 0
  foundationMesh.receiveShadow = true;
  foundationMesh.castShadow = true;
  foundationGroup.add(foundationMesh);

  // Sub-base drainage perimeter trenches
  const trenchThickness = 0.18;
  const trenchLength = foundationWidth + 0.3;
  const trenchGeom = track(new THREE.BoxGeometry(trenchLength, 0.12, trenchThickness));
  const trenchPositions = [
    [0, -0.06, foundationDepth / 2 + trenchThickness / 2],
    [0, -0.06, -foundationDepth / 2 - trenchThickness / 2],
    [foundationWidth / 2 + trenchThickness / 2, -0.06, 0],
    [-foundationWidth / 2 - trenchThickness / 2, -0.06, 0],
  ];

  trenchPositions.forEach(([x, y, z], idx) => {
    const trench = new THREE.Mesh(trenchGeom, drainageGrateMaterial);
    trench.position.set(x, y, z);
    if (idx >= 2) trench.rotation.y = Math.PI / 2;
    trench.receiveShadow = true;
    foundationGroup.add(trench);
  });

  // Base anchors / piling visual caps
  const pileCapGeom = track(new THREE.CylinderGeometry(0.25, 0.3, 0.4, 16));
  const cornerOffsets = [
    [-foundationWidth / 2 + 0.6, -foundationHeight - 0.2, -foundationDepth / 2 + 0.6],
    [foundationWidth / 2 - 0.6, -foundationHeight - 0.2, -foundationDepth / 2 + 0.6],
    [-foundationWidth / 2 + 0.6, -foundationHeight - 0.2, foundationDepth / 2 - 0.6],
    [foundationWidth / 2 - 0.6, -foundationHeight - 0.2, foundationDepth / 2 - 0.6],
  ];
  cornerOffsets.forEach(([cx, cy, cz]) => {
    const pile = new THREE.Mesh(pileCapGeom, drainageGrateMaterial);
    pile.position.set(cx, cy, cz);
    pile.receiveShadow = true;
    foundationGroup.add(pile);
  });

  root.add(foundationGroup);

  // ==========================================
  // GROUP 2: Structural Landing Deck Slab (FATO)
  // ==========================================
  const slabGroup = new THREE.Group();
  slabGroup.name = 'slab';

  const deckSize = 8.6;
  const deckThickness = 0.35;
  const deckMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(deckSize, deckThickness, deckSize)),
    deckMaterial
  );
  deckMesh.position.y = deckThickness / 2; // sits right on y = 0 foundation, top at y = 0.35
  deckMesh.castShadow = true;
  deckMesh.receiveShadow = true;
  slabGroup.add(deckMesh);

  // Bevelled border trims on top perimeter
  const bevelBorderGeom = track(new THREE.BoxGeometry(deckSize + 0.08, 0.04, 0.16));
  const bevelOffsets = [
    [0, deckThickness + 0.02, deckSize / 2 - 0.08, 0],
    [0, deckThickness + 0.02, -deckSize / 2 + 0.08, 0],
    [deckSize / 2 - 0.08, deckThickness + 0.02, 0, Math.PI / 2],
    [-deckSize / 2 + 0.08, deckThickness + 0.02, 0, Math.PI / 2],
  ];
  bevelOffsets.forEach(([bx, by, bz, rotY]) => {
    const bevel = new THREE.Mesh(bevelBorderGeom, deckBevelMaterial);
    bevel.position.set(bx, by, bz);
    bevel.rotation.y = rotY;
    bevel.receiveShadow = true;
    slabGroup.add(bevel);
  });

  root.add(slabGroup);

  // ==========================================
  // GROUP 3: Surface Markings (TLOF & "H")
  // ==========================================
  const markingsGroup = new THREE.Group();
  markingsGroup.name = 'markings';
  const markingsY = deckThickness + 0.005; // 5mm above deck

  // 1. TLOF Outer white circular ring
  const ringGeom = track(new THREE.RingGeometry(2.6, 2.9, 64));
  const ringMesh = new THREE.Mesh(ringGeom, whitePaintMaterial);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(0, markingsY, 0);
  ringMesh.receiveShadow = true;
  markingsGroup.add(ringMesh);

  // 2. Inner concentric safety border (yellow dashed effect with ring)
  const innerRingGeom = track(new THREE.RingGeometry(3.02, 3.14, 64));
  const innerRingMesh = new THREE.Mesh(innerRingGeom, yellowPaintMaterial);
  innerRingMesh.rotation.x = -Math.PI / 2;
  innerRingMesh.position.set(0, markingsY, 0);
  innerRingMesh.receiveShadow = true;
  markingsGroup.add(innerRingMesh);

  // 3. Central "H" Marking
  const hBarWidth = 0.38;
  const hBarLength = 2.4;
  const hCrossLength = 1.35;

  // Left upright
  const hLeftMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(hBarWidth, hBarLength)),
    whitePaintMaterial
  );
  hLeftMesh.rotation.x = -Math.PI / 2;
  hLeftMesh.position.set(-0.65, markingsY, 0);
  hLeftMesh.receiveShadow = true;
  markingsGroup.add(hLeftMesh);

  // Right upright
  const hRightMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(hBarWidth, hBarLength)),
    whitePaintMaterial
  );
  hRightMesh.rotation.x = -Math.PI / 2;
  hRightMesh.position.set(0.65, markingsY, 0);
  hRightMesh.receiveShadow = true;
  markingsGroup.add(hRightMesh);

  // Crossbar
  const hCrossMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(hCrossLength, hBarWidth)),
    whitePaintMaterial
  );
  hCrossMesh.rotation.x = -Math.PI / 2;
  hCrossMesh.position.set(0, markingsY, 0);
  hCrossMesh.receiveShadow = true;
  markingsGroup.add(hCrossMesh);

  // 4. Directional orientation arrow / approach heading indicator (Alidaunia Red)
  const arrowGeom = track(new THREE.ConeGeometry(0.3, 0.7, 3));
  const arrowMesh = new THREE.Mesh(arrowGeom, redPaintMaterial);
  arrowMesh.rotation.x = -Math.PI / 2;
  arrowMesh.rotation.z = Math.PI;
  arrowMesh.position.set(0, markingsY, -3.5);
  arrowMesh.scale.set(1, 1, 0.02);
  arrowMesh.receiveShadow = true;
  markingsGroup.add(arrowMesh);

  // Alignment perimeter tick marks at North/South/East/West
  const tickGeom = track(new THREE.PlaneGeometry(0.2, 0.5));
  const tickOffsets = [
    [0, markingsY, 3.4, 0],
    [3.4, markingsY, 0, Math.PI / 2],
    [-3.4, markingsY, 0, Math.PI / 2],
  ];
  tickOffsets.forEach(([tx, ty, tz, trotY]) => {
    const tick = new THREE.Mesh(tickGeom, whitePaintMaterial);
    tick.rotation.x = -Math.PI / 2;
    tick.rotation.z = trotY;
    tick.position.set(tx, ty, tz);
    tick.receiveShadow = true;
    markingsGroup.add(tick);
  });

  root.add(markingsGroup);

  // ==========================================
  // GROUP 4: Perimeter Lighting & Equipment Conduit
  // ==========================================
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'lighting';

  // Perimeter Conduit Channels
  const conduitLength = deckSize - 0.4;
  const conduitGeom = track(new THREE.BoxGeometry(conduitLength, 0.05, 0.06));
  const conduitOffsets = [
    [0, deckThickness + 0.025, deckSize / 2 - 0.22, 0],
    [0, deckThickness + 0.025, -deckSize / 2 + 0.22, 0],
    [deckSize / 2 - 0.22, deckThickness + 0.025, 0, Math.PI / 2],
    [-deckSize / 2 + 0.22, deckThickness + 0.025, 0, Math.PI / 2],
  ];
  conduitOffsets.forEach(([cx, cy, cz, crotY]) => {
    const conduit = new THREE.Mesh(conduitGeom, metalHousingMaterial);
    conduit.position.set(cx, cy, cz);
    conduit.rotation.y = crotY;
    conduit.castShadow = true;
    lightingGroup.add(conduit);
  });

  // Corner Junction / Control Boxes
  const junctionBoxGeom = track(new THREE.BoxGeometry(0.26, 0.16, 0.26));
  const cornerBoxes = [
    [deckSize / 2 - 0.22, deckThickness + 0.08, deckSize / 2 - 0.22],
    [-deckSize / 2 + 0.22, deckThickness + 0.08, deckSize / 2 - 0.22],
    [deckSize / 2 - 0.22, deckThickness + 0.08, -deckSize / 2 + 0.22],
    [-deckSize / 2 + 0.22, deckThickness + 0.08, -deckSize / 2 + 0.22],
  ];
  cornerBoxes.forEach(([jx, jy, jz]) => {
    const box = new THREE.Mesh(junctionBoxGeom, metalHousingMaterial);
    box.position.set(jx, jy, jz);
    box.castShadow = true;
    lightingGroup.add(box);
  });

  // AVL Inset & Elevated Perimeter Fixtures
  const fixtureBaseGeom = track(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12));
  const fixtureLensGeom = track(new THREE.SphereGeometry(0.045, 12, 8));

  // 12 lights along the pad rim
  const fixtureRadius = deckSize / 2 - 0.3;
  const fixtureCount = 12;
  for (let i = 0; i < fixtureCount; i++) {
    const angle = (i / fixtureCount) * Math.PI * 2;
    // project to square edge perimeter
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const scale = Math.min(Math.abs(1 / cosA), Math.abs(1 / sinA));
    const fx = cosA * fixtureRadius * Math.min(1.0, scale * 0.95);
    const fz = sinA * fixtureRadius * Math.min(1.0, scale * 0.95);
    const fy = deckThickness + 0.06;

    const base = new THREE.Mesh(fixtureBaseGeom, metalHousingMaterial);
    base.position.set(fx, fy, fz);
    base.castShadow = true;
    lightingGroup.add(base);

    // Green lights for touchdown perimeter, amber for approach ends
    const isApproachEnd = Math.abs(fz) > deckSize / 2 - 0.6 && Math.abs(fx) < 1.0;
    const lens = new THREE.Mesh(
      fixtureLensGeom,
      isApproachEnd ? amberLightMaterial : greenLightMaterial
    );
    lens.position.set(fx, fy + 0.07, fz);
    lightingGroup.add(lens);
  }

  root.add(lightingGroup);

  // ==========================================
  // GROUP 5: Safety Perimeter Zone & Windsock
  // ==========================================
  const serviceZoneGroup = new THREE.Group();
  serviceZoneGroup.name = 'serviceZone';

  // Apron strips framing the main deck
  const apronOuterSize = 11.2;
  const apronBorderWidth = (apronOuterSize - deckSize) / 2;
  const apronSegmentLongGeom = track(
    new THREE.BoxGeometry(apronOuterSize, 0.15, apronBorderWidth)
  );
  const apronSegmentSideGeom = track(
    new THREE.BoxGeometry(apronBorderWidth, 0.15, deckSize)
  );

  const apronY = 0.075; // flush with foundation top
  // North & South apron strips
  const apronNorth = new THREE.Mesh(apronSegmentLongGeom, apronMaterial);
  apronNorth.position.set(0, apronY, (deckSize + apronBorderWidth) / 2);
  apronNorth.receiveShadow = true;
  serviceZoneGroup.add(apronNorth);

  const apronSouth = new THREE.Mesh(apronSegmentLongGeom, apronMaterial);
  apronSouth.position.set(0, apronY, -(deckSize + apronBorderWidth) / 2);
  apronSouth.receiveShadow = true;
  serviceZoneGroup.add(apronSouth);

  // East & West apron strips
  const apronEast = new THREE.Mesh(apronSegmentSideGeom, apronMaterial);
  apronEast.position.set((deckSize + apronBorderWidth) / 2, apronY, 0);
  apronEast.receiveShadow = true;
  serviceZoneGroup.add(apronEast);

  const apronWest = new THREE.Mesh(apronSegmentSideGeom, apronMaterial);
  apronWest.position.set(-(deckSize + apronBorderWidth) / 2, apronY, 0);
  apronWest.receiveShadow = true;
  serviceZoneGroup.add(apronWest);

  // Safety Stanchions / Low Barrier Posts along apron outer edge
  const postGeom = track(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8));
  const postRailGeom = track(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 8));
  const postPositions: [number, number, number][] = [
    [-apronOuterSize / 2 + 0.3, 0.35, apronOuterSize / 2 - 0.3],
    [apronOuterSize / 2 - 0.3, 0.35, apronOuterSize / 2 - 0.3],
    [-apronOuterSize / 2 + 0.3, 0.35, -apronOuterSize / 2 + 0.3],
    [apronOuterSize / 2 - 0.3, 0.35, -apronOuterSize / 2 + 0.3],
    [0, 0.35, apronOuterSize / 2 - 0.3],
    [0, 0.35, -apronOuterSize / 2 + 0.3],
  ];

  postPositions.forEach(([px, py, pz]) => {
    const post = new THREE.Mesh(postGeom, steelMastMaterial);
    post.position.set(px, py, pz);
    post.castShadow = true;
    serviceZoneGroup.add(post);
  });

  // --- Windsock Assembly ---
  // Located at North-East safety perimeter corner
  const windsockX = apronOuterSize / 2 - 0.8;
  const windsockZ = -apronOuterSize / 2 + 0.8;
  const mastHeight = 2.4;

  // Mast base pedestal
  const mastBaseMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.18, 0.22, 0.2, 12)),
    metalHousingMaterial
  );
  mastBaseMesh.position.set(windsockX, 0.2, windsockZ);
  mastBaseMesh.castShadow = true;
  serviceZoneGroup.add(mastBaseMesh);

  // Steel mast pole
  const mastMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.04, 0.045, mastHeight, 12)),
    steelMastMaterial
  );
  mastMesh.position.set(windsockX, mastHeight / 2 + 0.2, windsockZ);
  mastMesh.castShadow = true;
  serviceZoneGroup.add(mastMesh);

  // Swivel head & top indicator light
  const swivelMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 12)),
    metalHousingMaterial
  );
  swivelMesh.position.set(windsockX, mastHeight + 0.25, windsockZ);
  serviceZoneGroup.add(swivelMesh);

  const topBeacon = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.05, 12, 8)),
    redPaintMaterial
  );
  topBeacon.position.set(windsockX, mastHeight + 0.36, windsockZ);
  serviceZoneGroup.add(topBeacon);

  // Windsock conical fabric stripes (tapered cylinder rotated horizontally with droop)
  const sockGroup = new THREE.Group();
  sockGroup.position.set(windsockX + 0.1, mastHeight + 0.22, windsockZ);

  // 3 segments alternating red and white
  const sockSegmentData = [
    { rTop: 0.22, rBottom: 0.17, length: 0.35, mat: redPaintMaterial, zOffset: 0.175 },
    { rTop: 0.17, rBottom: 0.12, length: 0.35, mat: whitePaintMaterial, zOffset: 0.525 },
    { rTop: 0.12, rBottom: 0.07, length: 0.35, mat: redPaintMaterial, zOffset: 0.875 },
  ];

  sockSegmentData.forEach((seg) => {
    const segMesh = new THREE.Mesh(
      track(new THREE.CylinderGeometry(seg.rBottom, seg.rTop, seg.length, 16, 1, true)),
      seg.mat
    );
    segMesh.rotation.x = Math.PI / 2;
    segMesh.position.set(0, 0, seg.zOffset);
    segMesh.castShadow = true;
    sockGroup.add(segMesh);
  });

  // Natural wind droop and heading angle
  sockGroup.rotation.y = 0.45; // points 25 degrees
  sockGroup.rotation.x = 0.15; // gentle aerodynamic droop
  serviceZoneGroup.add(sockGroup);

  root.add(serviceZoneGroup);

  // Immutable resting positions for all groups
  const restPositions: Record<string, THREE.Vector3> = {
    foundation: foundationGroup.position.clone(),
    slab: slabGroup.position.clone(),
    markings: markingsGroup.position.clone(),
    lighting: lightingGroup.position.clone(),
    serviceZone: serviceZoneGroup.position.clone(),
  };

  return {
    root,
    groups: {
      foundation: foundationGroup,
      slab: slabGroup,
      markings: markingsGroup,
      lighting: lightingGroup,
      serviceZone: serviceZoneGroup,
    },
    restPositions,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      geometries.clear();
      materials.clear();
      textures.clear();
    },
  };
}
