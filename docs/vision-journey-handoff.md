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

## Readability and ending pass (`Alidaunia_Readability_Footer_Fix.md`, uncommitted on top of `4659e1b`)

- **Typography:**
  - Long body copy is 17 px on phones, 18.2 px on a 1440 laptop and 19.5 px wide, at weight 450 and line-height 1.62–1.65.
  - Mission and value descriptions are 17–18.5 px.
  - All text colours are solid, with no opacity-faded body copy; labels are 12.5–13 px.
  - V1's body is one column so it stays inside the reading band.
- **Contrast support:** the per-block radial "halos" are replaced by one feathered, full-bleed tonal band per chapter frame (`.vj-frame::before`):
  - it sits on the copy side only (`.vj-frame--right` for V2/V4) and covers the full width on phones;
  - it is masked top and bottom, and absent over the scenic transition intervals.
- **Ending:** the excess height was `.vj-chapter--last .vj-frame { padding-bottom: 80svh }`; there is no pin or ScrollTrigger on page two.
  - It is replaced by `clamp(48px, 6vh, 72px)`, or 40 px on phones.
  - The V6 settle mark is now the end of the contact panel at 0.92 of the visible height. `resolveMarks` keeps a 0.25-view minimum camera range and caps the mark at the maximum scroll.
  - Gap from the end of the contact panel to the footer, before → after: 1920×1080 865 → 66 px; 1440×900 721 → 55; 390×844 676 → 41; 844×390 313 → 49.
- **Fragment entry:** on a fresh page load, the fragment (e.g. `#v6`) is now honoured after React renders the sections. Previously it stayed at the top; my earlier `#v4`/`#v5` checks were same-document navigations, which did work.
- **Contrast measurement:**
  - Method: the actual WebGL frame is rendered behind each visible text element, composited with the band as defined in CSS, then the WCAG ratio is computed against the computed text colour. The CSS-defined band is approximated analytically, not screen-captured.
  - 1440×900: 33 frames across V1–V6, including all transition midpoints. All passed after the V1 correction; the minimum was 4.91:1 (a V4 focus line).
  - 390×844: 12 frames, all passed, minimum 6.24:1.
  - Not every animated frame was measured.

## Spacing pass (uncommitted, on top of the readability pass)

**Source of the empty scrolling.** Every transition used the same 95svh `.vj-passage` spacer, which with the 0.35 start line came to 1136 px at 1440×900. The next chapter only began when its top reached the header. Together with the frame padding, that left 228–237 px with no text on screen at every boundary. Inside chapters, the V3 group and V4 value gaps (30vh/24vh) and the V2/V5 follow-on margin (16vh) left gaps of up to 270 px.

**Changes:**
- **Transition length per boundary.** Each length is set in visible heights and scaled to that boundary's camera work (`TRANSITION_LENGTH` in `VisionPage.tsx`: 0.85 / 0.90 / 0.72 / 0.78 / 0.92). The spacer is `calc(var(--vj-view) * var(--vj-passage))`, multiplied by 0.88 on phones, with a 300 px floor for very short screens.
- **Incoming chapters** begin when their top reaches 28% of the view (`data-journey-line` on the sections), so each heading rises in during the handoff.
- **Frame padding** is `clamp(40px, 7vh, 88px)` top and `clamp(32px, 5vh, 64px)` bottom. The V3/V4 group gaps are `clamp(56px, 9vh, 112px)` (64 px on phones), and the follow-on margin is `clamp(48px, 7vh, 96px)`. Reduced motion uses a 0.3-view spacer.
- **Local retiming.** Camera key times inside V2→V3, V3→V4, V4→V5 and V5→V6 are rebalanced by segment distance and turn; poses are unchanged. V1→V2 keeps its door choreography. V6 keeps its contact-panel settle point.

**Measured result (scanner over the real DOM):**

| Size | Before | After |
|---|---|---|
| 1440×900 page height | 14,457 px | 11,629 px |
| 1440×900 transitions | 1136 px each | 683 / 723 / 578 / 626 / 739 px |
| 1440×900 text-free scroll | 228–237 px per boundary | 0 at every boundary |
| 1440×900 largest inner gap | 270 px | 86 px |
| 390×844 transitions | 858 px each | 490–624 px, with no text-free scroll |
| 1920×1080 text-free scroll | not measured | 0 |
| 844×390 | not measured | 321 px transitions (the floor), 84–116 px text-free per boundary |

**Smoothness.** The automated browser ran at about 1.5 fps, so I replayed slow (300 px/s), fast (3000 px/s) and reverse scrolling at 60 fps through `scrollToJourney` → `stepJourney` → `sampleCamera`, using the page's measured marks.
- Fast scrolling never triggers the anchor-jump snap, and the camera settles about 1.0–1.1 s after the scroll stops.
- Reverse scrolling returns exactly to the same state.
- Slow-scroll peak camera speed at 1440×900, original → now: V1→V2 9.5 → 15.8 m/s, V2→V3 7.7 → 15.9 m/s at 0.82 (≈14.5 at the final 0.90, estimated by scaling, not replayed), V3→V4 13.2 → 14.2, V4→V5 12.1 → 12.2, V5→V6 12.0 → 18.9.

## Known issues / next actions

- The source rotor hub is simple (cone and plates), so V4 is framed as rotor plus upper airframe rather than a macro close-up.
- On a portrait phone, the V6 enquiry card covers part of the aircraft until the reader continues scrolling.
- V4 copy partially overlaps blades and the tail boom. It is readable through the shading, but a cleaner background could be found with a different side of the aircraft.
- Not tested on physical devices, Safari or Firefox; no FPS measurement. Desktop draw calls are about 250–390 per frame including shadow passes.
- First-load payload for page two is about 1.8 MB GLB + 1.6 MB HDR + 2.3 MB maps + 56 KB poster; the GLB and HDR are shared with, and cached from, the Manifesto.
- Dev-only hooks: `window.__visionJourney.scrollFor(s)`, `window.__visionWorld.info()/capture()`, `?reduced-motion`, `?fallback`.
