## 0. Before you start

- [x] 0.1 Confirm prerequisites. Run `ls openspec/changes` from the repo root; changes `restore-entity-diagram` and `restore-visualize-drilldown` must have all tasks checked, and `visualizer/src/components/entity-diagram/index.tsx` and `visualizer/src/components/visualize-drilldown/index.tsx` must exist. Why: this change imports them. If missing, STOP and do those first.
- [x] 0.2 Baseline. `cd visualizer && npm run typecheck && npm test`. Expected: both green. Why: so you know later failures are yours. Pitfall: run from `visualizer/`, not the repo root.
- [x] 0.3 Create a working note in your PR/log only (no file). Do not commit: this repo gets a single commit at the end (change I).

## 1. Read the sibling interfaces

- [x] 1.1 Open `openspec/changes/restore-entity-diagram/design.md` and `.../restore-visualize-drilldown/design.md` and write down (a) the default-export name, (b) any required props, (c) any scope they say they need. Then open the two `index.tsx` files and confirm. Expected: default export, no props. If it differs, only the two JSX lines in task 3.1 change.
- [x] 1.2 Compare (c) against the table in `design.md` D4. Add any extra scope to task 5.2.

## 2. Messages (do this first so the components compile)

- [x] 2.1 Edit `visualizer/src/components/welcome/messages.ts`. Append, inside `defineMessages({ ... })`, six entries following the existing pattern:
  `visualizeDrilldownTitle` (id `Welcome.visualizeDrilldown.title`), `visualizeDrilldownContent` (`...content`), `visualizeDrilldownViewButton` (`...viewButton`), and the same three for `entityDiagram` (`Welcome.entityDiagram.*`). Use the English texts from design D5. Expected: `npm run typecheck` still green.
- [x] 2.2 Regenerate `core.json`: `cd visualizer && npm run extract-intl`. Expected: `git diff --stat src/i18n/data/core.json` shows only 6 added lines (sorted, case-insensitive). Pitfall: if hundreds of lines change, the formatter script ran with different node_modules - run `npm ci` and retry.
- [x] 2.3 Copy the same 6 key/value lines into `src/i18n/data/en.json` (English) and `src/i18n/data/de.json` (German texts from design D5), keeping the file sorted the way `core.json` is. Verify: `node -e "for (const f of ['core','en','de']) console.log(f, Object.keys(require('./src/i18n/data/'+f+'.json')).length)"` prints the same number three times.

## 3. Routes

- [x] 3.1 Edit `visualizer/src/routes.tsx`:
  1. Add imports after the `CustomObjectsList` import: `import VisualizeDrilldown from './components/visualize-drilldown';` and `import EntityDiagram from './components/entity-diagram';`
  2. In the `<Switch>`, after the `custom-objects` route and BEFORE the bare `<Route><Welcome /></Route>`, add `<Route path={`${match.path}/visualize-drilldown`}><VisualizeDrilldown /></Route>` and the same for `entity-diagram`.
  Expected: `npm run typecheck` green. Pitfall: a route placed after the bare `<Route>` never renders - the catch-all swallows it.
- [x] 3.2 Do not touch the other routes (the current file already contains `extensions/new` and `extensions/:id` that the 2026-era old file lacked). Verify with `git diff visualizer/src/routes.tsx`: only additions.

## 4. Welcome cards

- [x] 4.1 Edit `visualizer/src/components/welcome/welcome.tsx`: after the Custom Objects `<InfoCard>` add two `<InfoCard>` blocks using the new messages and `target={'visualize-drilldown'}` / `target={'entity-diagram'}`. Do NOT add a `visualize` card. Expected: page shows 7 cards.
- [x] 4.2 Look at the card button: it passes `viewButtonLabel` to the `Button`; the test in 6.2 will find it by that text.

## 5. Menu links and scopes

- [x] 5.1 Prove which scopes are unused. From `visualizer/`: `grep -rniE "orders|shopping|quote" src --include=*.ts --include=*.tsx --include=*.graphql -l | grep -v i18n`. Expected: no file that fetches orders/shopping lists/quote requests (a match that is only a state-type name like `OrderState` is fine). Save the output in your log.
- [x] 5.2 Edit `visualizer/custom-application-config.mjs`:
  - In `oAuthScopes.view` add `'view_categories'`, `'view_cart_discounts'`, `'view_standalone_prices'` (and `'view_customer_groups'` only if task 7.3 shows a 403 on `/customer-groups`); remove `'view_orders'`, `'view_shopping_lists'`.
  - In `oAuthScopes.manage` remove `'manage_orders'`, `'manage_shopping_lists'`.
  - Append two links at the end of `submenuLinks`:
    `{ uriPath: 'visualize-drilldown', defaultLabel: 'Visualize Drilldown', labelAllLocales: [], permissions: [PERMISSIONS.View] }` and
    `{ uriPath: 'entity-diagram', defaultLabel: 'Entity Diagram', labelAllLocales: [], permissions: [PERMISSIONS.View] }`.
  Why `View` and not `Manage`: see design D3. Skip step "remove" for any scope that task 5.1 found in use.
