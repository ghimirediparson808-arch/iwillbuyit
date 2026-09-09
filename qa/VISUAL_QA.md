# Visual and interaction QA

## Current pass: WhatsApp-first requests, orders and gallery — 9 September 2026

The latest user request explicitly simplifies the request/order workflow and changes gallery canvases. These instructions supersede the older proposal/checklist UI, combined request/order records, seeded demo records and default-colour gallery backgrounds described in historical sections below. The approved palette, typography, logo, curves, garment previews, variant authority and homepage geometry remain intact.

- Gallery: one muted navy-grey/stone CSS canvas across all cards; contain-sized unmodified artwork; equal artwork/footer heights, two-line names and aligned Inspect actions. Gallery Cover selects Navy, Black, Cream or one separate transparent upload. A subtle alpha shadow is scoped to gallery images; original/print files remain untouched. Detail colour/background changes never change the gallery canvas.
- Library: Edit Design, Published/Draft/Unavailable state, availability toggle, red Remove Design with 10-second Undo. Official JSON/assets are immutable; expired local deletion uses ID tombstones for launch records. Order snapshots retain agreed name/code, artwork, garment, quantity and prices after edit/removal.
- Requests: New / Contacted / Converted to Order / Closed. Read-only customer submissions, Gallery Design / Custom Design badges, private notes and activity. WhatsApp contact, linked order confirmation, close/reopen and accidental unconverted deletion replace proposal/checklist controls.
- Orders: explicit manual creation or idempotent request conversion. Independent Unpaid/Paid/Refunded and Confirmed/Printing/Ready/Delivered/Cancelled states. One stage action, WhatsApp secondary, cancel/archive/restore and guarded never-paid manual removal/Undo. Cancelling a paid order preserves Paid until explicitly refunded.
- Dashboard: New Requests, Active Orders, In Printing and Total Paid Sales use real repository records. Fresh storage has zero customers, requests, orders, stock entries and sales. Paid sales include paid archived/cancelled orders and exclude refunds. Test fixtures exist only in isolated automated tests.
- Public ordering: Order on WhatsApp includes current design identity, colour, size, quantity, side and a saved request ID when present; Request This Design remains trackable. No checkout or gateway was added. Demo auth remains browser-only.

### Current verification

**All 28 production scenarios passed in one run (2.0 minutes).** After the final phone spacing and legacy snapshot refinements, all 10 affected workflow/domain scenarios passed again (42.2 seconds). Final lint, TypeScript and production build pass; Git whitespace checks pass. Prior 18 scenarios are retained with obsolete assertions updated to the requested workflow.

A long-name card-height discrepancy was caught and fixed. Phone card names now have their own full-width area above a larger Inspect link; primary request/order actions are full-width on phones. Exact form labels, shared canvas comparisons across production CSS minification, and screenshot readiness were tightened. Legacy migration now preserves request design names/artwork, and conversion retains explicitly captured artwork when the agreed variant is unchanged. No loading-screen capture is accepted as visual evidence.

All 24 supplied reference-sized pages were recaptured and visually reviewed with zero browser/runtime/HTTP errors, missing images or horizontal overflow. Gallery and Requests were recaptured again at their six supplied dimensions after the final styling changes, with the same clean results. The existing nine landing-size results remain applicable to unchanged hero geometry. Final populated captures below were visually reviewed and use isolated test submissions, one manual order and gallery fixtures exercising white, black, colourful artwork and a long name; production storage is never seeded.

| Current page | Desktop 1672×941 | Tablet 1086×1448 | Phone 390×844 |
| --- | --- | --- | --- |
| Gallery | [Capture](commerce-gallery-desktop.png) | [Capture](commerce-gallery-tablet.png) | [Capture](commerce-gallery-mobile.png) |
| Requests | [Capture](commerce-requests-desktop.png) | [Capture](commerce-requests-tablet.png) | [Capture](commerce-requests-mobile.png) |
| Orders | [Capture](commerce-orders-desktop.png) | [Capture](commerce-orders-tablet.png) | [Capture](commerce-orders-mobile.png) |

### Boundaries and remaining visual approval

**Frontend workflow is ready for backend integration.** The browser repository provides the replaceable action boundary. Real authentication, multi-user transactions, durable upload storage and server validation remain backend responsibilities. Uploaded binaries are retained for historical snapshots and explicit reuse; automatic orphan-file garbage collection is not implemented. Legacy combined records migrate once, preserving stored history; payment inference occurs only during this migration.

