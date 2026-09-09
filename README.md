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
| Create/edit design | `/admin/designs/new`, `/admin/designs/new?edit=DESIGN_ID` |
| Requests and orders | `/admin/requests`, `/admin/requests?tab=orders` |

The admin sidebar also has working design library, customers, inventory, analytics, settings, and search destinations. Draft designs can be previewed from the library and published into the public catalogue.

## Data and replaceable boundaries

- `services/repository.ts`: launch records, design overrides, drafts, requests/orders, inventory and brand contact settings. Ordinary records use the `iwbi-v1-` localStorage prefix. Dashboard totals, recent orders, status counts and sales series are calculated from repository request/order records; there is no aggregate baseline added to them. The repository supplies demo records when no local dataset exists. An explicitly stored empty dataset produces zero totals.
- `services/uploads.ts`: IndexedDB `iwbi-uploads`, file decoding, size/dimension/type checks, and transparency validation. Files are kept locally and object URLs are revoked by the asset hook. Uploaded files do not leave this browser.
- `services/auth.ts`: demonstrative local/session storage sign-in. A real backend must replace this with server-side authentication and authorization.
- `components/design-preview/Mockup.tsx`: uses supplied normalized placement data for approved product/model mockups and preserves original image ratios. New uploads use explicit per-colour front/back assignments. Legacy `lightShirtAsset`/`darkShirtAsset` names describe garment colour and remain unchanged for the seven official records. Colour, side, view, size and quantity are restored per design after reload.
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
node qa/capture-variants.mjs
python3 qa/compare.py
```

Browser tests require the app running on port 3000 and Playwright Chromium installed (`npx playwright install chromium`). Python comparisons require Pillow. Browser tests run in isolated browser contexts and do not overwrite an operator's stored data.

`qa/capture-pages.mjs` captures the exact 24 viewport dimensions recorded in `../REFERENCE_MAP.md`, checks images, overflow, console errors and HTTP failures. `qa/compare.py` writes QA-only side-by-side images with the reference on the left. These PNGs are ignored by Git and are never used as website backgrounds. `npm run format` formats application source.

## Admin-controlled colour variants

One design record has a `variants` map for Navy, Black and Cream, plus one `defaultColour`. Each variant stores `enabled`, `background`, optional `front`/`back` upload references and explicit `reuseFront`/`reuseBack` colour references. The admin chooses every available colour, artwork assignment and preview background. There is no contrast classifier, recolouring, automatic Cream selection or ink-compatibility publishing rule.

Create Design exposes all three colour panels directly. Enable a colour, upload its transparent artwork or explicitly reuse another enabled colour's artwork, choose its preview background and select one enabled default. Reuse shares the same IndexedDB file; switching a colour to its own upload overrides only that colour. Back artwork is optional when Back printing is enabled. The public page offers only print sides that have assigned artwork for the selected colour; no front file is silently substituted onto the back.

Drafts can be incomplete. Use **Edit design** in the library, or reopen `/admin/designs/new?edit=DESIGN_ID`, to continue after reload. Publishing validates enabled/default colours, required front files, valid reuse references, selected sizes and print sides, name and description. A disabled default must be explicitly replaced. Low contrast is permitted. Upload validation checks PNG/WebP, successful decoding, size up to 10 MB, dimensions and genuine transparency. Binary image data lives in IndexedDB; object URLs are temporary rendering handles only.

`services/artwork.ts` also adapts old records to schema version 2 on read. The seven launch records keep their identity, order, text and original assets. Their previous default was Navy, so Navy remains their default. Existing dark-shirt files are assigned to Navy/Black and light-shirt files to Cream according to the previous working garment mapping; their already-supported front/back assignment is retained. Existing restricted records remain restricted. Editing persists the migrated structure without adding another catalogue record. The immutable source JSON is not rewritten.

Gallery artwork/background comes from the default variant. A first detail visit selects the default; a valid remembered customer selection is restored on later visits. Colour and side select one shared image URL for the Original Artwork panel and the printed artwork, while garment/model photographs and background update with it. All three colour swatches stay visible; unavailable colours are crossed out, disabled and labelled accessibly. Request records include `variantId` (`design-code/colour/side`), the assigned artwork reference and preview background; WhatsApp details include the same variant identity along with design, colour, size, quantity and side.

## How It Works

Public navigation routes to `/#how-it-works`. The homepage contains the established choose/share → preview → WhatsApp confirmation process below the bounded hero. Same-page activation scrolls smoothly; cross-route navigation scrolls and focuses the section heading. Scroll spacing accounts for navigation and reduced-motion preferences are respected.

## Visual approval status

The user approved the existing website overall and requested the focused correction pass documented in `qa/VISUAL_QA.md`. Responsive geometry, admin navigation, upload variants, selection persistence and data-derived dashboard values have been corrected without changing the design system or supplied artwork.

The earlier hero source mismatch remains explicitly unresolved: the supplied portrait has different facial geometry and an abruptly terminated right-edge hair boundary. The complete supplied image is fitted proportionally, with no CSS clipping of important details. `HeroArtwork` remains replaceable for the corrected transparent asset. This pass does not claim pixel-exact landing approval or silently accept a different drawing.

All eight page layouts were recaptured at the supplied desktop/tablet/mobile dimensions. Nine additional landing screenshots at 100% zoom and the paired-variant verification screenshots are in `qa/`. See the QA report for results, source constraints and the admin-controlled per-colour workflow.

Root continuity documents: `../AGENTS.md`, `../PROJECT_STATUS.md`, `../REFERENCE_MAP.md`.
