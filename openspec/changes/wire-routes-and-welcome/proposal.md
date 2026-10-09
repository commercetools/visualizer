## Why

The two visualizations (Entity Diagram and Visualize Drilldown) are being ported to the Nimbus design
system by the sibling changes `restore-entity-diagram` and `restore-visualize-drilldown`. A component
that nothing links to is invisible: the owner's requirement R2 says the two routes that commit `3d8e4ba`
removed from `custom-application-config.mjs` must come back. This change is the "wiring" step: it makes
the two pages reachable (menu, URL, Welcome card) and makes sure the app asks the Merchant Center (MC)
for exactly the API permissions (OAuth scopes) those pages need, no more.

## What Changes

- `visualizer/custom-application-config.mjs`: add two `submenuLinks` (`visualize-drilldown` labelled
  "Visualize Drilldown", `entity-diagram` labelled "Entity Diagram"), gated by the app's `View`
  permission.
- `visualizer/custom-application-config.mjs`: add the read scopes the two pages need
  (`view_standalone_prices`, `view_cart_discounts`, `view_categories`) and remove scopes no code uses
  any more (orders, shopping lists, quote requests) after a grep proof.
- `visualizer/src/routes.tsx`: add two `<Route>` entries (`/visualize-drilldown`, `/entity-diagram`)
  before the catch-all Welcome route.
- `visualizer/src/components/welcome/`: two new cards (Visualize Drilldown, Entity Diagram) with
  their own descriptions. The old dangling "Visualize" card (target `visualize`, no page) is NOT
  restored. Cards move from 5 to 7.
- `visualizer/src/components/welcome/messages.ts` plus `src/i18n/data/{core,en,de}.json`: new message ids.
- New unit tests: `src/routes.spec.tsx` and `src/components/welcome/welcome.spec.tsx`.
- `specs/001-welcome/*` (the reverse-engineered feature spec folder) updated so that it no longer says
  "do not add cards".

## Capabilities

### New Capabilities
- `app-navigation`: URL routes, left-hand submenu links, per-link permissions and the OAuth scopes the
  application declares.
- `welcome-landing`: the Welcome page, its card grid, and the fallback behaviour for unknown URLs.

### Modified Capabilities
<!-- none: openspec/specs/ is empty in this repo; both capabilities are introduced here -->

## Impact

- Code: `visualizer/custom-application-config.mjs`, `visualizer/src/routes.tsx`,
  `visualizer/src/components/welcome/*`, `visualizer/src/i18n/data/*.json`, two new spec files,
  `specs/001-welcome/*`.
- Depends on: changes `import-baseline` (A), `restore-entity-diagram` (B), `restore-visualize-drilldown` (C).
  It imports their default-exported page components.
- Feeds: `connect-alignment` (E) copies the final scopes into `connect.yaml`/README;
  `e2e-verification` (F) tests these pages end to end.
- No new npm dependency.