**Hero artwork mismatch remains unresolved.** The supplied 939×1675 portrait has different facial geometry and an abruptly terminated right hair edge; its alpha bounds fill the canvas. CSS cannot recreate the reference drawing without distortion or inventing details. `HeroArtwork` remains replaceable and proportional. Corrected transparent source/derivatives are still needed before final landing artwork approval. No assets were redrawn, regenerated, recoloured or replaced in this pass.

### Main changed files

`services/commerce.ts`, `services/storage.ts`, `services/repository.ts`, `services/dashboard.ts`, `services/artwork.ts`, `types/index.ts`, `lib/hooks.ts`; admin Requests, Dashboard, AdminSections, AdminShell and CreateDesign components; gallery Gallery/DesignCard and public DesignDetail/Customize components; `styles/commerce.css` and scoped gallery rules in `styles/globals.css`; workflow/domain and updated regression tests; README and root continuity documents.

---

## Previous pass: admin-controlled colour variants — 9 September 2026

The user explicitly superseded the earlier compatibility fallback. **No current publishing rule assesses contrast, removes selected colours, forces Cream or invents artwork reuse.** The earlier report below is historical; its compatible-colour restriction and hidden unavailable options no longer apply.

### Delivered behavior

- One schema-version-2 design record contains Navy/Black/Cream variants, explicit enabled state, per-colour front/back artwork, explicit reuse references, preview background and one enabled default. The catalogue still creates one card per design.
- Create/Edit Design separates shared information, three visible variant panels and live original/product/model/gallery previews. Admins can use different files for every colour, reuse one stored file across colours, and override one colour independently. PNG/WebP bytes and alpha are preserved; no filters, inversion or recolouring are applied.
- Default preview background equals the shirt colour, and each background can be changed manually. Gallery display uses the default variant. Public detail selection synchronizes original artwork/background and real garment/model assets. Unavailable swatches remain visible with diagonal strikes, disabled behavior and accessible labels.
- Incomplete drafts save and reopen through the library's Edit design link or the saved edit URL. Uploads stay in IndexedDB. A missing required file, broken/cyclic reuse or disabled default produces a specific publication error; low contrast does not. Reusing one upload does not create another binary copy.
- Saved detail choices survive reload. Fixed a discovered restore-order race where the default could overwrite the restored colour. One shared resolved image URL drives both original and print views, avoiding stale artwork on a newly selected background.
- Requests store design ID, selected colour/size/quantity/side/view, variant ID and artwork/background snapshot. WhatsApp details contain the selected variant identity. External messages are not sent automatically.
- A read adapter migrates official and older stored records without deleting or duplicating them. All seven official codes, names, descriptions, order and assets remain intact. Previous Navy default and working garment/side/size assignments are retained; explicitly restricted legacy records keep those restrictions. Edits persist schema version 2. No immutable data/source asset was rewritten.
- How It Works now has a real homepage section at `/#how-it-works`, using the established three-step process and approved palette/type. Desktop and mobile navigation from every public content route scrolls to and focuses its heading, with reduced-motion support and navigation clearance. Public Admin Login, auth protection and sidebar View Website remain working.

### Scenario and regression results

All **18 automated scenarios passed in one development run (4.7 minutes)**. Final lint, TypeScript and production build all pass after the preview-bound correction. The original nine frontend scenarios and three still-applicable prior correction tests remain; two obsolete ink-compatibility tests were replaced by six tests for the new requirements.

| Required scenario | Verified result | Visual evidence |
| --- | --- | --- |
| A: Cream only | Cream starts selected; Navy/Black visibly crossed out and disabled; one additional card | [Cream](scenario-a-cream.png) |
| B: Black and Cream | One record; distinct front/back files; both colours × both sides × product/model; original/print URL match; reload; variant-aware request/WhatsApp | [Product Black](scenario-b-product-front-black.png), [Product Cream](scenario-b-product-front-cream.png), [Model Black](scenario-b-model-front-black.png), [Model Cream](scenario-b-model-front-cream.png) |
| C: Explicit reuse | One IndexedDB binary for Navy/Black; independent Black override produces one additional file and no duplicate card | [Reuse and deliberate low contrast](scenario-c-low-contrast.png) |
| D: Low contrast | Dark artwork intentionally published on Navy/Black without switching to Cream | [Capture](scenario-c-low-contrast.png) |
| E: Persistence | Draft refresh and library reopen preserve variants/files/background/default; disabling default blocks publication until explicit replacement | [Mobile detail](scenario-e-mobile.png) |

The B scenario deliberately reverses ink contrast on the back to prove independent back assignment and that the application does not override admin intent. Its `scenario-b-{product,model}-back-{black,cream}.png` captures therefore include intentional low contrast, not a failed colour resolver.

