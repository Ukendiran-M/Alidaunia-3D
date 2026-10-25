# Delivery verification

Checked on 25 October 2026 against the bundled production build.

- TypeScript: `npm run lint` passes.
- Unit tests: `npm test` passes all 14 tests, covering navigation, the assembly timeline, reverse poses, component identity and ground clearance.
- Production: `npm run build` passes. The larger lazy-loaded Three.js chunk produces Vite's standard size advisory.
- Desktop browser: 1440 × 1000, one scene and one pin; explode, reassemble, departure and reverse scroll pass.
- Mobile browser: 390 × 844, one scene and one pin; no horizontal overflow; mobile menu and route return pass.
- Landscape browser: 844 × 390, stage fits the viewport and the exploded pose remains visible.
- Section link: M3 lands below the sticky header.
- Route navigation and browser Back: canvas and hero pin spacing are removed/recreated without duplicates.
- Slow loading: leaving Manifesto during a delayed model request does not recreate the old scene.
- Reduced motion: assembled model, no pinned scroll sequence, progress stays at zero.
- Simulated model failure: static image fallback loads, hero pin is removed, navigation remains usable.
- Credits: footer disclosure and linked model attribution are accessible.
- No browser JavaScript errors or unexpected failed local assets in these checks. The model 404 in `BROWSER_CHECKS.json` is intentionally injected for the fallback test.
- The original `manifestoContent.ts` and `visionContent.ts` are preserved byte for byte.

`BROWSER_CHECKS.json` contains the recorded browser results. Screenshots were reviewed during development and are not part of this source archive. Browser results cover Chromium at the listed sizes; physical iOS/Safari device testing has not been performed.

## Integration notes

- The 1.8 MB compressed GLB is decoded using the Three.js meshopt decoder.
- Desktop uses the supplied 2K HDR; phone widths use the 1K derivative.
- Fonts and brand imagery are bundled locally.
- The Three.js scene loads only on Manifesto and renders on demand.
- Model and HDR failures are handled separately; scene lights remain available if the environment fails.
- GSAP cleanup is scoped to each page instead of killing unrelated triggers globally.
- The old generic helicopter and generator are superseded by the prepared AW139 asset.
- Use npm and the supplied lockfile; the exported project's esbuild/Vite dependency conflict has been resolved.
- Other static hosts need an SPA rewrite to `index.html` for the `/vision-mission-valori` route.

