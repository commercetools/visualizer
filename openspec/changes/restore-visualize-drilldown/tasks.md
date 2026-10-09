Conventions for every task: run commands from `visualizer/` (the folder with `package.json`) unless stated.
"OLD" = `git -C $SRC show e7cb4c4^:visualizer/src/components/visualize-drilldown/<file>`
(read-only repo, never edit it). "NEW" = `visualizer/src/components/visualize-drilldown/` in this repo.
Read `design.md` first; every task name below points to the design section that explains the why.

## 0. Preflight

- [x] 0.1 Confirm change A (`import-baseline`) is finished.
  - Run: `cd visualizer && npm ci && npm run typecheck && npm test && npm run build`.
  - Expected: all four exit 0. If not, stop: this change needs the baseline (Nimbus, jest setup, test-utils).
  - Verify: `ls src/components/states/states-list/states-flow.tsx src/test-utils/index.tsx jest.test.config.js` lists all three.
- [x] 0.2 Re-read the sibling artifacts that touch the same files: `openspec/changes/restore-entity-diagram/{proposal,design}.md` and `openspec/changes/wire-routes-and-welcome/design.md`.
  - Why: all three add lines to `package.json` and `src/i18n/data/*.json`; and D (`wire-routes-and-welcome`) imports our default export with no props.
  - Pitfall: do not rename the folder or the default export.
- [x] 0.3 Export the old sources to a scratch folder so you can read them side by side.
  - Run: `mkdir -p /tmp/drilldown-old && cd $SRC && for f in $(git ls-tree -r --name-only e7cb4c4^ visualizer/src/components/visualize-drilldown); do mkdir -p /tmp/drilldown-old/$(dirname ${f#visualizer/src/components/visualize-drilldown/}); git show e7cb4c4^:$f > /tmp/drilldown-old/${f#visualizer/src/components/visualize-drilldown/}; done`
  - Expected: `find /tmp/drilldown-old -type f | wc -l` prints 18.
  - Pitfall: this is a reading aid only. Do NOT copy the files into the repo as-is (they import UIKit and `d3`).

## 1. Dependencies and jest configuration (design D1, D2)

- [x] 1.1 Add runtime dependencies.
  - Run: `npm install @commercetools-frontend/sdk@^27.11.4 @visx/hierarchy@^4.0.0` (types ship inside `@visx/hierarchy`; it depends on `@types/d3-hierarchy@1`).
  - Expected: `package.json` gains two lines; `package-lock.json` changes; `npm ls @commercetools-frontend/sdk` shows one version equal to the other `@commercetools-frontend/*` packages (27.x); `npm ls react` shows no second React copy and no `ERESOLVE`/peer warning for `@visx/hierarchy`. If `restore-entity-diagram` already added the sdk line, keep one.
  - Pitfall: if npm resolves a different major for `sdk`, pin it to the exact version shown by `npm ls @commercetools-frontend/application-shell` dependencies.