Editor captures reviewed at [desktop 1672×941](variant-editor-desktop.png), [tablet 1086×1448](variant-editor-tablet.png), [phone 390×844](variant-editor-mobile.png). Full-page captures include scrolling form content; all controls remain accessible. The original-artwork frame overflow found during review was corrected and recaptured. [How It Works mobile](how-it-works-mobile.png) shows the added section; keyboard navigation was checked from `/`, `/designs`, `/designs/the-climb` and `/customize` at 1440px and 390px.

### Landing and unchanged layouts

The existing bounded hero geometry is retained. All nine required 100% zoom sizes were recaptured and visually reviewed: **360×800, 390×844, 768×1024, 820×1180, 1024×768, 1280×800, 1366×768, 1440×900, 1920×1080**. All have scale 1, visible CTAs, no nav/text/art collision, no unintended image crop, no horizontal overflow and no excessive tablet blank region. The homepage now scrolls below the hero to How It Works; the hero itself still fits the tested initial viewports. [Measurements](landing-viewports.json); individual `landing-WIDTHxHEIGHT.png` captures are listed in the previous viewport table below.

All 24 reference-sized captures were refreshed and reviewed: **zero missing images, horizontal overflow and browser/runtime/HTTP errors**. Gallery card geometry and detail column/reflow structures remain intact. Gallery artwork/background now intentionally reflects the migrated Navy default instead of the former fixed thumbnail; detail original backgrounds now follow selection. Create/Edit workflow and the new homepage process are the expressly requested layout additions. Login, dashboard, customize and requests/orders retain their approved composition. Source files, logo, fonts, palette, hero and fabric mockups are unchanged.

### Remaining limitations

No functional blocker remains from the requested scenarios. This remains a frontend-only demo with browser-local records, IndexedDB files and demonstrative authentication. Real fulfillment, a backend and automatic messaging are outside scope. The supplied hero facial geometry/right hair edge still differs from the authoritative reference. It was not redrawn or distorted; `HeroArtwork` remains replaceable, and pixel-exact landing artwork approval remains open.

### Files modified

`app/page.tsx`; `app/admin/(portal)/designs/new/page.tsx`; `components/admin/{CreateDesign,VariantPanel,AdminSections}.tsx`; `components/design-preview/{Controls,DesignDetail,Mockup}.tsx`; `components/gallery/DesignCard.tsx`; `components/site/{Header,HowItWorks}.tsx`; `lib/hooks.ts`; `services/{artwork,repository}.ts`; `types/index.ts`; `styles/{globals,landing,variants}.css`; `tests/{frontend,corrections,variants}.spec.ts`; `tests/variant-helpers.ts`; `qa/{capture-variants,landing-viewports}.mjs`; `qa/landing-viewports.json`; `README.md`; this report; root `PROJECT_STATUS.md` and `REFERENCE_MAP.md`.

## Previous correction pass — superseded variant rules

The latest user instruction approves the existing website overall and limits this pass to landing responsiveness, public/admin navigation, uploaded artwork variants and regression/data checks. The supplied hero drawing mismatch remains explicitly unresolved; no new pixel-exact landing approval is claimed. Existing artwork, palette, font families and unrelated page designs were preserved.

### Verified corrections

- Landing uses a bounded 1672px container, width/height-aware fluid type and spacing, and a stacked layout below 1000px. Header and artwork occupy separate grid regions. The entire supplied image fits with `object-fit: contain`; no stretch, redraw, replacement or image background was added. Tablet artwork follows the CTAs without the previous oversized blank region.
- A discreet lock-icon Admin Login link appears on desktop and inside the mobile menu. It routes through `/admin/login`. The existing sidebar View Website action is retained; signed-in login visits redirect to `/admin`. Auth guard, logout and browser back/forward are tested.
- Explicit ink metadata survives validation, IndexedDB storage, publication, gallery/detail rendering and product/model composition. Cream selects dark ink; Navy/Black select light ink. Paired uploads preserve original alpha and use normal blending with no CSS filter. Only-light original panels use Navy for legibility.
- A missing variant produces a warning and restricts publication to compatible garments: dark-only → Cream; light-only → Navy/Black. Public controls omit unavailable colours. Explicit original multicolour mode uses the unchanged original on every chosen garment.
- Detail colour, front/back, product/model, size and quantity persist per design through reload. Preference writes do not emit catalogue-change events.
- Dashboard totals, recent orders, status counts and sales curves derive from repository records. No fabricated aggregate baseline remains. Initial demo records remain available when storage has no dataset; an explicitly stored empty dataset produces zero totals and an empty-order state. Sales count quoted values for Paid and later stages, grouped by record creation date because there is no payment ledger/backend.

