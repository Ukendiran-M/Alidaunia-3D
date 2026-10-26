# Manifesto M2–M6 — handoff checkpoint

**Branch and status**
- Branch: `feat/vision-journey`, local only; nothing pushed for this brief.
- Brief: `Alidaunia_Manifesto_M2_M6_Kit/CLAUDE_MANIFESTO_IMPLEMENTATION_BRIEF.md`.
- Checkpoint `c034f27` holds the approved page-two readability and spacing passes. The Manifesto work is uncommitted on top of it.

## Preserved

- **M1:** `HelicopterAssemblyHero.tsx`, `createAw139Stage.ts`, `helicopterPose.ts` and `index.css` are unchanged, as are its pin, takeoff and fallback.
- **Page two:** `VisionPage.tsx`, `src/vision/*` and `visionJourney.ts` are unchanged. The production build gives the same 11,629 px page height at 1440×900.
- **Shared parts:** Header, Footer (including the 3D credits) and navigation are unchanged.
- **Content:** it matches `reference/content-baseline.json` exactly; this was checked programmatically. The principles moved from JSX into `M6_PRINCIPLES` with identical text.

## What was built

**Assets**
- `public/manifesto-assets/` is the kit subtree, copied unchanged; the SHA-256 hashes match `asset-manifest.json`.
- At runtime only the GLBs, posters and the app's existing 1K HDR (`/environments/studio_small_09_1k.hdr`, the same file) are loaded.
- The loose maps, vectors and the duplicate HDR are editable sources only.

**Renderer: `src/manifesto/createManifestoRenderer.ts`**
- One offscreen WebGL renderer serves all of M2–M6.
- Each chapter has its own scene and a fixed orthographic composition camera; its direction comes from `asset-manifest.json`.
- The frame is fitted once per resize to the object's vertex silhouette over sampled poses, inside per-chapter insets. The camera never moves with scroll.
- A chapter draws on demand into the corner of the GL buffer, and the pixels are copied into that chapter's in-flow 2D canvas. Only visible chapters draw, and there is no render loop.
- Shaders are precompiled with `compileAsync` after the HDR loads.
- On a lost WebGL context, every chapter switches to its poster.
- On unmount it disposes its own geometry, materials, maps, PMREM and renderer. M1's resources are never touched.

**Controller: `src/manifesto/manifestoAssetController.ts`**
- The kit controller, typed. It evaluates the paused clip at an absolute time and runs M5's draw-range route tracing.

**Choreography: `src/utils/manifestoChoreography.ts`** (pure)
- Mark parsing (`track:value@line[/edge][+gap]`), tracks built from measured positions, and the inverse mapping.
- The single follow policy: rate 11, with a snap above 1.2 views, so anchors and history never play intermediate chapters.
- The kit's `getTransitionState`.
- The four cue stage functions, the airflow path and the iris cover radius.

**Hook: `src/manifesto/useManifestoChoreography.ts`**
- Measures marks on mount, after fonts load, on resize and on content resize. Positions are relative to the wrapper, so M1's pin spacer does not invalidate them.
- Loads chapters lazily (IntersectionObserver, one view of margin).
- Applies the boundary visuals, the cues, the M4 iris and the M5 labels.
- Honours the fragment on a fresh entry.
- Dev-only: `window.__manifesto` and the `?reduced-motion` / `?fallback` switches.

**Page and styles:** `src/pages/ManifestoPage.tsx` and `src/manifesto/manifesto.css`, all scoped under `.mf`.

| Chapter | Layout | Object motion (from measured content) |
|---|---|---|
| M2 navy | Sticky wide drafting stage; copy column on the left (4 paragraphs + 5 systems) | Unrolls as the stage enters; each system lands as its item enters view; settled composition holds before the stage releases |
| M3 off-white | Sticky ¾ site on the left; 2 paragraphs + 4 full phase blocks on the right | Phase marks at clip values 0 / .20 / .42 / .77; the inspection sweep ends as Gestione is fully on screen |
| M4 navy | Large type on the left, tall instrument on the right (in flow) | Extends, aligns and settles between the instrument entering and being centred |
| M5 off-white | Split head; wide atlas with projected node labels; 6-node list | Unfold, node rise, route trace and a single packet pass while the atlas crosses the view |
| M6 white | Copy plus upright mark; 3 principles; actions | Registration complete when the mark is centred; then still |