- [ ] 5.3 Verify scope names against the docs: use the MCP tool `mcp__plugin_commercetools_commercetools-knowledge__commercetools-documentation-search` with query "Merchant Center API scopes view_categories view_cart_discounts view_standalone_prices". Expected: all three names exist. If one is spelled differently, fix the config and design D4.
- [x] 5.4 Syntax check of the config: `cd visualizer && node --check custom-application-config.mjs`. Expected: no output (it only checks syntax; the config imports TypeScript so it cannot be executed with plain Node). The real validation is `npm run build` in 7.1, which fails with a clear message on a bad config.

## 6. Tests

- [x] 6.1 Create `visualizer/src/routes.spec.tsx`. Steps: (a) at the top `jest.mock('./components/entity-diagram', () => ({ __esModule: true, default: () => <div>entity-diagram-stub</div> }));` and the same for `./components/visualize-drilldown`; (b) render `<ApplicationRoutes />` with `renderAppWithRedux` (import from `@commercetools-frontend/application-shell/test-utils`) inside `<Route path={`/:projectKey/${entryPointUriPath}`}>` and a `NimbusProvider locale="en" loadFonts={false}` (copy the helper at the top of `src/components/types/types-list/types-list.spec.tsx`; pass `route: `/my-project/${entryPointUriPath}/entity-diagram``, `environment: { entryPointUriPath }`, `apolloClient: createApolloClient()`, and `project.allAppliedPermissions: mapResourceAccessToAppliedPermissions([PERMISSIONS.View])`); (c) tests: `/entity-diagram` shows `entity-diagram-stub`; `/visualize-drilldown` shows its stub; `/visualize` shows the Welcome title ("A visualizer for all non out-of-the-box types in Merchant Center"); root URL shows Welcome. Use `await screen.findByText(...)`. Expected: `npx jest --config jest.test.config.js src/routes.spec.tsx` passes (4 tests). Pitfall: the other routes' lazily imported pages are never visited, so no GraphQL mock is needed.
- [x] 6.2 Create `visualizer/src/components/welcome/welcome.spec.tsx` (same render helper, but render `<Welcome />` directly, importing from `./welcome`, not the lazy `index.ts`). Tests: (1) `await screen.findAllByRole('heading', { level: 2 })` has length 7 and names in the order of the spec; (2) `screen.queryByRole('heading', { name: /^Visualize$/ })` is null; (3) set of the seven description texts has size 7; (4) click `View Entity Diagram` with `fireEvent.click` then `expect(history.location.pathname).toBe('/my-project/visualizer/entity-diagram')` (history is returned by `renderAppWithRedux`). Expected: passes. Pitfall: Nimbus `Button` fires on `onPress`; if `fireEvent.click` does nothing use `userEvent.click` (already a dependency).
- [x] 6.3 Mutation check (proves tests bite): temporarily delete the `entity-diagram` Route in `routes.tsx`, run the two specs, see one fail, restore it. Expected: failure then green again.

## 7. Verify

- [x] 7.1 `cd visualizer && npm run typecheck && npm run lint && npm test && npm run build`. Expected: all green. Pitfall: if lint complains about the `.spec.tsx` imports order, run `npx eslint --fix <file>`.
- [ ] 7.2 Quick manual smoke (full run is change F): `npm start`, open the URL printed in the terminal (`http://localhost:3001/<project-key>/visualizer`), see 7 cards and the two sub-menu entries; click each new card; browser console shows no errors. Needs manual steps M1/M2 from `plans/manual-steps.md`.
- [ ] 7.3 Cross-check with B/C: while on `/entity-diagram` and `/visualize-drilldown` open DevTools Network, filter `graphql|proxy`; expected: no 403. Record any 403 resource and add its scope (design D4). Also confirm with a View-only account (if M-steps allow) that the Entity Diagram "save" is disabled; if not, file it as a bug against change B.
- [x] 7.4 Update `specs/001-welcome/spec.md` (FR-003: seven cards, drop `visualize`; section 5 edge case replaced by "legacy `visualize` route intentionally removed") and `specs/001-welcome/quickstart.md` (delete the "Do not add cards" note, list the two new targets). Expected: `grep -rn "visualize\b" specs/001-welcome` has no stale statement.
- [x] 7.5 Hand-off note for change E: paste the final `oAuthScopes` arrays and the 7 submenu `uriPath`s into the bottom of `openspec/changes/connect-alignment/design.md` OR tell the owner of E; do not edit E's files yourself if it does not exist yet - put the list in your task log.
