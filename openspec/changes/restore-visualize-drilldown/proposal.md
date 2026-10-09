## Why

Visualize Drilldown is a Visualizer page that lets a user pick an entity type (Business Units, Stores,
Customer Groups, Product Selections, Channels, Categories), see the entities as a treemap, click a tile to
drill into the entities related to it (stores of a business unit, products of a category, ...) and open a
detail drawer. It was deleted from the app in `e7cb4c4` ("Migrate remaining features to Nimbus") and its menu
link in `3d8e4ba`. The owner wants every feature kept in the `commercetools-labs` publication (R1/R2 in
`plans/00-master-plan.md`). The last working source is in git history (`git show e7cb4c4^:visualizer/src/components/visualize-drilldown/<file>`,
18 files, ~3,100 lines). It cannot just be copied back: it is built on the removed legacy UIKit
(`@commercetools-uikit/*`, `Drawer` from `application-components`, `PageContentWide`) and on the `d3` package
(no longer installed), it has no tests, and it has several latent defects (see design).

## What Changes

- Re-add `visualizer/src/components/visualize-drilldown/` as a Nimbus + react-intl port with the **same
  behaviour users saw** (decision Q1 "exact old behaviour"): entity-type selector, search and sort at root
  level, treemap of up to 20 entities per type per level, "load more" tile, drill-down through a relationship
  graph of 6 root and 5 more entity types, breadcrumb trail, interactive legend (show/hide per type), tile
  tooltips with extra counts ("has 3 stores"), entity detail drawer with raw JSON.
- Replace the UIKit controls with Nimbus (`DefaultPage`, `Stack`, `Button`, `ToggleButton`, `SearchInput`,
  `Drawer`, `Tooltip`, `Alert`, `LoadingSpinner`, `Card`, `Heading`, `Text`).
- Replace the d3 DOM rendering by a React-rendered treemap built on the open-source, MIT-licensed headless library
  `@visx/hierarchy` (owner decision: use an OSS replacement; chosen over recharts/nivo, see design D1), tiles are real
  `<button>`s (keyboard + screen reader accessible, jsdom-testable).
- Re-colour the 11 entity types with the validated dataviz categorical palette (the old palette fails the
  contrast/lightness/CVD validator).
- Fix defects without changing the user-visible feature set: hooks called after an early `return` (rules of
  hooks), a second copy of the fetch hook created inside two child components, N x 5 unbounded parallel
  "additional data" requests, results overwritten instead of merged, out-of-order responses, WHERE-predicate
  injection from the search box, unbounded `id in (...)` lists, JPY/KWD money formatting, `console.log`
  noise, hard-coded English strings, `ENTITY_LABELS[..].slice(0, -1)` fake singularisation.
- Add graceful states: loading, empty, error, missing OAuth scope / missing MC permission (HTTP 403) per
  request, partial failure (one relation fails, the others still show).
- Add i18n (`VisualizeDrilldown.*` keys, en + de) and jest + msw tests (none existed).
- Add explicit dependencies `@commercetools-frontend/sdk` (today only transitive; also added by
  `restore-entity-diagram`) and `@visx/hierarchy` (MIT; brings `d3-hierarchy@1` BSD-3-Clause transitively), with a licence-check task for the publication gate and a documented fallback.
- NOT in this change: route, menu link, Welcome card and `oAuthScopes` edits (`wire-routes-and-welcome`),
  `connect.yaml` and README scope table (`connect-alignment`), real-browser testing (`e2e-verification`).

## Capabilities

### New Capabilities
- `visualize-drilldown`: the page, its data access (REST through the Merchant Center API proxy), the
  relationship graph, the treemap rendering and interaction, accessibility, permissions and i18n.

### Modified Capabilities

(none - there is no `openspec/specs/` baseline yet)

## Impact

- New code only under `visualizer/src/components/visualize-drilldown/`; `visualizer/package.json`
  (+`@commercetools-frontend/sdk`, +`@visx/hierarchy`); `jest.test.config.js` only changes if the fallback to ESM-only `d3-hierarchy` is used (CJS `@visx/hierarchy` needs none); `src/i18n/data/{core,en,de}.json` (new keys; the
  same three files are edited by `restore-entity-diagram` and `wire-routes-and-welcome` - merge carefully).
- Data: read-only REST GETs via the MC API proxy (`MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM`) on
  `/business-units`, `/customers`, `/stores`, `/channels`, `/products`, `/categories`, `/product-selections`,
  `/product-selections/{id}/products`, `/products/{id}/product-selections`, `/cart-discounts`,
  `/standalone-prices`, `/customer-groups`. No writes.
- OAuth scopes needed (consumed by `wire-routes-and-welcome` / `connect-alignment`): present today
  `view_business_units`, `view_customers`, `view_stores`, `view_products`, `view_product_selections`;
  **missing today and required**: `view_categories`, `view_cart_discounts`, `view_standalone_prices`
  (and `view_customer_groups` if the live 403 check in task 9.3 shows `view_customers` does not cover Customer Groups).
- Downstream: `wire-routes-and-welcome` imports the default export of `./components/visualize-drilldown`
  (no props); `e2e-verification` uses the `data-testid`s listed in `design.md` section "E2E hooks".
