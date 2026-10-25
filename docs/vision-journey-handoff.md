# Vision journey — handoff checkpoint

Branch: `feat/vision-journey` (local; not pushed).

- **Current brief:** `Alidaunia_Brand_Helicopter_Refinement.md`, which supersedes the scene subjects of `Alidaunia_Claude_Vision_Kit/CLAUDE_VISION_REDESIGN_BRIEF.md`.
- **Checkpoint commit `c3ebd95`:** the previous material-gallery journey, kept for comparison. The aviation refinement is uncommitted on top of it.

## State

The aviation refinement is implemented for `/vision-mission-valori`. It keeps the route-scoped sticky renderer, the scroll-derived journey `s ∈ [0, 6]`, the single smoothing/snap policy and the semantic HTML flow.

The world is one conceptual operating base: a hangar with the parked AW139, its apron edge, and a two-storey glazed annex with the planning studio upstairs and the briefing room below.

The Manifesto is untouched: `ManifestoPage.tsx`, `manifestoContent.ts`, `visionContent.ts`, Header, Footer, Hero, `createAw139Stage.ts`, `index.css` and `ASSET_CREDITS.md` are byte-identical to the original baseline.

| s | Subject | Transition out |
| --- | --- | --- |
| 0–1 | AW139 three-quarter view in the branded hangar; lateral dolly with slight pullback | tracked door leaf slides across the sightline (0.845–1.0) |
| 1–2 | Apron edge: slab joints, slot drain, draw-pit + conduit trench, elevated edge light switches on | along the service line, up the annex stair, through the door jamb |
| 2–3 | Planning studio: drafting board with the layout of this base, developing with the 3 Mission groups | round the studio's end jamb; rotor seen through glazing, then in the open |
| 3–4 | Rotor head and upper airframe; ~31° arc around the hub | turn onto blade 01, drop beneath it towards the briefing room door |
| 4–5 | Briefing room: branded dossier; Cliente/Progetto/Gestione sheets slide into alignment | out through the glazed front door into daylight |
| 5–6 | Apron view back to the open hangar, sign and the same parked aircraft; holds still | ordinary flow to the footer |

## Files

- `src/utils/visionJourney.ts`: layout, AW139 reference geometry, camera keys (desktop plus damped mobile), scroll mapping, smoothing, authored states (door, light, drawing, dossier), atmosphere and sun.
- `src/utils/visionJourney.test.ts`: covers
  - continuity and C1 at the chapter boundaries;
  - clearance from the airframe, tail and all five blades, plus walls/glazing/doors, the slab, furniture and the stand (desktop and mobile);
  - the door wipe timing, the V4 arc, the pass under the blade;
  - reduced-motion stills and state completion.
- `src/utils/visionContent.test.ts`: copy and actions preserved, retired builders gone, fallback posters present.
- `src/vision/createVisionWorld.ts`: renderer, sky, sun shadows, HDR, readiness gating (maps, HDR, aircraft, artwork), on-demand loop, disposal, dev hooks.
- `src/vision/artwork.ts`: canvas artwork using the real logo SVG and site fonts — signs, plan drawing layers, reference/handover sheets, dossier, glass manifestation, apron concrete, grating.
- `src/vision/zones/{hangar,apron,annex,studio,briefing,aircraft}.ts`: the base.
- `src/vision/materials.ts`, `geometry.ts`, `useVisionJourney.ts`, `visionJourney.css`, `src/pages/VisionPage.tsx` (the V2 copy tone is now light).
- `public/vision/posters/v1–v6.webp`: still frames rendered from the scene at the reduced-motion poses. They are used while loading, without WebGL, or if the aircraft fails to load.

## Asset use

- **AW139:** `HERO_ASSETS.model`, loaded as this route's own instance with cloned materials. Glazing is changed to opaque tint, so there is no transmission pass; paint gets a clearcoat. Rotor stopped, assembled, grounded; credits unchanged in the footer.
- **Logo:** `/brand/alidaunia-logo.svg`, drawn at its true proportions.
- **Maps:** only `metal` and `ceramic` from the kit are loaded. The other kit families remain in `public/materials` but are unused.
- **HDR:** 1K studio HDR, shared with the Manifesto.

## Commands run (latest)

`npm run lint` (clean), `npm test` (39/39), `npm run build` (passes; the same pre-existing >500 kB shared Three.js chunk advisory).

## Browser checks (Chrome via the Claude extension, dev :3000 and `vite preview` :4173; window reported 2560×1357 CSS px)

- Desktop V1–V6 and each transition were inspected frame by frame: V1→V2 0.85/0.875/0.90/1.0; V2→V3 1.82/1.94/2.03; V3→V4 2.8/2.92; V4→V5 3.72/3.8/3.86; V5→V6 4.75/4.82/4.93.
- Landing on `#v4`/`#v5` reconstructs the state; anchor links cut without a fly-through; browser scroll restoration rebuilds the state.
- Route to the Manifesto and back, and Back/Forward: exactly one canvas, and the Manifesto aircraft renders.
- 390×844 and 844×390 (iframes): no horizontal overflow, copy complete.
- `?reduced-motion` (dev switch): discrete completed stills only. `?fallback` (dev switch): poster fallback with no canvas.
- No console warnings or errors over a full journey. Production: no dev hooks; only the V1 poster is fetched once the world is live.

## Known issues / next actions

- The source rotor hub is simple (cone and plates), so V4 is framed as rotor plus upper airframe rather than a macro close-up.
- On a portrait phone, the V6 enquiry card covers part of the aircraft until the reader continues scrolling.
- V4 copy partially overlaps blades and the tail boom. It is readable through the shading, but a cleaner background could be found with a different side of the aircraft.
- Not tested on physical devices, Safari or Firefox; no FPS measurement. Desktop draw calls are about 250–390 per frame including shadow passes.
- First-load payload for page two is about 1.8 MB GLB + 1.6 MB HDR + 2.3 MB maps + 56 KB poster; the GLB and HDR are shared with, and cached from, the Manifesto.
- Dev-only hooks: `window.__visionJourney.scrollFor(s)`, `window.__visionWorld.info()/capture()`, `?reduced-motion`, `?fallback`.
