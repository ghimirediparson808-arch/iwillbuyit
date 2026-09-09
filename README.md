# I WILL BUY IT frontend

Reference-based T-shirt printing storefront and admin demonstration. Next.js App Router, React, TypeScript, local DM Serif Display and Manrope fonts. Supplied assets remain unchanged; runtime copies are under `public/assets/`.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build` then `npm start`. Development writes `.next/`; production writes `.next-production/`, so production builds do not overwrite the development cache.

Demo login: **admin@iwillbuyit.com** / **PrintWithPurpose**. This is a browser-only demonstration, not secure authentication. No server credentials, payment integration, real order fulfillment, or automatic customer messaging are implemented.

## Routes

| Page | Route |
| --- | --- |
| Landing | `/` |
| Catalogue | `/designs` |
| Product details | `/designs/[slug]`, e.g. `/designs/the-climb` |
| Custom request | `/customize` |
| Demo login | `/admin/login` |
| Dashboard | `/admin` |
| Create design | `/admin/designs/new` |
| Requests and orders | `/admin/requests`, `/admin/requests?tab=orders` |

The admin sidebar also has working design library, customers, inventory, analytics, settings, and search destinations. Draft designs can be previewed from the library and published into the public catalogue.

## Data and replaceable boundaries

- `services/repository.ts`: launch records, design overrides, drafts, requests/orders, inventory and brand contact settings. Ordinary records use the `iwbi-v1-` localStorage prefix. Dashboard totals, recent orders, status counts and sales series are calculated from repository request/order records; there is no aggregate baseline added to them. The repository supplies demo records when no local dataset exists. An explicitly stored empty dataset produces zero totals.
- `services/uploads.ts`: IndexedDB `iwbi-uploads`, file decoding, size/dimension/type checks, and transparency validation. Files are kept locally and object URLs are revoked by the asset hook. Uploaded files do not leave this browser.
- `services/auth.ts`: demonstrative local/session storage sign-in. A real backend must replace this with server-side authentication and authorization.
- `components/design-preview/Mockup.tsx`: uses supplied normalized placement data for approved product/model mockups and preserves original image ratios. New uploads use explicit ink variants: dark ink on Cream, light ink on Navy/Black. Legacy `lightShirtAsset`/`darkShirtAsset` names describe garment colour and remain unchanged for the seven official records. Colour, side, view, size and quantity are restored per design after reload.
- `components/site/HeroArtwork.tsx`: isolated responsive hero sources. Replace paths when the corrected transparent master/derivatives arrive, then rerun the landing comparisons.

The public catalogue starts with the seven official launch records. Search, categories, sorting, colour, size, side, quantity, product/model view, request submission, uploads, draft/publish, review status, quote/proposal, order conversion, workflow status, inventory and contact settings are functional.

“Send Proposal” saves a local proposal and prompts the operator to review/send through WhatsApp. WhatsApp links only prepare messages; they do not send automatically. No business number or Instagram account is invented. Add the actual destinations in admin Settings. Until then, customer WhatsApp links use the recipient picker.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm test
node qa/capture-pages.mjs
node qa/landing-viewports.mjs
python3 qa/compare.py
```

Browser tests require the app running on port 3000 and Playwright Chromium installed (`npx playwright install chromium`). Python comparisons require Pillow. Browser tests run in isolated browser contexts and do not overwrite an operator's stored data.

`qa/capture-pages.mjs` captures the exact 24 viewport dimensions recorded in `../REFERENCE_MAP.md`, checks images, overflow, console errors and HTTP failures. `qa/compare.py` writes QA-only side-by-side images with the reference on the left. These PNGs are ignored by Git and are never used as website backgrounds. `npm run format` formats application source.

## Uploaded artwork variants

`services/artwork.ts` resolves `artworkVariants.dark`, `.light`, `.original` and `.mode` from the saved design record. These are upload references resolved through IndexedDB; image bytes and alpha remain unchanged. Gallery/detail original panels use a separate Cream or Navy display surface for legibility. New uploads use normal blending with no inversion or recolouring.

Paired mode requires compatible ink for each enabled garment: dark-only publishes Cream; light-only publishes Navy/Black. The admin sees a warning and can upload the missing variant. Unavailable colours are omitted from public detail controls. Explicit original multicolour mode preserves one unchanged original across every chosen garment; the operator should review contrast in the previews.

## Visual approval status

The user approved the existing website overall and requested the focused correction pass documented in `qa/VISUAL_QA.md`. Responsive geometry, admin navigation, upload variants, selection persistence and data-derived dashboard values have been corrected without changing the design system or supplied artwork.

The earlier hero source mismatch remains explicitly unresolved: the supplied portrait has different facial geometry and an abruptly terminated right-edge hair boundary. The complete supplied image is fitted proportionally, with no CSS clipping of important details. `HeroArtwork` remains replaceable for the corrected transparent asset. This pass does not claim pixel-exact landing approval or silently accept a different drawing.

All eight page layouts were recaptured at the supplied desktop/tablet/mobile dimensions. Nine additional landing screenshots at 100% zoom and the paired-variant verification screenshots are in `qa/`. See the QA report for results, source constraints and the one-variant fallback.

Root continuity documents: `../AGENTS.md`, `../PROJECT_STATUS.md`, `../REFERENCE_MAP.md`.
