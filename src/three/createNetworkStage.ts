/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Section M5: 3D Conceptual Network Stage
 * Editorial architectural board with raised node discs/pylons (red-accent hub for Foggia)
 * and progressive blue spatial arcs representing the 7 schematic connections.
 */

import * as THREE from 'three';
import {
  computeNetworkState,
  type NetworkState,
  type Node3DPosition,
  type Connection3DData,
} from '../utils/networkPose';

export interface NetworkStageOptions {
  mobile?: boolean;
  reducedMotion?: boolean;
  onReady?: () => void;
  onError?: (error: unknown, fatal: boolean) => void;
}

export function createNetworkStage(
  container: HTMLElement,
  options: NetworkStageOptions = {}
) {
  const mobile = options.mobile ?? window.matchMedia('(max-width: 767px)').matches;
  const scene = new THREE.Scene();
  // Off-white / light slate background matching section M5 (#F5F6F7)
  scene.background = new THREE.Color('#F5F6F7');

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

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

  // Key directional light casting soft shadows of nodes and arcs onto the board
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(12, 22, 14);
  keyLight.castShadow = !mobile;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.00015;
  scene.add(keyLight);

  // Soft fill light
  const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
  fillLight.position.set(-14, 12, -8);
  scene.add(fillLight);

  // Soft ambient hemisphere
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.85);
  scene.add(hemiLight);

  // ========================================================
  // BROAD, SHALLOW, PALE ARCHITECTURAL BOARD
  // ========================================================
  const boardWidth = 19.5;
  const boardDepth = 14.5;
  const boardThickness = 0.55;

  // Board top canvas texture with discreet editorial drafting markings
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1950;
  boardCanvas.height = 1450;
  const ctx = boardCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1950, 1450);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(11, 69, 132, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1950; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1450);
      ctx.stroke();
    }
    for (let y = 0; y < 1450; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1950, y);
      ctx.stroke();
    }

    // Outer margin border
    ctx.strokeStyle = 'rgba(11, 69, 132, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1870, 1370);

    // Header captions
    ctx.fillStyle = '#081C33';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ALIDAUNIA SERVICES // TOPOLOGIA DI RETE', 65, 80);

    ctx.fillStyle = '#0B4584';
    ctx.font = '14px monospace';
    ctx.fillText('SCHEMA DI RETE // NODI TERRITORIALI ED ELISANITARI', 65, 105);

    ctx.fillStyle = '#E31E24';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('HUB OPERATIVO: FOGGIA (ALIDAUNIA)', 1420, 80);

    // Footer note
    ctx.fillStyle = 'rgba(8, 28, 51, 0.45)';
    ctx.font = '12px monospace';
    ctx.fillText('SCHEMA CONCETTUALE NON IN SCALA GEOGRAFICA // RAPPRESENTAZIONE GRAFICA DEI COLLEGAMENTI', 65, 1375);
  }

  const boardTexture = trackTex(new THREE.CanvasTexture(boardCanvas));
  boardTexture.colorSpace = THREE.SRGBColorSpace;
  boardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Multi-material for board (ivory top with texture, slate sides and bottom)
  const boardSideMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.05,
    })
  );
  const boardTopMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.75,
      metalness: 0.02,
    })
  );

  const boardGeom = trackGeom(new THREE.BoxGeometry(boardWidth, boardThickness, boardDepth));
  // Box materials: +x, -x, +y (top), -y, +z, -z
  const boardMaterials = [
    boardSideMat,
    boardSideMat,
    boardTopMat,
    boardSideMat,
    boardSideMat,
    boardSideMat,
  ];

  const boardMesh = new THREE.Mesh(boardGeom, boardMaterials);
  boardMesh.position.set(0, 0, 0);
  boardMesh.receiveShadow = true;
  boardMesh.castShadow = !mobile;
  scene.add(boardMesh);

  // Soft drop shadow plinth below board
  const plinthGeom = trackGeom(new THREE.PlaneGeometry(boardWidth + 4, boardDepth + 4));
  const plinthMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xebedf0,
      roughness: 0.95,
      metalness: 0.0,
    })
  );
  const plinthMesh = new THREE.Mesh(plinthGeom, plinthMat);
  plinthMesh.rotation.x = -Math.PI / 2;
  plinthMesh.position.y = -boardThickness / 2 - 0.02;
  plinthMesh.receiveShadow = true;
  scene.add(plinthMesh);

  // ========================================================
  // NODES: RAISED DISCS / PYLONS
  // ========================================================
  interface NodeVisual {
    id: string;
    group: THREE.Group;
    beaconMesh?: THREE.Mesh;
    baseMesh: THREE.Mesh;
  }

  const nodeVisuals: NodeVisual[] = [];
  const nodePylonGeom = trackGeom(new THREE.CylinderGeometry(0.38, 0.44, 0.18, 32));
  const hubPylonGeom = trackGeom(new THREE.CylinderGeometry(0.62, 0.72, 0.28, 36));

  const standardBaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x081c33,
      roughness: 0.35,
      metalness: 0.2,
    })
  );
  const standardDiscMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b4584,
      roughness: 0.3,
      metalness: 0.5,
    })
  );
  const hubBaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x081c33,
      roughness: 0.3,
      metalness: 0.3,
    })
  );
  const hubAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe31e24,
      roughness: 0.35,
      metalness: 0.4,
    })
  );
  const whiteBeaconMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    })
  );

  const innerDiscGeom = trackGeom(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24));
  const hubInnerDiscGeom = trackGeom(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32));
  const hubCenterDotGeom = trackGeom(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24));

  const initialState = computeNetworkState(options.reducedMotion ? 1.0 : 0);

  for (const n of initialState.nodes) {
    const group = new THREE.Group();
    group.position.set(n.x, boardThickness / 2, n.z);

    let baseMesh: THREE.Mesh;
    let beaconMesh: THREE.Mesh | undefined;

    if (n.isHub) {
      // FOGGIA: Distinctive, restrained red-accent hub with concentric discs
      baseMesh = new THREE.Mesh(hubPylonGeom, hubBaseMat);
      baseMesh.position.y = 0.14;
      baseMesh.castShadow = !mobile;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      const redRing = new THREE.Mesh(hubInnerDiscGeom, hubAccentMat);
      redRing.position.y = 0.29;
      redRing.castShadow = !mobile;
      group.add(redRing);

      beaconMesh = new THREE.Mesh(hubCenterDotGeom, whiteBeaconMat);
      beaconMesh.position.y = 0.33;
      group.add(beaconMesh);
    } else {
      // Standard regional node
      baseMesh = new THREE.Mesh(nodePylonGeom, standardBaseMat);
      baseMesh.position.y = 0.09;
      baseMesh.castShadow = !mobile;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      const blueDisc = new THREE.Mesh(innerDiscGeom, standardDiscMat);
      blueDisc.position.y = 0.19;
      blueDisc.castShadow = !mobile;
      group.add(blueDisc);

      beaconMesh = new THREE.Mesh(
        trackGeom(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16)),
        whiteBeaconMat
      );
      beaconMesh.position.y = 0.22;
      group.add(beaconMesh);
    }

    scene.add(group);
    nodeVisuals.push({ id: n.id, group, baseMesh, beaconMesh });
  }

  // ========================================================
  // CONNECTIONS: REAL 3D SPATIAL ARCS WITH DRAW RANGE
  // ========================================================
  const NUM_ARC_POINTS = 50;

  interface ConnectionVisual {
    fromId: string;
    toId: string;
    arcLine: THREE.Line;
    shadowLine: THREE.Line;
    curvePoints: THREE.Vector3[];
    groundPoints: THREE.Vector3[];
    geom: THREE.BufferGeometry;
    shadowGeom: THREE.BufferGeometry;
  }

  const connectionVisuals: ConnectionVisual[] = [];

  const arcMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0x0b4584,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    })
  );

  const shadowMat = trackMat(
    new THREE.LineDashedMaterial({
      color: 0x0b4584,
      dashSize: 0.35,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.35,
    })
  );

  for (const conn of initialState.connections) {
    const p0 = new THREE.Vector3(...conn.fromPos);
    p0.y = boardThickness / 2 + 0.15;
    const p1 = new THREE.Vector3(...conn.toPos);
    p1.y = boardThickness / 2 + 0.15;
    const pMid = new THREE.Vector3(...conn.midPos);
    pMid.y = boardThickness / 2 + (conn.midPos[1] - conn.fromPos[1]) + 0.15;

    const curve = new THREE.QuadraticBezierCurve3(p0, pMid, p1);
    const curvePoints = curve.getPoints(NUM_ARC_POINTS);

    const arcGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(curvePoints));
    arcGeom.setDrawRange(0, 0); // starts undrawn
    const arcLine = new THREE.Line(arcGeom, arcMat);
    scene.add(arcLine);

    // Dotted ground trajectory on board surface
    const groundP0 = new THREE.Vector3(conn.fromPos[0], boardThickness / 2 + 0.01, conn.fromPos[2]);
    const groundP1 = new THREE.Vector3(conn.toPos[0], boardThickness / 2 + 0.01, conn.toPos[2]);
    const groundCurve = new THREE.LineCurve3(groundP0, groundP1);
    const groundPoints = groundCurve.getPoints(NUM_ARC_POINTS);

    const shadowGeom = trackGeom(new THREE.BufferGeometry().setFromPoints(groundPoints));
    shadowGeom.setDrawRange(0, 0);
    const shadowLine = new THREE.Line(shadowGeom, shadowMat);
    shadowLine.computeLineDistances();
    scene.add(shadowLine);

    connectionVisuals.push({
      fromId: conn.fromId,
      toId: conn.toId,
      arcLine,
      shadowLine,
      curvePoints,
      groundPoints,
      geom: arcGeom,
      shadowGeom,
    });
  }

  let disposed = false;
  let isVisible = true;
  let progress = 0;
  let frame = 0;

  function pose(p: number) {
    if (disposed) return;
    const state: NetworkState = computeNetworkState(p);

    // 1. Camera trajectory from low overview to 3/4 architectural review
    camera.position.set(...state.cameraPosition);
    camera.lookAt(...state.cameraTarget);

    // 2. Nodes visibility and scale
    for (const n of state.nodes) {
      const vis = nodeVisuals.find((v) => v.id === n.id);
      if (vis) {
        vis.group.scale.set(n.visibility, n.visibility, n.visibility);
        vis.group.visible = n.visibility > 0.01;
      }
    }

    // 3. Connections absolute curve draw ranges
    for (let i = 0; i < state.connections.length; i++) {
      const connData = state.connections[i];
      const vis = connectionVisuals[i];
      if (vis && connData) {
        const count = Math.round(connData.drawProgress * (NUM_ARC_POINTS + 1));
        vis.geom.setDrawRange(0, count);
        vis.shadowGeom.setDrawRange(0, count);
        vis.arcLine.visible = count > 1;
        vis.shadowLine.visible = count > 1;
      }
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

    const aspect = width / height;
    if (aspect < 1.4) {
      // Zoom out slightly on narrower mobile screens so all 6 nodes remain framed
      camera.fov = 34 * (1.4 / aspect);
    } else {
      camera.fov = 34;
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
