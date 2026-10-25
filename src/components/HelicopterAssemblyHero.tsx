/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Helicopter Assembly & Exploded View 3D Hero
 * Powered by Three.js and GSAP ScrollTrigger
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ASSEMBLY_GROUPS, computeAssemblyState } from '../utils/helicopterPose';
import { ArrowDown, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CachedTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  offset: THREE.Vector3;
}

export const HelicopterAssemblyHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (!container || !canvasContainer) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Helicopter references & transform caching
    let helicopterRoot: THREE.Object3D | null = null;
    const cachedTransforms = new Map<string, CachedTransform>();
    let initialRootPos = new THREE.Vector3();
    let initialRootRot = new THREE.Euler();
    let mainRotorGroup: THREE.Object3D | null = null;
    let tailRotorGroup: THREE.Object3D | null = null;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081C33); // Studio Deep Navy

    // Subtle atmospheric fog to blend the horizon
    scene.fog = new THREE.FogExp2(0x081C33, 0.015);

    const padGroup = new THREE.Group();
    scene.add(padGroup);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 50 : 38,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      100
    );

    // Dynamic stage position based on screen format
    const getStageOffset = () => {
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      const aspect = width / height;
      if (aspect < 0.8) {
        // Mobile portrait: lower the stage so helicopter rests comfortably below the text
        return { x: 0, y: -1.8, z: 0 };
      } else if (aspect < 1.35) {
        // Tablet / compact desktop
        return { x: 1.6, y: -0.2, z: 0 };
      } else {
        // Wide desktop: shift to right to create clear negative space for left headline
        return { x: 3.2, y: 0, z: 0 };
      }
    };

    // Initial three-quarter view framing
    const updateCameraFraming = () => {
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      const aspect = width / height;
      camera.aspect = aspect;

      const offset = getStageOffset();
      padGroup.position.set(offset.x, offset.y, offset.z);
      if (helicopterRoot) {
        helicopterRoot.position.set(offset.x, offset.y + 0.05, offset.z);
        initialRootPos.set(offset.x, offset.y + 0.05, offset.z);
      }

      if (aspect < 0.8) {
        // Mobile portrait: diagonal three-quarter perspective fitting entire helicopter in lower stage
        camera.fov = 48;
        camera.position.set(0, 6.5, 23.0);
        camera.lookAt(0, -1.6, 0);
        if (helicopterRoot) {
          helicopterRoot.rotation.y = -0.85;
          initialRootRot.y = -0.85;
        }
      } else if (aspect < 1.35) {
        // Tablet / compact desktop
        camera.fov = 38;
        camera.position.set(offset.x + 2.0, 5.2, 16.0);
        camera.lookAt(offset.x - 1.5, 1.8, 0);
        if (helicopterRoot) {
          helicopterRoot.rotation.y = 0;
          initialRootRot.y = 0;
        }
      } else {
        // Standard wide desktop: helicopter framed prominently center-right with clear negative space on left
        camera.fov = 35;
        camera.position.set(offset.x + 2.4, 5.0, 14.8);
        camera.lookAt(offset.x - 1.8, 1.8, 0);
        if (helicopterRoot) {
          helicopterRoot.rotation.y = 0;
          initialRootRot.y = 0;
        }
      }
      camera.updateProjectionMatrix();
    };

    updateCameraFraming();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.appendChild(renderer.domElement);

    // 2. Studio Lighting (Navy, Key, Rim, and Red accent)
    const ambientLight = new THREE.AmbientLight(0x0f2b48, 1.4);
    scene.add(ambientLight);

    // Key Light: warm directional illumination from front-top-right
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    keyLight.position.set(12, 16, 10);
    scene.add(keyLight);

    // Rim Light: cool aeronautical cyan/blue contour light from rear-left
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-14, 12, -8);
    scene.add(rimLight);

    // Fill Light: soft bottom fill from ground
    const fillLight = new THREE.DirectionalLight(0x0b4584, 1.1);
    fillLight.position.set(0, -6, 8);
    scene.add(fillLight);

    // Subtle Alidaunia Red accent light
    const redAccent = new THREE.PointLight(0xe31e24, 2.5, 18);
    redAccent.position.set(-4.5, 3.8, 0.5);
    scene.add(redAccent);

    // 3. Landing Pad Ground Surface (Minimalist ICAO-inspired platform)
    // Outer dark tarmac disk
    const tarmacGeo = new THREE.CircleGeometry(8.5, 64);
    const tarmacMat = new THREE.MeshStandardMaterial({
      color: 0x061424,
      roughness: 0.85,
      metalness: 0.1,
    });
    const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.position.y = -0.02;
    padGroup.add(tarmac);

    // Inner landing circle outline
    const ringGeo = new THREE.RingGeometry(3.6, 3.75, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.01;
    padGroup.add(ring);

    // Outer perimeter dash ring
    const outerRingGeo = new THREE.RingGeometry(5.2, 5.28, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x0b4584,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = -0.01;
    padGroup.add(outerRing);

    // Green perimeter LED lights
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2;
      const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(Math.cos(angle) * 5.24, 0.02, Math.sin(angle) * 5.24);
      padGroup.add(led);
    }

    // 4. Model Loading and Transform Caching
    const loader = new GLTFLoader();
    loader.load(
      '/models/helicopter-assembly.glb',
      (gltf) => {
        const root = gltf.scene;
        helicopterRoot = root.getObjectByName('Helicopter') || root;
        scene.add(root);

        // Align initial helicopter and pad placement with stage offset
        updateCameraFraming();

        // Remap materials to Alidaunia Brand Palette
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false;
            child.receiveShadow = false;

            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat) {
              // Remap original teal paint to Alidaunia Brand Blue (#0B4584)
              if (mat.name === 'Original teal enamel paint' || (mat.color && mat.color.getHexString() === '007a87')) {
                mat.color.set('#0B4584');
                mat.roughness = 0.28;
                mat.metalness = 0.25;
              }

              // Enhance clear glazing with aviation tint
              if (mat.name === 'Original clear glazing' || mat.transparent) {
                mat.transparent = true;
                mat.opacity = 0.38;
                mat.roughness = 0.08;
                mat.metalness = 0.15;
                mat.color.set('#b0cde8');
              }

              // Aluminum and steel finishes
              if (mat.name === 'Original brushed aluminium' || mat.name === 'Original polished steel') {
                mat.metalness = 0.85;
                mat.roughness = 0.22;
              }
            }
          }
        });

        // Cache all starting positions and lookup animation offsets
        for (const cfg of ASSEMBLY_GROUPS) {
          const obj = root.getObjectByName(cfg.name);
          if (obj) {
            cachedTransforms.set(cfg.name, {
              position: obj.position.clone(),
              quaternion: obj.quaternion.clone(),
              scale: obj.scale.clone(),
              offset: new THREE.Vector3(...cfg.offset),
            });
            if (cfg.name === 'mainRotor') mainRotorGroup = obj;
            if (cfg.name === 'tailRotor') tailRotorGroup = obj;
          }
        }

        setIsLoaded(true);
        renderer.render(scene, camera);

        // 5. ScrollTrigger Animation Lifecycle
        if (!prefersReducedMotion) {
          ScrollTrigger.create({
            trigger: container,
            start: 'top top',
            end: isMobile ? '+=220%' : '+=350%',
            pin: true,
            scrub: 0.3,
            onUpdate: (self) => {
              applyScrollProgress(self.progress);
            },
          });
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load helicopter assembly GLB:', err);
        setLoadError('Impossibile caricare il modello 3D del velivolo.');
      }
    );

    // 6. Deterministic Pose Applier (Pure function of progress [0..1])
    const applyScrollProgress = (progress: number) => {
      if (!helicopterRoot) return;

      const state = computeAssemblyState(progress);

      // Update Heading Opacity in HTML
      if (headingRef.current) {
        headingRef.current.style.opacity = state.headingOpacity.toFixed(3);
        headingRef.current.style.transform = `translateY(${(-30 * (1 - state.headingOpacity)).toFixed(1)}px)`;
        headingRef.current.style.pointerEvents = state.headingOpacity > 0.1 ? 'auto' : 'none';
      }

      // Update Each Assembly Component
      for (const [name, cached] of cachedTransforms.entries()) {
        const obj = helicopterRoot.getObjectByName(name);
        if (!obj) continue;

        const factor = state.groupFactors[name] ?? 0;
        // Position is strictly interpolated from cached base transform
        obj.position.x = cached.position.x + cached.offset.x * factor;
        obj.position.y = cached.position.y + cached.offset.y * factor;
        obj.position.z = cached.position.z + cached.offset.z * factor;
      }

      // Rotor Spin (applied around hub pivot)
      if (mainRotorGroup) {
        mainRotorGroup.rotation.y = state.rotorAngle;
      }
      if (tailRotorGroup) {
        tailRotorGroup.rotation.z = state.rotorAngle * 1.5;
      }

      // Aircraft Lift and Departure (applied to root)
      helicopterRoot.position.x = initialRootPos.x + state.liftPosition[0];
      helicopterRoot.position.y = initialRootPos.y + state.liftPosition[1];
      helicopterRoot.position.z = initialRootPos.z + state.liftPosition[2];

      helicopterRoot.rotation.x = initialRootRot.x + state.bankRotation[0];
      helicopterRoot.rotation.y = initialRootRot.y + state.bankRotation[1];
      helicopterRoot.rotation.z = initialRootRot.z + state.bankRotation[2];

      renderer.render(scene, camera);
    };

    // 7. Resize Handler
    const handleResize = () => {
      if (!canvasContainer) return;
      const w = canvasContainer.clientWidth;
      const h = canvasContainer.clientHeight;
      if (w === 0 || h === 0) return;
      updateCameraFraming();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvasContainer);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="m1"
      className="relative w-full h-screen min-h-[640px] bg-[#081C33] text-white overflow-hidden"
    >
      {/* Three.js WebGL Canvas Stage */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-default"
        aria-hidden="true"
      />

      {/* Directional Navy Gradient for Text Legibility in Negative Space */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 bg-gradient-to-r from-[#081C33] via-[#081C33]/75 to-transparent pointer-events-none z-[5]"
        aria-hidden="true"
      />

      {/* Accessible HTML Layer in Clear Negative Space */}
      <div
        ref={headingRef}
        className="relative z-10 max-w-7xl mx-auto h-full px-6 sm:px-10 lg:px-16 flex flex-col justify-between py-12 pointer-events-auto transition-all duration-75"
      >
        {/* Eyebrow */}
        <div className="pt-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#081C33]/70 backdrop-blur-md border border-white/15 text-xs font-mono-tech uppercase tracking-widest text-white/90">
            <span className="w-2 h-2 rounded-full bg-[#E31E24]" />
            MANIFESTO
          </div>
        </div>

        {/* Heading in Negative Space (Left Column) */}
        <div className="my-auto max-w-2xl lg:max-w-xl space-y-4 sm:space-y-6">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[76px] tracking-tight leading-[1.06] text-white drop-shadow-sm text-balance">
            Prima del volo, c’è un progetto.
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-white/90 font-light leading-relaxed font-sans max-w-lg">
            Soluzioni complete e personalizzate per eliporti, elisuperfici e vertiporti, dal progetto alla gestione.
          </p>

          <div className="pt-2">
            <a
              href="#m3"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('m3')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono-tech uppercase tracking-wider text-white/80 hover:text-white border-b border-white/40 hover:border-white pb-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              <span>Il nostro approccio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Scroll Cue */}
        <div className="flex items-center justify-between text-xs font-mono-tech text-white/70 border-t border-white/15 pt-5">
          <a
            href="#m2"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('m2')?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Scorri alla sezione successiva"
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
          >
            <span className="tracking-wider">Scorri per esplorare</span>
            <ArrowDown className="w-4 h-4 animate-bounce group-hover:translate-y-0.5 transition-transform" />
          </a>

          <div className="hidden sm:flex items-center gap-4 text-white/50 text-[11px]">
            <span>ELIPORTI • ELISUPERFICI • VERTIPORTI</span>
          </div>
        </div>
      </div>

      {/* Loading & Fallback Notice */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#081C33]/90 text-white font-mono-tech text-xs tracking-widest">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#0B4584] animate-ping" />
            <span>CARICAMENTO MODELLO 3D...</span>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute bottom-6 right-6 z-20 bg-[#E31E24]/20 border border-[#E31E24] px-4 py-2 text-white font-mono-tech text-xs">
          {loadError}
        </div>
      )}
    </div>
  );
};