**Boundary cues**
1. **M2→M3, datum:** a line drops from the folio's near corner, becomes M3's survey rule, three datum crosses appear, then a red register mark. The rule stays.
2. **M3→M4, lens:** the line runs along the boundary to a green lens placed under M3's front perimeter light. The iris then opens M4's navy from that point. The instrument shares the iris; the copy never does. An off-white rule remains.
3. **M4→M5, airflow:** a curve leaves the settled windsock tail downwind, turns, and lands on M5's connection mark (red→blue), then clears.
4. **M5→M6, registration:** datum lines (kept out of M6's copy column), corner guides and a red cross register around the incoming mark, then clear. The atlas lifts and recedes, never below 30 % opacity.

There are no spacer elements, and the M6 actions are followed by normal section padding before the footer: 56–97 px depending on the viewport.

## Checks actually run

**Commands**
- `npm run lint`: clean.
- `npm test`: 63/63 pass. That is 40 earlier tests plus 23 new ones:
  - choreography and boundary maths;
  - content retention;
  - all five real GLBs through the integrated controller: reversibility, reduced-motion settle, named parts, no cameras, M5 route tracing and node labels.
- `npm run build`: passes, with the same pre-existing >500 kB chunk advisory.

**Browser** (Chrome through the extension; the window reports 2560×1357, so exact sizes were tested in same-origin iframes; dev :3000 and `vite preview` :4173)
- 1440×900, every object at several progress values, from screenshots:
  - M2: 0.2 / 0.5 / 0.97;
  - M3: 0.1 / 0.3 / 0.6 / 1;
  - M4: 0.5 / 1;
  - M5: 0.3 / 0.65 / 1;
  - M6: 0.5 / 1.
- Every handoff, before, during and after:
  - datum at 0.35 / 0.7 / 1;
  - lens at 0.3 / 0.55 / 1, including the iris clip;
  - airflow at 0.3 / 0.5 / 0.8;
  - registration at 0.5 / 0.7.
- 390×844: M2, M3 (sticky object with the copy passing beneath), M4, M5 and M6. 1024×768: M2 kept clear of the copy column.
- Layout scan at 1440×900, 1920×1080, 1366×768, 1024×768, 844×390 and 390×844:
  - no horizontal overflow;
  - every track is ordered;
  - actions-to-footer gap of 56–97 px.
- Direct `#m3` and `#m5` at 1440×900, and `#m6` at 390×844: each lands 20 px below the header, only the nearby objects load, and the earlier chapters do not play.
- Route changes:
  - The Vision button leads to page two, where only its own canvas remains and the hook is gone.
  - Back restores the Manifesto at the stored scroll; Forward and Back were repeated.
- `?reduced-motion`: completed still poses, full navy, no iris or moving cues.
- `?fallback`: the posters blend into their sections, and all copy is present.
- No console errors or warnings over a full forward/back pass.
- No main-thread long task over 80 ms while all five objects loaded.
- Production: there are no dev hooks, and a `#m3` entry fetched only the M3 GLB, the shared HDR and the nearby posters.
- Page two in production: world ready, one canvas, height unchanged.

**Not verified**
- No physical devices, Safari or Firefox.
- No FPS measurement: rAF in the automation browser is throttled.
- The `+gap` floors and the follow policy are covered by unit tests, not by a frame-accurate in-browser replay.
- Screenshot capture in this tooling often timed out while WebGL objects were compiling or loading. This also happened on the unchanged M1 hero, so it is not attributed to this change, but it was not proven either way.

## Open items / notes

- **Retired UI chrome.** These strings belonged to the replaced widgets: "Seleziona i livelli per visualizzare la coesione tecnica", "LIVELLO ATTIVO // 0x", "LIV. 0x", "MODELLO MULTILIVELLO" and the photo caption "OPERAZIONI AERONAUTICHE DI TERRA // COORDINAMENTO SUL CAMPO". The M4 reference photograph is no longer shown.
- **Kept labels.** "SCHEMA ILLUSTRATIVO", "MODELLO ILLUSTRATIVO", "CICLO INTEGRATO", "TOPOLOGIA DI RETE…", "HUB CENTRALE: FOGGIA", "FASE 0x", "PRINCIPIO 0x" and the action block are kept.
- **New strings.** The visuals' aria-labels and the caption "NON GEOREFERENZIATO" are new short Italian texts.
- **Phone labels.** On phones the M5 node labels show numbers only, matched to the numbered list. They cluster around Tremiti, Peschici and Vieste.
- **Airflow line.** On desktop it passes behind M4's paragraphs on its way to M5; it sits below the text layer.
- **Short landscape (844×390).** It uses the desktop stage with a 245 px object.

## Centred composition and editorial text pass (`Alidaunia_Manifesto_Text_And_Centering.md`, uncommitted)

**Composition (all chapters):** centred heading and subtitle → object on the section axis → organised copy below. No side columns remain; the `avoid` insets and the side-column CSS are removed.
- **Framing** (`createManifestoRenderer.ts`): horizontally, the frame is centred on the *settled* silhouette with room on both sides for the whole motion envelope; vertically, the envelope itself is fitted. It is computed once per resize, never per frame. Sampled envelopes now include p = 0 for M2, M5 and M6. GLB animated nodes are untouched; the clips and controller are unchanged.
- **M2/M3 stages:** the centred figure is sticky and opaque only within its own content interval, and the copy passes beneath it (never across it). The figure releases before the next chapter.
  - Short screens (≥768 px wide, ≤700 px tall) run in normal flow, using `data-mf-flow` marks on the figure.
  - Phones keep the sticky top figure.
- **M2:** four paragraphs in a two-column band, then a 3 + 2 open system matrix. Each system's rule accents red while its drawing group registers (read-only sync with the clip windows), then keeps a quiet trace. The final M2 rule is where the datum line now starts.
- **M3:** phase rail inside the figure (decorative, `aria-hidden`) plus four full phase rows; the active phase badge fills and its title settles. Both follow the model progress in either direction.
- **M4:** tall instrument centred; two paragraphs in a band; a directional rule. The airflow cue now runs down the gutter beside the paragraph band, never across it.
- **M5:** centred atlas; projected labels on desktop only (Foggia's to the left, San Giovanni's below-right, checked for no collisions at 1440); a 3×2 caption grid whose leaders draw as each node rises; then the paragraph band.
- **M6:** centred heading on a red/blue register baseline, a modest mark, a centred reading column, open three-column principles, and centred actions (never animated).

**Text motion** (`src/manifesto/useManifestoReveals.ts`, GSAP, scoped context):
- The motifs: M2 datum rule plus heading lines rising through a mask with a 6° tilt; M3 plane settle plus phase line; M4 word pairs travelling left-to-right with slight depth; M5 connection underline; M6 register baseline.
- Paragraphs get short block reveals, and principle heads stagger.
- Text is visible by default. Only groups still below the view are hidden, and each plays once (0.36–0.66 s). Inline transforms and masks are cleared afterwards.
- Jumps and restored positions show content at once. Groups skipped over by a jump are settled by a scroll sweep; an IntersectionObserver alone misses them.
- Reduced motion does nothing.
- Heading words are React-rendered inline boxes. Lines are grouped at play time, so there are no persistent wrappers to rebuild.

**Checks run**
- `npm run lint` clean; `npm test` 65/65 pass (63 + 2 new: reveal kinds and never-animated actions; sync windows in clip order); `npm run build` passes.

**Browser** (dev, same-origin iframes)
- 1440×900:
  - M2: entrance, 0.15, 0.43, 0.6, 0.98;
  - datum handoff at 0.8 and 1;
  - M3: 0.3, 0.95;
  - lens at 0.6;
  - M4: 0.6, plus airflow at about 0.5;
  - M5: 0.55, 1, including label collisions;
  - registration at 0.6;
  - M6: 1, principles, actions, footer.
- 390×844: M2, M3, M5.
- 844×390: flow mode, M2/M3 tracks.
- Layout scan at 1920×1080, 1366×768, 1024×768 and 390×844: all nine tracks ordered, no horizontal overflow, actions-to-footer 52–97 px.
- Direct `#m3` and `#m5`: land 20 px below the header with text complete. `?reduced-motion#m4`: no hidden states.
- Jump to the bottom and then reverse scroll in 600 px steps: no pending (hidden) text group in view at any step.
- Route to Vision and back: one canvas on page two; on return, M5 labels and states are correct and there are no console errors.

**Issues found and fixed during inspection**
- The M2 frame was too small (symmetric vertical fit).
- Projected M5 labels collided.
- Rail labels overflowed on phones.
- Short-screen M2/M3 tracks were missing: marks set only through `data-mf-flow` were never collected.
- Groups jumped over stayed hidden.

**Remaining notes**
- M2's five systems now register over about 465 px at 1440×900 (about 570 px at 1920×1080), against about 625 px in the approved side-column version. The matrix rows are closer together than the old list.
- M5 keeps a band above the settled atlas: it is the reserved space for the leaves while they unfold, as the brief asks.
- In this automation browser, rAF is throttled, so text entrances appear slow and screenshot capture sometimes timed out. Real timing is 0.36–0.66 s; FPS was not measured.

## Responsive audit and fixes (both routes, uncommitted)

**Environment:** Chrome desktop through the Claude extension, with the dev server on :3000. Every viewport was emulated with a same-origin iframe of that exact CSS size at DPR 1. This is desktop emulation, not real devices: no touch hardware, no mobile browser-bar resizing, no Safari or Firefox, and no OS reduced-motion emulation for M1. The automated audit script was served temporarily from `public/__audit/` and has been removed.

**Matrix** (automated layout checks on both routes): 320×568, 360×800, 390×844, 430×932, 844×390, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1440×900, 1920×1080, 2560×1440, 3440×1440 and 3840×2160.
- Breakpoint edges: 639/640, 767/768, 1023, plus heights 600/601, 700/701 and 761.
- Zoom and text size: 200% zoom emulated as 720×450 and 640×360; enlarged text with a root font size of 24 px and 32 px.
- Each run checked:
  - document overflow;
  - text outside the viewport and text content spilling its box;
  - overlapping text blocks and clipped headings;
  - text under 12 px, narrow long paragraphs, touch targets under 44 px;
  - canvas buffer size against CSS size;
  - ordering of every scroll track and mark;
  - header height, and the gap between the last content and the footer.

**Visual inspection**
- Screenshots: 320×568 (header, menu, M1, M2, M3, M5, M6, page two V1/V4); 844×390 (M1, M2, M4); 768×1024, 1024×768 and 1280×720 (M1, page two); 3440×1440 (M1, page two V1/V2); 1440×900 (page-two ending and footer).
- Interactive checks: keyboard Tab order and focus rings on M1, keyboard activation of the M1→M3 anchor (lands 20 px under the header), mobile menu open/focus/Escape, and continuous resizing while mid-page on both routes.
- Scroll sweeps: slow (120 px steps), fast (1400 px) and reverse on the Manifesto at 1440×900 and 390×844; page two at 1440×900, 390×844 and 844×390.
- Fallback and reduced motion: `?fallback` and `?reduced-motion` on both routes.

**Issues found → fixed**
1. **Header overlap at 320–359 px.** The Contatti button covered the "ALIDAUNIA SERVICES" wordmark. The logo link no longer shrinks, and below 375 px the bar keeps logo plus menu; Contatti still leads the menu.
2. **Mobile menu.** It pushed the page down about 160 px, which also shifted M1's pin. It had no focus handling and no Escape. It now overlays the page (absolute, scrollable), moves focus to the first item, closes on Escape with focus returned to the toggle, closes when the viewport widens past mobile, and has `aria-controls`.
3. **Header sizing with enlarged text.** The header grew past the px offset used by sticky stages and pins, and its controls overflowed at 390 px. The bar, lockup and mobile controls are now sized in px (80/96 + 1), matching `--site-header-height`.
4. **Touch targets.** Header, nav and contact controls, footer nav, alidaunia.it, Crediti 3D and Contatta Alidaunia are now at least 44 px. M1's "Il nostro approccio" and "Scorri per esplorare", and page two's "V2: Valore nel Tempo", keep their look but get an invisible 44 px hit area. Credit links inside running text are left as they are (WCAG inline exception).
5. **Small text.** M1's eyebrow, approach and scroll labels were 10–11 px; the M1 status text was 10 px; the sectors label was 9 px; figure captions were 11 px. They are now 12 px (sectors 11 px); the header "SERVICES" is now 11/12 px.
6. **Enlarged text.** M1, M2–M6 and page-two font sizes are now rem (identical at 16 px), and headings wrap or hyphenate long Italian words. At 24 px root text both routes are clean at 1440 and 390. At 32 px the footer's contact column still overflows at 1440 (by 47 px).
7. **M1 short landscape** (844×390, and any width of 640 px or more at a height of 600 px or less). The paragraph ran across the rotor and tail. The canvas now starts at 38% width, so the aircraft frames beside the copy.
8. **Page two on ultra-wide** (aspect ratio of 2.1 or more, width of 1800 px or more). The copy stayed in a centred 1376 px frame, under the tail boom. The frame now widens to 78vw there.
9. **Reading position lost on resize or rotation.** On the Manifesto, M1's pin length scales with the viewport; on page two the passages are sized in viewport units. In both cases a reader in M3 or V4 landed in another section. Both scroll hooks now keep the place as a fraction of the section (or passage) in view and restore it after the layout events that follow a resize. Verified to within 0.001 of the section across 1100×760 → 390×844 → 844×390 → 1440×900. Restoring 1440×900 returns M3 exactly to 0.60.
10. **Page-two backdrop box.** The sticky backdrop's negative margin let it run about 760 px under the footer after the route ended (painted beneath the footer, so not visible). `.vj` now clips on both axes with `overflow: clip`, and sticky still works.
11. **Very short phones** (height of 620 px or less). The sticky M2/M3 figures left about 230 px of reading room, so those stages now run in normal flow (figures sized `min(62svh, 78vw)`). On phones, figure captions sit under the object instead of over its lower edge.
12. **Footer.**
    - At 768–1023 px the brand column was 266 px wide; it now spans the full row, with nav and contact below.
    - The "SERVICES" contrast (brand blue on navy, about 1.8:1) is now a light blue.
    - Focus is shown in white on the navy footer.
13. **Keyboard.** Added a "Vai al contenuto" skip link to `#main-content`.
14. **Very large canvases** (4K at 1×, ultra-wide). M1 and page two now cap their drawing buffer at about 6 MP (pixel ratio no lower than 0.8). Aspect ratio and framing are unchanged.

**Confirmed without change**
- No horizontal document overflow anywhere in the matrix.
- Canvas buffers always match CSS size × pixel ratio after continuous resizing.
- Tracks and marks stay ordered at every size, with no pending (hidden) text in the reading area during any sweep.
- Sticky figures always release inside their own section.
- The page-two backdrop stays under the header while the route is in view.
- Fallback posters and reduced-motion stills keep all text and actions.
- Actions-to-footer spacing on both routes is 40–104 px.

**Changed files in this pass:** `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/index.css` (M1 and global focus/skip link), `src/three/createAw139Stage.ts` (pixel budget only), `src/vision/visionJourney.css`, `src/vision/useVisionJourney.ts`, `src/vision/createVisionWorld.ts` (pixel budget only), `src/manifesto/manifesto.css`, `src/manifesto/useManifestoChoreography.ts`.

**Checks:** `npm run lint` (tsc) clean; `npm test` 65/65; `npm run build` passes, with the same pre-existing >500 kB chunk advisory.

**Not verified**
- Real phones and tablets, touch scrolling, mobile browser-bar resizing, Safari and Firefox.
- OS-level reduced motion for M1 (only the dev switches were exercised).
- Actual Chrome font-size settings: the root font size was set directly.
- Frame rate, because rAF is throttled in this automation browser.
