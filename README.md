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

- `services/repository.ts`: launch records, design overrides, drafts, requests/orders, inventory and brand contact settings. Ordinary records use the `iwbi-v1-` localStorage prefix. Seeded dashboard statistics are a launch snapshot; newly created orders add to that baseline.
- `services/uploads.ts`: IndexedDB `iwbi-uploads`, file decoding, size/dimension/type checks, and transparency validation. Files are kept locally and object URLs are revoked by the asset hook. Uploaded files do not leave this browser.
- `services/auth.ts`: demonstrative local/session storage sign-in. A real backend must replace this with server-side authentication and authorization.
- `components/design-preview/Mockup.tsx`: uses supplied normalized placement data for approved product/model mockups and preserves original image ratios. Cream uses light-shirt art; Navy/Black use dark-shirt art.
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
python3 qa/compare.py
```

Browser tests require the app running on port 3000 and Playwright Chromium installed (`npx playwright install chromium`). Python comparisons require Pillow. Browser tests run in isolated browser contexts and do not overwrite an operator's stored data.

`qa/capture-pages.mjs` captures the exact 24 viewport dimensions recorded in `../REFERENCE_MAP.md`, checks images, overflow, console errors and HTTP failures. `qa/compare.py` writes QA-only side-by-side images with the reference on the left. These PNGs are ignored by Git and are never used as website backgrounds. `npm run format` formats application source.

## Visual approval status

**Landing approval is blocked by the supplied hero source.** The source's facial geometry and abruptly terminated right-edge hair differ from the reference. CSS sizing/positioning cannot reproduce those drawing details without altering the artwork. The user has explicitly deferred approval until a corrected transparent asset is supplied. No hero regeneration, distortion, redraw, or substitute art has been used.

All eight page layouts have been captured and compared at supplied desktop/tablet/mobile dimensions. See `qa/VISUAL_QA.md` for remaining reference differences and verification details. Screenshot-only filler artwork, photographic backgrounds, certain decorative curves, and some sample data are not present in the approved pack; the frontend uses official supplied assets and actual stored data. A capture without overflow does not mean pixel-exact approval.

Root continuity documents: `../AGENTS.md`, `../PROJECT_STATUS.md`, `../REFERENCE_MAP.md`.
