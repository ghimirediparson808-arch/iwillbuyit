# Visual and interaction QA

## Approval status

All eight routes have been captured and visually compared at their three supplied viewport sizes. This is an implementation/QA milestone, **not pixel-exact final approval**. Landing remains explicitly unapproved until the user supplies the corrected transparent hero.

The final 24-size browser capture completed with **zero console/runtime/HTTP errors, zero missing images, and zero horizontal page overflow**. The regression suite also checks all eight routes at 1672, 1086, 853 and 390 CSS pixels wide.

## Comparisons

Each comparison has the immutable reference on the left and current implementation on the right. Full-resolution current captures are the corresponding files without `compare-`. Generate with `node qa/capture-pages.mjs` and `python3 qa/compare.py`.

| Page | Desktop | Tablet | Mobile | Review notes |
| --- | --- | --- | --- | --- |
| Landing | [Compare](compare-landing-desktop.png) | [Compare](compare-landing-tablet.png) | [Compare](compare-landing-mobile.png) | Hero source blocker remains unresolved; typography and CTA placement aligned, dominant artwork remains proportional. |
| Catalogue | [Compare](compare-gallery-desktop.png) | [Compare](compare-gallery-tablet.png) | [Compare](compare-gallery-mobile.png) | Four/two-column reflow, search and filter placement checked. Seven official records replace absent screenshot-only designs. |
| Detail | [Compare](compare-detail-desktop.png) | [Compare](compare-detail-tablet.png) | [Compare](compare-detail-mobile.png) | Three-column desktop, artwork-below tablet, stacked mobile checked. Supplied shirt photography and The Climb drawing differ from reference. |
| Customize | [Compare](compare-customize-desktop.png) | [Compare](compare-customize-tablet.png) | [Compare](compare-customize-mobile.png) | Form/steps reflow checked. Native date control, selected size, local-storage disclosure and icon treatment differ from screenshot. |
| Login | [Compare](compare-login-desktop.png) | [Compare](compare-login-tablet.png) | [Compare](compare-login-mobile.png) | Organic desktop/mobile split and form placement checked. Demo-access language deliberately replaces unsupported security claims. |
| Dashboard | [Compare](compare-dashboard-desktop.png) | [Compare](compare-dashboard-tablet.png) | [Compare](compare-dashboard-mobile.png) | Metrics/charts/orders/stock reflow checked, intermediate-width overflow fixed. Counts and chart follow seeded data plus local changes. |
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

Nine scenarios pass after fixes. Lint, TypeScript and production build pass. The PostCSS transitive dependency is pinned to patched 8.5.28; npm audit reports zero vulnerabilities. The app is frontend-only and does not send external messages or provide secure authentication.

## Next visual approval step

Receive corrected transparent hero source/derivatives, copy runtime files only into `public/assets/`, update `HeroArtwork` paths and measure the corrected bounds. Recheck desktop/tablet/mobile landmark placement without stretching or clipping important drawing details. Review the remaining source/style differences above before final visual sign-off; do not treat this report as approval.
