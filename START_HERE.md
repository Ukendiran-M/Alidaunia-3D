# ALIDAUNIA — start here

## 1. Open the updated project

1. Extract `Alidaunia-3D-main.zip`.
2. Open the extracted `Alidaunia-3D-main` folder.
3. Check that `package.json`, `src` and `public` are directly inside this folder.
4. Keep the entire `public` folder; it contains the helicopter, lighting and brand images.
5. No API key, database or paid 3D service is required by this demo.

## 2. Preview on your computer

1. Install Node.js 22.12 or newer from [nodejs.org](https://nodejs.org/).
2. Open the project folder in VS Code.
3. Select **Terminal → New Terminal**.
4. Run:

   ```sh
   npm ci
   npm run dev
   ```

5. Open the local URL printed in the terminal, normally `http://localhost:3000`.
6. Wait for the opening helicopter to appear.
7. Scroll slowly: assembled → separated components → reassembled → takeoff.
8. Scroll upward to reverse the sequence.
9. Open **Vision, Mission e Valori** in the header to preview page two.
10. Press **Ctrl+C** in the terminal to stop the preview.

## 3. Continue in Google AI Studio

1. Open the GitHub repository connected to your AI Studio project.
2. Select **Add file → Upload files**.
3. Upload the extracted project contents at the repository root, including `src`, `public`, `package.json` and `package-lock.json`.
4. Leave out `node_modules` and `dist` when uploading source.
5. Replace files with the updated versions; remove the old `bun.lock` if it remains in the repository.
6. Commit the upload.
7. Open the existing AI Studio project → **Settings → GitHub** → pull the repository changes.
8. If there is no connected repository, create one, upload the source, then use **Build → + → Import from GitHub**.
9. Wait for the preview to install dependencies and start.
10. Use this instruction for further edits:

   > Keep the supplied AW139 GLB, HDR lighting and existing scroll timeline. Preserve both pages and the approved Italian content. Make only the specific changes I request.

Official workflow: [Google AI Studio Build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode).

## 4. Show a client a hosted preview

1. Use the supplied `dist` folder for the version tested with this delivery.
2. If you change any source, rebuild it first:

   ```sh
   npm run build
   ```

3. For a manual static upload, open [Cloudflare Workers & Pages](https://dash.cloudflare.com/).
4. Choose **Create application → Get started → Drag and drop your files**.
5. Enter a project name and upload the **dist folder**, with its `index.html` at the upload root.
6. Select **Deploy site** and open the supplied `pages.dev` link.
7. Test both pages, including refreshing `/vision-mission-valori`.
8. Keep the visible **Crediti 3D** disclosure in the footer.

Official workflow: [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## 5. Edit the right file

| Change | File |
| --- | --- |
| Manifesto sections M2–M6 | `src/config/manifestoContent.ts`, `src/pages/ManifestoPage.tsx` |
| Vision, Mission and Values content | `src/config/visionContent.ts` |
| Opening headline and links | `src/components/HelicopterAssemblyHero.tsx` |
| Scroll timing and animation phases | `src/utils/helicopterPose.ts` |
| How far each component separates | `src/config/aw139Assembly.ts` |
| Camera, lighting, rendering and flight | `src/three/createAw139Stage.ts` |
| Asset paths | `src/config/assets.ts` |
| Responsive layout and typography | `src/index.css` |

## 6. Check before sharing changes

1. Run `npm run lint`.
2. Run `npm test`.
3. Run `npm run build`.
4. Run `npm run preview` and open the printed URL.
5. Check desktop, phone width, both routes and reverse scrolling.
6. Test the phone menu and the opening section links.
7. Keep `public/models/aw139-assembly.glb` and both HDR files at their existing paths.
8. Use an HTTP preview; opening `dist/index.html` by double-clicking will not load the app correctly.

## 7. Know the asset limits

1. The hero uses a real 3D mesh with 21 component groups, including five main rotor blades.
2. The fuselage and tail are one continuous source surface and stay joined.
3. The paint scheme is a blue/white/red concept, not an exact Alidaunia fleet replica.
4. This model has no photographic texture maps; HDR lighting improves its existing materials.
5. A higher-detail source model with separated airframe panels would be needed for a complete fuselage teardown or a closer photographic result.
6. Read `ASSET_CREDITS.md` before changing or redistributing the model.

