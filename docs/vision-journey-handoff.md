# Vision journey — handoff checkpoint

Branch: `feat/vision-journey` (local, uncommitted). Brief: `Alidaunia_Claude_Vision_Kit/CLAUDE_VISION_REDESIGN_BRIEF.md`.

## State

Passes A–D are implemented for `/vision-mission-valori`. There is one route-scoped sticky WebGL backdrop with six connected environments and the semantic HTML in normal flow. The Manifesto is untouched (byte-identical: `ManifestoPage.tsx`, `manifestoContent.ts`, `visionContent.ts`, Header, Footer, Hero, `createAw139Stage.ts`, `index.css`).

| s range | Environment | Transition out |
| --- | --- | --- |
| 0–1 | V1 painted-steel hangar, anodised cladding, roof apertures | aluminium rib occlusion wipe (s 0.85–0.97) |
| 1–2 | V2 board-formed concrete wall, deep joint, daylight band | round the wall end, parallax reveal through the opening |
| 2–3 | V3 seven frosted thresholds 3+2+2 | frosted screen fills view, slip past the polished edge |
| 3–4 | V4 folded carbon vault, titanium seam/hinges, four folds | pleated end diaphragm opens outwards |
| 4–5 | V5 ivory membrane on three masts, blue edge ropes | far edge lifts upwards, shadow travels ahead |
| 5–6 | V6 concave glazed-ceramic wall opening to the horizon | still composition, then the footer |

## Files

- `src/utils/visionJourney.ts`: pure state (layout, camera keys, monotone C1 interpolation, scroll→journey mapping, smoothing/snap policy, fold/tension state, atmosphere, sun).
- `src/utils/visionJourney.test.ts`: continuity, C1 at boundaries, collision clearance, zone overlap, snap, reduced motion, fold ordering.
- `src/utils/visionContent.test.ts`: content and action retention, retired concepts absent.
- `src/vision/createVisionWorld.ts`: renderer, sky/fog, sun shadow, HDR, render-on-demand, visibility, disposal.
- `src/vision/materials.ts`: map loading/cache (placeholder → image, no recompiles), tile and cookie textures.
- `src/vision/geometry.ts`: helpers plus the `Zone` contract.
- `src/vision/zones/{hangar,gallery,glazing,vault,canopy,horizon}.ts`: the six environment builders.
- `src/vision/useVisionJourney.ts`: DOM marks (`data-journey-mark` / `data-journey-line`), scroll listener, world lifecycle.
- `src/vision/visionJourney.css`, `src/pages/VisionPage.tsx`: layout and content.
- `public/materials/vision-journey/`: copied from the kit; all 20 SHA-256 values match the manifest.

## Commands run

`npm run lint`, `npm test` (31/31), `npm run build`. Browser checks used Chrome via the Claude extension, against the dev server at :3000 and `vite preview` at :4173.

## Dev-only inspection hooks (absent in production builds)

- `window.__visionJourney.scrollFor(s)` returns the document scroll position for journey `s`.
- `window.__visionWorld.info()` returns draw calls, triangles, programs and the current journey value.
- `?reduced-motion` forces the still-composition path.

## Known issues / next actions

- Mobile uses the same camera path (with a wider vertical FOV and no lens shift), not a shortened one.
- On phones there are no shadows, no transmission and pixel ratio is capped at 1.25. Not tested on physical devices or Safari.
- The membrane's shadow crossing the V6 wall is subtle: the lift completes quickly (s 4.68–5.0). Consider a longer lift, or a lower sun at s≈4.8.
- The V4 carbon weave reads mostly as glossy dark composite at viewing distance. The tile size (0.42 m) could be tuned against the brief's "small scale".
- First-frame payload is about 4.7 MB of maps plus the 1.6 MB HDR. The supplied normal-map PNGs dominate; converting them to compressed KTX2 would cut this.
- Draw calls observed (desktop): roughly 25 in V1, 110 in V3 (multi-material fins), 15–40 in V4, 27 in V6.