### Nine required landing viewports, 100% zoom

All nine screenshots were visually reviewed. The browser measurements report scale 1, no horizontal overflow, no nav/text collision, no image crop, no broken images and both CTAs within the viewport. The supplied portrait's pre-existing right hair edge is a source boundary, not new CSS cropping. Geometry checks are not a claim that the source drawing matches the reference.

| Viewport | Screenshot | Result |
| --- | --- | --- |
| 360 × 800 | [Capture](landing-360x800.png) | Pass |
| 390 × 844 | [Capture](landing-390x844.png) | Pass |
| 768 × 1024 | [Capture](landing-768x1024.png) | Pass |
| 820 × 1180 | [Capture](landing-820x1180.png) | Pass |
| 1024 × 768 | [Capture](landing-1024x768.png) | Pass |
| 1280 × 800 | [Capture](landing-1280x800.png) | Pass |
| 1366 × 768 | [Capture](landing-1366x768.png) | Pass |
| 1440 × 900 | [Capture](landing-1440x900.png) | Pass |
| 1920 × 1080 | [Capture](landing-1920x1080.png) | Pass |

Raw geometry: [landing-viewports.json](landing-viewports.json). The supplied landing desktop/tablet/mobile references were compared again; the desktop-shaped tablet reference uses the same 1672×941 dimensions. All 24 page captures were refreshed and reviewed with zero browser/HTTP errors, missing images or horizontal overflow.

### Temporary variant verification

Published `Temporary Ink Verification` in an isolated test browser using the supplied transparent The Climb dark/light master files. Verified the gallery, then all 12 combinations of three garments × front/back × product/model, including reload after every combination. Canvas reads confirmed transparent pixels, dark-ink luminance below 30 on Cream, light-ink luminance above 220 on Navy/Black, no filter and normal blending. The temporary record, its selection/override keys and its two IndexedDB uploads were removed; the gallery returned to seven records and the official JSON remained byte-identical. Operator data was not touched.

Screenshots: [Gallery](variants-gallery.png), [Cream product](variants-product-front-cream.png), [Black product](variants-product-front-black.png), [Navy product](variants-product-front-navy.png), [Cream model](variants-model-front-cream.png), [Black model](variants-model-front-black.png), [Navy model](variants-model-front-navy.png). Matching `variants-{product,model}-back-{cream,black,navy}.png` captures record the back checks.

Lint, TypeScript and the production build pass. The final complete production regression passed **14 of 14 scenarios in 1.9 minutes**, exit code 0. An earlier development run was interrupted when the local preview process terminated; subsequent concurrent test retries also collided in their shared artifact directory. Final verification used one test process against `npm start`. Coverage includes all existing nine scenarios plus paired inks/reloads/cleanup, single-variant/multicolour behavior, bidirectional navigation/history, data-derived/empty dashboard and public/admin link destinations.

## Comparisons

Each comparison has the immutable reference on the left and current implementation on the right. Full-resolution current captures are the corresponding files without `compare-`. Generate with `node qa/capture-pages.mjs` and `python3 qa/compare.py`.

| Page | Desktop | Tablet | Mobile | Review notes |
| --- | --- | --- | --- | --- |
| Landing | [Compare](compare-landing-desktop.png) | [Compare](compare-landing-tablet.png) | [Compare](compare-landing-mobile.png) | Hero source blocker remains unresolved; typography and CTA placement aligned, dominant artwork remains proportional. |
| Catalogue | [Compare](compare-gallery-desktop.png) | [Compare](compare-gallery-tablet.png) | [Compare](compare-gallery-mobile.png) | Four/two-column reflow, search and filter placement checked. Seven official records replace absent screenshot-only designs. |
| Detail | [Compare](compare-detail-desktop.png) | [Compare](compare-detail-tablet.png) | [Compare](compare-detail-mobile.png) | Three-column desktop, artwork-below tablet, stacked mobile checked. Supplied shirt photography and The Climb drawing differ from reference. |
| Customize | [Compare](compare-customize-desktop.png) | [Compare](compare-customize-tablet.png) | [Compare](compare-customize-mobile.png) | Form/steps reflow checked. Native date control, selected size, local-storage disclosure and icon treatment differ from screenshot. |
| Login | [Compare](compare-login-desktop.png) | [Compare](compare-login-tablet.png) | [Compare](compare-login-mobile.png) | Organic desktop/mobile split and form placement checked. Demo-access language deliberately replaces unsupported security claims. |
| Dashboard | [Compare](compare-dashboard-desktop.png) | [Compare](compare-dashboard-tablet.png) | [Compare](compare-dashboard-mobile.png) | Metrics/charts/orders/stock reflow checked, intermediate-width overflow fixed. Counts and chart derive from repository order records, including initial demo records when no local dataset exists. |
| Create design | [Compare](compare-create-desktop.png) | [Compare](compare-create-tablet.png) | [Compare](compare-create-mobile.png) | Three columns and centered 620px mobile composition checked. Original/gallery art remains proportional. Correct Street Duck identity replaces contradictory reference labels. |
| Requests/orders | [Compare](compare-requests-desktop.png) | [Compare](compare-requests-tablet.png) | [Compare](compare-requests-mobile.png) | Three columns, icon sidebar and selected-request mobile layout checked. Inbox/search/manual-order controls remain accessible on mobile through Back to inbox. |