- [x] 1.2 Licence check (feeds the gate's foreign-copyright and `labs-compliance` third-party review). For every new package in the tree: `npm ls --all --parseable @visx/hierarchy | xargs -I{} node -e "const p=require('{}/package.json');console.log(p.name,p.version,p.license)"`.
  - Expected: `@visx/hierarchy` MIT, `@visx/group` MIT, `classnames` MIT, `d3-hierarchy` 1.x BSD-3-Clause, `@types/d3-hierarchy` MIT. Anything else (GPL, AGPL, unknown, no licence) -> STOP and ask the owner; BSD-3-Clause is accepted as permissive.
  - Confirm no licence text is copied into tracked files: `git grep -n "Copyright" -- ':!LICENSE' ':!package-lock.json' | grep -v -i commercetools` stays empty for files this change adds. Write the result as a one-line comment in the PR/commit notes (not in code).
- [x] 1.3 Spike `@visx/hierarchy` in jest and build (timebox 30 minutes). Throw-away test `src/tmp-visx.spec.tsx`: render `<Treemap root={hierarchy({children:[{id:'a',value:1},{id:'b',value:1}]}).sum((d:any) => d.value || 0)} size={[400, 200]} tile={treemapSquarify}>{(t) => <div data-testid="n">{t.leaves().length}</div>}</Treemap>` and expect `2`. Run `npx jest --config jest.test.config.js src/tmp-visx.spec.tsx` -> 1 passed. No `transformIgnorePatterns` edit should be needed (CJS entry). Delete the file afterwards.
  - If it fails (ESM error, React 19 type error, or the `Treemap` API differs in 4.0.0): follow the fallback ladder of design D1 in order (`@nivo/treemap`, `recharts`, then direct `d3-hierarchy` ^3 + `transformIgnorePatterns: ['/node_modules/(?!(d3-hierarchy)/)']` in `jest.test.config.js` - extend the preset's pattern, do not replace it blindly: print it with `node -e "console.log(require('@commercetools-frontend/jest-preset-mc-app/typescript/jest-preset.js').transformIgnorePatterns)"`), re-run task 1.2 for the replacement, and record the decision under D1 in `design.md`.

## 2. Spike: how requests look in tests (design D2) - throw-away, 20 minutes

- [x] 2.1 Create `src/components/visualize-drilldown/hooks/use-ct-rest.ts` containing only: `useAsyncDispatch` from `@commercetools-frontend/sdk`, `MC_API_PROXY_TARGETS`, `useApplicationContext` for `project.key`, and a `get(endpoint, params)` that builds `/${projectKey}${endpoint}?${query}` with `encodeURIComponent` and returns `dispatch(sdkActions.get({ mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM, uri }))`.
- [x] 2.2 Write a temporary spec `use-ct-rest.spike.spec.tsx` that renders a tiny component calling `get('/stores', { limit: '20' })` inside `renderAppWithRedux` (copy the setup from `states-list.spec.tsx`), with an msw server (`setupServer()`, `onUnhandledRequest: 'error'`) and NO handlers.
  - Expected: the test fails and msw prints the unhandled request, e.g. `GET http://localhost/proxy/ctp/<project>/stores?limit=20`. Write the exact URL pattern into the top of `design.md`'s "Tests" section note (one line) and into a constant in `src/test-utils/models/drilldown.ts` (`PROXY_BASE`).
  - Then add `rest.get('*/proxy/ctp/:projectKey/stores', (req, res, ctx) => res(ctx.json({ results: [], total: 0 })))` (import `rest` from `msw`) and see it pass.
  - Then answer with `res(ctx.status(403), ctx.json({ statusCode: 403, message: 'Forbidden' }))` and `console.log` the caught error: record which property holds the status (`statusCode`? `status`?). Put the finding into `isForbiddenError` (task 3.3).
  - Pitfall: if the dispatch never resolves, the test render has no redux store with the sdk middleware - use `renderAppWithRedux`, not `renderApp`.
- [x] 2.3 Delete the spike spec (keep `use-ct-rest.ts`, you will finish it in 5.1). Verify `git status` shows no `*.spike.spec.tsx`.

## 3. Pure utilities, test first (design D3, D5, D6)

Create each `utils/<name>.ts` together with `utils/<name>.spec.ts`. Run one file with `npx jest --config jest.test.config.js src/components/visualize-drilldown/utils/<name>.spec.ts`.

- [x] 3.1 `types.ts`: copy OLD `types.ts`, then (a) allow `BaseEntity.name` to be `string | Record<string, string> | Money`, (b) add `export interface RelationFailure { entityType: EntityType | QueryEntityType; statusCode?: number }`, (c) add `truncated?: boolean` to `DrilldownData`, (d) keep exactly one `SortDirection` (delete the duplicate in the constants file later).
  - Verify: `npm run typecheck` still passes (nothing imports it yet).
- [x] 3.2 `utils/where-predicate.ts` (D6): `escapeString`, `quote`, `inList(values, max = 100) => { predicate: string; truncated: boolean }`.
  - Tests: `escapeString('a"b\\c')` equals `a\"b\\c` (backslash first, then quote); `quote('x')` equals `"x"`; `inList(['a','b'])` predicate `("a","b")`, truncated false; 150 values give 100 entries and `truncated: true`; empty list returns `null` predicate (caller skips the request).
  - Why: the old code concatenated raw user text into `where` (search box injection / 400 errors).
- [x] 3.3 `utils/ct-rest.ts`: `buildQuery(params: Record<string, string | undefined>)` -> `a=1&b=2` with `encodeURIComponent`, skipping empty values, stable key order (limit, offset, where, sort, expand); `isForbiddenError(e)` using the property found in 2.2.
  - Tests: spaces become `%20`; quotes become `%22`; undefined skipped; exact string equality for `{limit:'20',offset:'0',where:'key in ("a")',sort:'key asc'}`.
- [x] 3.4 `utils/extract-name.ts` (`extractName(entityOrNode, { dataLocale, projectLanguages, locale })`): string name; LocalizedString map (dataLocale, then each project language, then first value); Money (`Intl.NumberFormat(locale, {style:'currency', currency})` with `minimumFractionDigits/maximumFractionDigits` from `new Intl.NumberFormat(locale,{style:'currency',currency}).resolvedOptions().maximumFractionDigits`, divide centAmount by `10 ** digits`); fallback key then id.
  - Tests: de/en maps, fallback to first value, `JPY 1500` -> contains `1,500` and not `15`, `KWD 1500` (3 digits) -> `1.500`, missing name -> key -> id.
  - Why: old code divided by 100 for every currency and used only `dataLocale in name`.
- [x] 3.5 `utils/relationship-constants.ts` (+ optional split, design D9): port OLD `relationship-contstants.ts` (fix the filename typo). Replace every `` `...${x}...` `` predicate by `quote()`/`inList()` calls; endpoints, expand, name fields, sortable fields and search fields unchanged; remove `DEFAULT_COLORS` and `ENTITY_LABELS` (moved to `colors.ts` and messages). Keep `ALL_ENTITY_TYPES`, `NON_ROOT_ENTITY_TYPES`.
  - Tests (`relationship-queries.spec.ts`): one `it.each` row per line of the design table "Relationship queries" asserting the exact `where` / endpoint for a fixture parent; plus: BU with 150 associates -> 100 ids and `truncated`; store without key -> `null` for `store->cart-discount`.
  - Pitfall: `RELATIONSHIP_QUERIES['store->cart-discount']` returned `where: ''` when the key was missing - return `null` instead so no request is sent.
- [x] 3.6 `utils/relationships.ts` and `utils/relationship-utils.ts`: copy unchanged. Test `relationshipManager.getRootEntityTypes()` equals `['business-unit','store','customer-group','product-selection','channel','category']` (order as in OLD) and `getChildrenForEntityType('store')` has 5 entries.
- [x] 3.7 `utils/colors.ts` (D3): `ENTITY_COLORS: Record<EntityType, string>` from the design table, `getInkColor(hex)` (WCAG relative luminance; return `#000000` or `#ffffff`, whichever has the higher contrast), `contrastRatio(a, b)`.
  - Tests: for every parent in `relationships.ts`, children's colours are pairwise different (`new Set(colors).size === children.length`); `contrastRatio(ink, fill) >= 4.5` for all 8 fills; every `EntityType` has a colour.
  - Verify the palette itself: `node <dataviz-skill-dir>/scripts/validate_palette.js "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300,#4a3aa7,#e34948" --mode light` (use `find / -name validate_palette.js 2>/dev/null | head -1` if the path moved). Expected: adjacent CVD/normal-vision PASS; contrast WARN for the three light slots (accepted: relief = labels + accessible names). Paste the result summary into a code comment above `ENTITY_COLORS`.
- [x] 3.8 (replaced) no own layout code: layout comes from `@visx/hierarchy` (design D1). Add the small pure helper `toTreemapData(nodes): {id; value}[]` in `components/treemap-chart.tsx` (value 1 per entity, 0.5 for load-more); its test is part of 5.5.
- [x] 3.9 `utils/concurrency.ts`: `runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number, isCancelled: () => boolean)`; results delivered through an `onResult(index, value)` callback.
  - Tests with jest fake timers: 10 tasks, limit 4 -> a counter of running tasks never exceeds 4; after `isCancelled()` turns true no new task starts; a rejecting task does not stop the others.
- [x] 3.10 `utils/entity-summaries.ts` (D5): table per entity type with `local` or `query` + `format`. Message ids `VisualizeDrilldown.summary.*` are added in 6.1; the module returns `{ id: 'storesCount', values: { count } }` descriptors, and the component formats them (keeps the util React-free).
  - Tests: product with 2 variants -> `variants` count 3 and categories count from `masterData.current.categories`; BU -> associates = associates + inheritedAssociates, stores = stores.length; cart-discount -> stores count; standalone-price with `discounted` -> value formatted by `extractName` rules; types with `query` list the right endpoint and use `limit=1`.
  - Pitfall: do NOT port `store->category`, `cart-discount->store`, `customer->customer-group` queries (dead code in OLD, see design D5).
- [x] 3.11 `utils/search.ts`: `buildSearchWhere(entityType, text, dataLocale) => string | null` (table in design "Relationship queries" under root search), `hasSearch(entityType)`, `SORTABLE_FIELDS`, `SEARCH_FIELD_KEYS`.
  - Tests: Berlin on store gives `name(de="Berlin")` for dataLocale `de`; falls back to `en-US`; `a"b` escaped; type without mapping -> `null`.
- [x] 3.12 `utils/navigation-reducer.ts` (D4): pure reducer + initial state; actions listed in design.
  - Tests: `selectType` clears breadcrumbs/search/sort/selectedEntity; `drillInto` appends breadcrumb with `level + 1` and clears search/sort; `goToLevel(1)` keeps only breadcrumbs with `level <= 1`; `goToRoot` empties the trail; `toggleType`/`showAll`/`hideAll`.
- [x] 3.13 Run all utils tests: `npx jest --config jest.test.config.js src/components/visualize-drilldown/utils`. Expected: all pass, no console warnings. Run `npm run lint -- src/components/visualize-drilldown` (expected: 0 errors) and `npm run typecheck`.

## 4. Hooks (design D2, D4, D5)

- [x] 4.1 Finish `hooks/use-ct-rest.ts` with `buildQuery`, `isForbiddenError`; return `{ get, projectKey }`; throw a typed `MissingProjectError` when `project.key` is empty (spec: "Missing project").
- [x] 4.2 `hooks/use-container-width.ts`: `useContainerWidth(defaultWidth = 800)` returns `{ ref, width }`; uses `ResizeObserver` (guard `typeof ResizeObserver === 'undefined'`), updates inside `requestAnimationFrame`, and ignores changes < 2 px.
- [x] 4.3 `hooks/use-entity-name.ts`: `useEntityName()` returns `(entityLike) => string` using `useApplicationContext` (`dataLocale`, `project.languages`) and `useIntl().locale`, delegating to `extractName` (replaces OLD `use-entity-fetcher.ts`).
- [x] 4.4 (tests live in `visualize-drilldown.spec.tsx`: stale response, load more, 403 partial failure, unmount) `hooks/use-drilldown-fetcher.ts`: port OLD with the changes of design D4: `requestIdRef`, `isMountedRef`, `levelsRef` for `loadMore`, per-relation `try/catch` returning `failures`, page size constant `PAGE_SIZE = 20`, `fetchPage(endpointKey, queryArgs, offset, searchSort)`, `hasMore = offset + PAGE_SIZE < total`, `total = response.total ?? offset + results.length`, 200-tile cap (design "Performance"), `truncated` propagated from `inList`. Public API: `{ levels, loading, error, failures, fetchRoot, fetchRelated, loadMore, reset }`.
  - Remove all `console.log`. Keep `console.error` out too: surface errors through state.
  - Expand handling stays: if `ENDPOINTS_WITH_EXPAND[type]` and `entity[expand]?.obj` use that object, else keep the reference object (name falls back to id).
  - Tests (`use-drilldown-fetcher.spec.tsx`, `renderHook` inside the app-shell wrapper from 2.2, msw handlers): root load sets `levels[0]` with pagination; `loadMore` appends and updates offset; two quick `fetchRoot` calls where the first response is delayed -> state equals the second; 403 on one of two relations -> one level + one failure; unmount during request -> no warning (spy on `console.error`).
- [x] 4.5 (tests live in `visualize-drilldown.spec.tsx`: concurrency, load more keeps lines, 500 silent) `hooks/use-additional-data.ts` (D5): input = current level entities; builds a task per entity+summary, local ones are resolved synchronously, request ones run through `runWithConcurrency(…, 4, isCancelled)`, results merged in a `Map` (key `levelKey|entityId`), `generationRef` incremented when `levelKey` changes, `loading` true while tasks remain. Returns `{ summaries: Map<string, SummaryDescriptor[]>, loading }`.
  - Tests: 20 stores with 2 query summaries -> max 4 concurrent requests (count in msw handler); change level mid-way -> late results ignored; load more -> earlier entries kept; a 500 on one request -> others still present, no error state.

## 5. Components (design D1, D7, D9, D10)

For each component: write a `<name>.spec.tsx` first (render inside `NimbusProvider` + `renderAppWithRedux` helper from 2.2, no network), then the component. Use `screen.getByRole`. `onPress` for Nimbus buttons.
Before using an unfamiliar Nimbus component run the MCP tool `get_component(name, 'implementation')` (or open `node_modules/@commercetools/nimbus` docs) - do not guess props.

- [x] 5.1 `components/entity-selector.tsx`: `Heading as="h2"`, description `Text`, row of `Button` per root type: `variant={selected ? 'solid' : 'outline'}`, `colorPalette="primary"`, `aria-pressed`, `isDisabled={loading}`, `data-testid="drilldown-entity-type-<type>"`. Label = plural message.
  - Test: 6 buttons, none pressed initially; press calls `onEntityTypeSelect('store')`; disabled when `loading`.
- [x] 5.2 `components/search-and-sort-controls.tsx`: `SearchInput` (controlled `value`, `onSubmit`, `onClear`, `aria-label` from message, `data-testid="drilldown-search"`), sort `ToggleButton size="xs"` with `isSelected` for the active field and `aria-label` "Sort by Key, ascending"; cycle none, asc, desc, none; "Currently sorting by" caption.
  - Test: typing `Berlin` + Enter calls `onSearchChange('Berlin')`; clear button calls `onClearSearch`; pressing Key 3 times emits asc, desc, none; hidden when the type has neither search nor sort.
  - Pitfall: SearchInput `onChange` fires on every key; only `onSubmit` triggers a request (old behaviour). Keep a local draft state, sync it when the parent resets `searchQuery`.
- [x] 5.3 `components/breadcrumb-navigation.tsx` (D7): `<nav aria-label>` + `<ol>`; Root button with `Home` icon; each item `ChevronRight` + `Button variant="ghost" size="xs"`; last item `aria-current="page"` and still pressable (no-op); `...` as plain `Text` when more than 3.
  - Test: 4 breadcrumbs -> items: Root, ..., last 3; press level 1 item calls `onNavigateToLevel(1)`; press Root calls `onNavigateToRoot`; nothing rendered for `[]`.
- [x] 5.4 `components/interactive-legend.tsx`: row of `ToggleButton` (swatch `Box` 12x12 with `bg` = colour, label `Stores (20 of 45)`), then ghost `Button` Hide all / Show all; `data-testid="drilldown-legend-<type>"`.
  - Test: `aria-pressed` reflects visibility; toggle calls handler with the type; "Hide all" switches to "Show all" when all hidden.
- [x] 5.5 `components/treemap-chart.tsx` (D1, D3): props `{ nodes, width, height, onNodeClick, getName }`. `Box position="relative"` with explicit pixel `width`/`height`; wrapped in visx `<Treemap root=... size={[width,height]} tile={treemapSquarify} paddingInner={2} round>`; in its render prop each leaf becomes a `<button type="button">` absolutely positioned from `leaf.x0/y0/x1/y1`, `bg` = colour from `ENTITY_COLORS` (inline style prop on our own button: the dataviz palette is applied by us, `@visx/hierarchy` draws nothing and has no theme), `color` = `getInkColor`, text via CSS ellipsis/line-clamp, hidden text when tile < 60 x 30, `aria-label`, `data-testid="drilldown-tile-<id>"`, `data-entity-type`; wrapped in `Tooltip.Root` with `Tooltip.Content` (name, type label, summary lines). "Load more" tile: dashed border, `neutral` fill, text "...", `aria-label` "Load more <plural label>".
  - Test also (E2E-hook contract): the container has `data-testid="drilldown-treemap"`, every tile `drilldown-tile-<id>` + `data-entity-type`; layout invariants (tiles inside the box, no overlaps, weight 0.5 smaller than weight 1) asserted on the rendered style values using the real library.
  - Focus ring must be visible (do not set `outline: none` without a replacement; use Nimbus `_focusVisible` style prop).
  - Test: N nodes render N buttons; Enter on a focused tile calls `onNodeClick`; tile accessible name includes the type label; tooltip text appears after `user.tab()` + `findByRole('tooltip')`; load-more tile name; no tile text when the rect is small (pass `width=60, height=30` for 50 nodes).
- [x] 5.6 `components/multi-level-treemap.tsx`: hooks first, returns after; builds nodes from the current level (weight 1, load-more 0.5), filters hidden types, maps legend (counts/totals), shows `Text size="xs"` "Loading details..." when `useAdditionalData().loading`, the "Entity details" `Button variant="outline"` with `ChevronRight` (singular label of the selected type) and the hint caption for root vs deeper levels; chart size from `useContainerWidth`: `height = clamp(360, rows * 30, 700)`.
  - Test: hides tiles of a toggled type without calling fetch; all hidden -> message + Show all; summaries lines appear in tooltip text after the mocked request.
- [x] 5.7 `components/entity-info-panel.tsx`: `Drawer.Root isOpen onOpenChange` (right), `Drawer.Content`, `Drawer.Header` with `Drawer.Title` and `Drawer.CloseTrigger`, `Drawer.Body` with label/value pairs (`Text size="sm" color="neutral.11"` label + `Text` value) and the JSON in `<Box as="pre" fontSize="sm" maxHeight="400px" overflow="auto" bg="neutral.3" padding="300" borderRadius="200">`. Dates: `Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })` or `NO_VALUE_FALLBACK` (from `@commercetools-frontend/constants`) when missing/invalid.
  - Test: closed -> no dialog; open -> `getByRole('dialog')` contains id, key, version and JSON text; Escape calls `onClose`; missing `createdAt` shows the fallback, never "Invalid Date".

## 6. Messages, page, i18n (design "i18n", D4, D8)

- [x] 6.1 `messages.ts`: copy OLD `messages.ts` ids, then add: `entityType.<type>.singular|plural` (11 x 2), `selectPrompt`, `legendCount`, `legendCountOfTotal`, `loadMoreAria`, `detailsButton` ({entityType} details), `emptyRelated`, `forbiddenRoot`, `forbiddenRelation`, `loadFailed`, `missingProject`, `truncatedNote`, `showingFirst`, `breadcrumbAriaLabel`, `sortAria`, `searchAria`, `tileAria`, `loadingDetails`, `summary.*` (variants, associates, stores, divisions, customers, products, standaloneprices, categories, subcategories, channels, productSelections, businessUnits, customerGroups, discountedTo) using ICU plurals.
  - Every message needs a `description` for translators when the text is ambiguous.
  - Verify: `npm run extract-intl` then `git diff --stat src/i18n/data/core.json` shows only additions with prefix `VisualizeDrilldown.`.
- [x] 6.2 Translate: add the same ids to `src/i18n/data/en.json` (text = defaultMessage) and `de.json` (German). Keep keys sorted case-insensitively. Verify: `node -e "for (const l of ['en','de']) { const j=require('./src/i18n/data/'+l+'.json'); const core=require('./src/i18n/data/core.json'); const missing=Object.keys(core).filter(k=>!(k in j)); console.log(l, 'missing', missing.length) }"` prints `missing 0` for both.
  - Pitfall: `core.json` is generated - never hand-edit it; if another change edited the three files, re-run `npm run extract-intl` after merging.
- [x] 6.3 `visualize-drilldown.tsx`: `DefaultPage.Root/Header/Title/Content` + selector + (root) search/sort + (deeper) breadcrumbs + `Alert`s (`drilldown-error`, `drilldown-warning`, `drilldown-empty`) + `LoadingSpinner` (`drilldown-loading`) + `MultiLevelTreemap` + `EntityInfoPanel`. Reducer from 3.12; effect: fetch root when `selectedType && isAtRoot` and `[search, sort]` change (as OLD). Node click: set selected entity; if the type has children: reducer `drillInto` + `fetchRelated`. Load-more click: `loadMore(level, type)` (root: pass search/sort). If `fetchRelated` returns no levels show `emptyRelated`.
  - 403 handling: root load 403 -> `Alert colorPalette="critical"` with `forbiddenRoot`; relation failures -> `Alert colorPalette="warning"` listing type labels.
  - `index.ts`: `export { default } from './visualize-drilldown';`.
  - Verify: `npm run typecheck && npm run lint -- src/components/visualize-drilldown` both clean; `grep -rn "console\." src/components/visualize-drilldown --include=*.ts --include=*.tsx | grep -v spec` prints nothing; `grep -rn "uikit" src/components/visualize-drilldown` prints nothing.

## 7. Page-level tests with msw (spec scenarios)

- [x] 7.1 `src/test-utils/models/drilldown.ts`: fixture builders (`aStore`, `aBusinessUnit`, `aCategory`, `aProductSelection`, `aCustomerGroup`, `aChannel`, `aCustomer`, `aProduct`, `aStandalonePrice`, `restList(results, total, offset)` returning `{ limit: 20, offset, count, total, results }`) and `PROXY_BASE` from 2.2.
- [x] 7.2 `visualize-drilldown.spec.tsx`: one `describe` per spec requirement, one `it` per scenario of `specs/visualize-drilldown/spec.md` (Initial state; selecting loads; switching clears; search escaped - assert the intercepted `where` query parameter; sort cycle; stale response; load more twice with 45 stores; BU to stores request URL; BU without relations; one relation 403; product selection endpoints; leaf customer; breadcrumbs collapsing; legend toggle without request; "20 of 45"; all hidden; summaries do not block; concurrency <= 4; drawer open/close; missing createdAt; root 403 alert; missing project; 500 associates truncated; unmount clean; German locale via `renderAppWithRedux({ locale: 'de' })` if supported else test messages in `de.json` have the same ids).
  - Handler pattern: `mockServer.use(rest.get(`${PROXY_BASE}/stores`, (req, res, ctx) => { requests.push(req.url.searchParams.toString()); return res(ctx.json(restList(...))); }))`.
  - Pitfall: `searchParams.get('where')` is already decoded; assert on decoded strings.
  - Pitfall: end each test with `await cleanup()` (see `states-list.spec.tsx`); set `jest.setTimeout(20000)`.
  - Verify: `npx jest --config jest.test.config.js src/components/visualize-drilldown` all pass; run twice to catch flakiness.
- [x] 7.3 Whole-suite check: `npm run typecheck && npm run lint && npm test && npm run build`.
  - Expected: all exit 0; `build` output contains no warning about `@visx/hierarchy`; run `npm ls --all | grep -i -E 'gpl|unlicensed'` equivalent from 1.2 once more; the `routes` chunk is unchanged (this change is not imported anywhere yet).

## 8. Hand-off to sibling changes (no code in other folders)

- [x] 8.1 Write the facts the other changes need into comments of this change's `design.md` only if they changed during implementation: final scope list (9.3), proxy URL, error shape.
- [x] 8.2 Confirm the public interface: `node -e` is not enough - open `index.ts` and check `export { default } from './visualize-drilldown';`. `wire-routes-and-welcome` mocks this module in `routes.spec.tsx` with `jest.mock('./components/visualize-drilldown', ...)`.
- [x] 8.3 List the `data-testid`s actually implemented and update design section "E2E hooks" if any name differs (change F reads it).

## 9. Real-project verification (needs a logged-in Merchant Center session, a maintainer step; may be postponed to change F, but 9.3 decides scopes)

- [ ] 9.1 Temporarily mount the page for manual testing without committing: in a local, uncommitted edit of `src/routes.tsx` add `<Route path={`${match.path}/visualize-drilldown`}><VisualizeDrilldown /></Route>` before the catch-all (or wait for `wire-routes-and-welcome`). Run `npm start`, open the app in the logged-in MC project.
  - Pitfall: revert the temporary edit (`git checkout src/routes.tsx`) before finishing, unless `wire-routes-and-welcome` already owns that file.
- [ ] 9.2 Click through: each root type, a drill of 2 levels, load more, search, sort, legend, drawer. In Chrome DevTools Network: only `GET .../proxy/ctp/...`; no more than 4 summary requests in flight; no 4xx other than expected.
- [ ] 9.3 Scope check. With the current `oAuthScopes` the old behaviour was 403 for Categories, Cart Discounts, Standalone Prices. After `wire-routes-and-welcome` adds `view_categories`, `view_cart_discounts`, `view_standalone_prices`, repeat: Categories root, Store to cart discounts, Product to standalone prices must show data. Open the Customer Groups root: if 403, read the response body - it names the missing scope - and report it (expected `view_customer_groups`) to `wire-routes-and-welcome`/`connect-alignment`. Record the verified table in `design.md` "OAuth scopes".
  - Why: the spec requires that the documented scope list is verified.
- [ ] 9.4 Revoke test: in MC, as a user without the Products view permission (or by temporarily removing a scope in `custom-application-config.mjs` and running `npm run sync`/restart), confirm the warning/critical alerts of spec "Permission-aware data access" appear and the page stays usable.
- [ ] 9.5 Final gate: `npm run typecheck && npm run lint && npm test && npm run build` (all exit 0), `git status` shows changes only in `src/components/visualize-drilldown/`, `src/test-utils/models/drilldown.ts`, `src/i18n/data/*.json`, `package.json`, `package-lock.json`, `jest.test.config.js`; mark every box above `[x]`.