## Exact source constraints

- Hero: supplied 939×1675 master has different facial proportions and an abruptly terminated right-edge hair boundary. Its alpha bounds fill the canvas, so trimming transparent margins does not produce the reference drawing. Changing CSS aspect ratio would distort it. The user will provide a corrected transparent source; `HeroArtwork.tsx` is replaceable. No hero replacement/redraw/regeneration was attempted.
- Catalogue: Wild Mind, anime and mountain screenshot illustrations are absent from the official seven-record catalogue. The Climb's supplied lower drawing also differs from the pictured hand silhouette. Official master/derivative assets are used unchanged.
- Create: the reference pairs Coffee Energy text with Street Duck art and includes a textured artwork background missing from the supplied transparent art. The implemented design name, description and imagery consistently use Street Duck.
- Mockups: supplied product photos have different garment shape, lighting and navy colour from the screenshots. Placement follows the supplied normalized layout JSON, including dark- and light-shirt versions.
- Requests: the two pictured mountain/sketch files and actual customer phone numbers are absent. Seeded records use an approved design reference and identify missing contacts; no invented phone is callable. Displayed counts correspond to actual records.
- Shared decorative assets and official logo differ in shape/finish from screenshot renders. Current pages use supplied assets. Decorative curve shape, background wash, font rendering/weight, some control spacing, tags-as-input presentation and chart colour allocation still differ. These are not claimed to be pixel-exact, and are distinct from the hero blocker.

## Interaction coverage

The Playwright suite exercises catalogue categories/search/empty states/dynamic routes; garment compositor variants and saved requests; upload persistence through reload and request-to-order conversion; dashboard updates; demo auth guard/login/logout; draft upload/publication; mobile navigation/theme; invalid files; draft previews; restricted garment choices; keyboard typing/Escape in dialogs; contact settings; inventory; repeated workspace searches; and route/image/overflow checks at four widths.

The original nine scenarios are retained in the expanded correction suite. Lint, TypeScript and production build pass. The PostCSS transitive dependency is pinned to patched 8.5.28; npm audit reports zero vulnerabilities. The app is frontend-only and does not send external messages or provide secure authentication.

## Next visual approval step

Receive corrected transparent hero source/derivatives, copy runtime files only into `public/assets/`, update `HeroArtwork` paths and measure the corrected bounds. Recheck desktop/tablet/mobile landmark placement without stretching or clipping important drawing details. The latest overall visual approval does not change these source facts. Do not redraw the hero or claim its drawing now matches the reference.

## Changed files in the correction milestone

- Landing: `app/page.tsx`, `styles/landing.css`.
- Navigation/auth: `components/site/Header.tsx`, `components/admin/Login.tsx`.
- Upload/variants: `components/UploadField.tsx`, `components/admin/CreateDesign.tsx`, `components/gallery/DesignCard.tsx`, `components/design-preview/Mockup.tsx`, `services/artwork.ts`, `types/index.ts`.
- Selection/data/dashboard: `components/design-preview/DesignDetail.tsx`, `services/repository.ts`, `services/dashboard.ts`, `lib/hooks.ts`, `components/admin/Dashboard.tsx`, `components/admin/AdminSections.tsx`.
- Shared scoped additions: `styles/globals.css`.
- Verification: `tests/frontend.spec.ts`, `tests/corrections.spec.ts`, `qa/capture-pages.mjs`, `qa/landing-viewports.mjs`, `qa/landing-viewports.json`.
- Documentation/QA exclusions: `README.md`, `qa/VISUAL_QA.md`, `.gitignore`; root `PROJECT_STATUS.md` and `REFERENCE_MAP.md` are maintained outside the app Git repository.

No supplied artwork, runtime asset copy, official design JSON or source/reference folder was changed. `HeroArtwork.tsx` remains the existing replaceable source boundary.
