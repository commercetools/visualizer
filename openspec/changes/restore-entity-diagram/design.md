## Context

Path convention: after change A the app lives in `visualizer/` inside this repo, so
`APP=<repo-root>/visualizer`. Source of truth for the old code is
the READ-ONLY repo `OLD=$SRC`, command
`git -C $OLD show e7cb4c4^:visualizer/src/components/entity-diagram/<file>`
(added in `f456d3b` "Entity diagram" by Behnam Tehrani, deleted in `e7cb4c4`; menu entry removed in
`3d8e4ba`). At `e7cb4c4^`, `routes.tsx` had
`<Route path={`${match.path}/entity-diagram`}><EntityDiagram /></Route>` and `welcome.tsx` had an
InfoCard "Entity Diagram" (target `entity-diagram`) - both belong to change D.

What the old feature is: 9 files, ~1,300 lines, **no UIKit at all** (verified by reading all 9 files).
It uses `@xyflow/react` (React Flow), `lodash` (`debounce`), `@commercetools-frontend/sdk`
(`useAsyncDispatch`, `actions.get`), `application-shell-connectors`, and the private package
`<private-shared-hooks-package>` (gone since `e7cb4c4`, replaced by `src/hooks/`
`use-custom-object-connector`, same names and shapes). It also uses Tailwind-style class names
(`text-sm`, `border`, `rounded`, `italic`...) that are not defined anywhere in this app, so they were
no-ops (or relied on a global stylesheet of the old host) - must be replaced.

Dependencies verified at HEAD of OLD (`visualizer/package.json`): `@xyflow/react ^12.11.6`,
`dagre ^0.8.5` (+`@types/dagre`) present (dagre is NOT needed by the entity diagram; it is used by
`states-flow.tsx`). `lodash` and `@commercetools-frontend/sdk` are NOT direct dependencies; both exist
only transitively (package-lock: `lodash 4.18.1`, `@commercetools-frontend/sdk 27.11.4` as a dependency
of `application-shell`). `custom-objects-list.tsx` already imports `lodash/debounce`, so lodash usage is
an accepted convention; the sdk we make explicit.

### What the diagram shows / interactions (reverse-engineered)
- Nodes: Product Types (blue), Custom Types (red), Custom Object schemas (green, written by another
  tool into container `mc-custom-object-schema`; value `{attributes:[{name,type,required,set,reference?,enum?}]}`).
- Edges ("links") are user-defined relations stored in the project itself as custom objects:
  `mc-link-data/linkDataList` and `mc-link-data/locationDataList` (value is a JSON *string* in the draft,
  a parsed JSON in query results - the GraphQL `value` scalar round-trips it).
- Interactions: pan/zoom/fit (React Flow `Controls`, `Background`, `fitView`), drag nodes (persist
  position), connect handles (new edge), click edge to select, Delete/Backspace deletes, double-click
  edge to add default labels, click label to edit (Enter commits, blur cancels).
- Data flow (old): `useConnector` fires 3 Apollo queries (schemas, link data, location data) and, on
  demand (`fetchAll`), 2 REST calls through the MC proxy; `ChangeProvider` merges them into `data`
  (nodes) and `links`, exposes `trackLinkChange/trackNodeChange`, saves debounced 1 s.

### Known defects of the old code (to fix while porting, behaviour otherwise unchanged)
| # | Defect | Effect | Fix in port |
|---|---|---|---|
| D1 | `fetchAll` returns `undefined` while the location query loads and the effect (deps `[linkData, locationData, schemas]`) does not re-run when the location object is `null` | blank page forever on a project that has no `locationDataList` yet (first run) | gate on "all three queries finished" flag, treat `null` as `[]` |
| D2 | Provider returns `null` until loaded: no spinner, no error, no empty state | confusing UX | explicit states |
| D3 | `schemas` memo reads `schemasRaw.results` without null check; deps only `[schemasRaw]` | crash if undefined without error | null-safe |
| D4 | only page 1, limit 200 | silent truncation | loop pages |
| D5 | effect re-runs after every own save (Apollo cache echo of the mutated CustomObject), refetching REST and resetting `links` | flicker, wasted calls | seed local state once |
| D6 | side effects (`debouncedSave...`) inside `setState` updaters; `useCallback(debounce(...))` | double invocation under `enableReactStrictMode` (entry-point enables it), stale deps | pure `applyLinkChange/applyNodeChange` + refs |
| D7 | pending debounced save lost on unmount | data loss | `flush()` on unmount |
| D8 | `data.label = ...` mutation of props in `custom-edge`, no re-render | label may not appear until next render | local `useState` for labels |
| D9 | `locationData.find(d => d.key === name ?? key)` (precedence) | harmless (name is required) but a lint smell | parenthesise |
| D10 | `onKeyPress` (deprecated), unstyled `<input>` | | Nimbus `TextInput`, `onKeyDown` |
| D11 | no permission check | view-only users get 403 toasts on save | `useIsAuthorized(Manage)` |
| D12 | colour strings only as CSS names, `<h3>` with inline styles | | keep colours (data), Nimbus text |

## Goals / Non-Goals

**Goals:**
- Same features, data format and look-and-feel (Nimbus) as the old Entity Diagram; existing stored
  `mc-link-data` objects keep working.
- Pure logic files restored (near) verbatim and covered by unit tests; UI re-implemented on Nimbus.
- Testable by jest and by Chrome DevTools E2E (change F) via stable test ids.

**Non-Goals:**
- Route, menu entry, Welcome card, scopes edits (change D), docs/screenshots (G).
- Auto-layout (dagre) of the entity diagram, relation inference from `reference` attributes, legend,
  export/import, undo - not in the old feature; candidates for the owner questions (see below).
- Switching the REST reads to GraphQL.
- Optimistic-concurrency handling (last write wins, as before).

## Decisions

1. **REST proxy (via `@commercetools-frontend/sdk`) stays for Product Types / Types.**
   `mapper.ts` is written against the REST shape (`attributes[].name`, `fieldDefinitions[].name`,
   `name` as plain string). A GraphQL port would change `name` to `nameAllLocales` and force locale
   handling, i.e. a behaviour change. Alternative (rejected): `productTypes`/`typeDefinitions` GraphQL
   queries with `mcApiContext` (would let us drop the sdk dep, but changes node labels). Cost: add
   `@commercetools-frontend/sdk` to `dependencies` (`^27.11.4`, same version as in the lock file).
   MC proxy target: `MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM` (from `@commercetools-frontend/constants`);
   URIs `/${projectKey}/product-types?limit=200&offset=N` and `/${projectKey}/types?...`.
2. **Custom objects via the existing inlined hooks** `useCustomObjectsFetcher`,
   `useCustomObjectFetcher`, `useCustomObjectCreatorOrUpdater` from `../../../hooks` (same API as the old
   package: `{customObjects|customObject, loading, error}`, `execute({draft})`). Context
   `mcApiContext` (`GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM`) is applied inside them.
3. **Seed-once local state** (fixes D1, D5): the provider keeps `links`, `locations` in `useRef` +
   `useState`; they are initialised exactly once when `isReady` becomes true; later Apollo updates are ignored.
4. **Pure change functions** `providers/apply-change.ts` (`applyLinkChange(links, change)`,
   `applyLocationChange(locations, change, knownNodeKeys)`) return the *same array reference* if nothing
   changed; the provider decides to save when the reference changed. This is the unit-test seam.
5. **Debounce** with `lodash/debounce` (convention in `custom-objects-list.tsx`), created in `useMemo`,
   `flush()` in effect cleanup. Do not add `lodash` to package.json in this change; record for H/A that it
   is transitive-only (see Open Questions).
6. **Permissions**: `useIsAuthorized({demandedPermissions:[PERMISSIONS.Manage]})`. If false the save
   functions are no-ops and a read-only `Alert` is shown. The menu entry will keep View (change D).
7. **Layout/height**: canvas height = viewport minus its top offset, same technique as
   `states-flow.tsx` (`useAvailableHeight`), re-implemented in `use-available-height.ts` (do not import
   from states-flow, it is not exported and changing it is out of scope). Replace the fixed 700px/black border.
8. **Colours**: keep `blue|red|green` strings from `mapper.ts` (they are data, stored nowhere); use them
   for border and legend dots via inline style like the old code. Text uses Nimbus `Text`/`Heading`.
9. **Node id collisions**: ids stay unprefixed to remain compatible with stored links. First wins +
   `console.warn` (owner question Q-ED2).
10. **Keep React Flow built-ins**: `Background`, `Controls`, `fitView`; keep both the built-in delete key
    and the custom `handleKeyDown` (idempotent `linkRemoved`), but guard against label editing via
    `isEditingLabel` as before.

### File-by-file port table
(`OLD:` = `e7cb4c4^:visualizer/src/components/entity-diagram/`; `NEW:` = `$APP/src/components/entity-diagram/`)

| Old file | New file | Treatment | Changes |
|---|---|---|---|
| `hooks/types.ts` | `hooks/types.ts` | **verbatim** | none |
| `hooks/mapper.ts` | `hooks/mapper.ts` | **near verbatim** | parenthesise `data.key === (productType.name ?? productType.key)` (D9); remove unused `index` args; add dedupe helper is NOT here |
| `utils.ts` | `utils.ts` | **verbatim** (+ keep `// @ts-ignore` only if tsc still needs it) | `nodeMapper` must tolerate malformed `loc` (NaN -> 0) |
| `hooks/index.ts` | `hooks/index.ts` | **rewrite around same API** | import hooks from `../../../hooks` instead of `<private-shared-hooks-package>`; export `isReady`, `error`; null-safe schemas; paginated `fetchAllProductTypes/Types`; `saveLinkData/saveLocationData` no-op unless `canManage`; surface save errors via `useShowNotification` |
| `providers/changes.tsx` | `providers/changes.tsx` | **rewrite** (same context shape `trackLinkChange, trackNodeChange, linkData, nodeData` + `status`, `error`, `canManage`) | seed-once, pure functions, refs, flush on unmount, node-id dedupe |
| (new) | `providers/apply-change.ts` | new pure logic | extracted from the `switch` blocks of old `trackLinkChange/trackNodeChange` (same semantics) |
| `custom-node.tsx` | `custom-node.tsx` | **UI re-implement** | `Box/Text/Heading` from Nimbus, no tailwind classes; keep `Handle` top/bottom (10px), `data.label/items/inheritedItems`; i18n for "Attributes"/"Inherited Attributes" (`useIntl`) |
| `custom-edge.tsx` | `custom-edge.tsx` | **mostly verbatim + UI swap** | `<input>` -> Nimbus `TextInput size="sm" aria-label`, `onKeyDown`, class `nodrag nopan`; labels in local state (D8); keep `getBezierPath`, label placement math, `foreignObject`, 20px interaction path |
| `canvas.tsx` | `canvas.tsx` | **verbatim logic**, wrapper restyled | wrapper `div` -> `Box` with `useAvailableHeight`; `data-testid="entity-diagram-canvas"`; replace `addEdge(newEdge, eds as any)` cast only if tsc allows |
| `index.tsx` | `index.tsx` | **re-implement** | `DefaultPage.Root/Header/Title/Content`; renders Loading/Error/Empty/read-only; wraps `ChangeProvider` |
| (new) | `messages.ts` | new | ids below |
| (new) | `use-available-height.ts` | new | copy of the hook in `states-flow.tsx` |
| (new) | `*.spec.ts(x)` | new | see test strategy |

### i18n keys (`messages.ts`, defineMessages, `EntityDiagram.*`)
`title` "Entity Diagram"; `loading` "Loading entity diagram"; `loadError` "The entity diagram could not
be loaded"; `saveError` "Your changes could not be saved"; `empty` "No product types, types or custom
object schemas found in this project."; `readOnly` "You have view-only access. Changes to the diagram are
not saved."; `attributes` "Attributes"; `inheritedAttributes` "Inherited Attributes"; `edgeLabelInput`
"Relation label"; `defaultFromLabel` "Label"; `defaultToLabel` "Relation" (the default labels are
persisted data; keep English literals "Label"/"Relation" as the old code did - do NOT translate them, they
are stored values); `canvasAriaLabel` "Entity diagram canvas". Add every key to `core.json`, `en.json`,
`de.json` (all three currently hold the same 404 keys; run `npm run extract-intl` which rewrites
`core.json`, then add the same keys with German text to `en.json`/`de.json` - copy order is alphabetical
case-insensitive).

### Permissions and scopes
| Need | Scope | Present in config? |
|---|---|---|
| read product types (REST) | `view_products` | yes |
| read types (REST) | `view_types` | yes |
| read custom objects | `view_key_value_documents` | yes |
| write link/location objects | `manage_key_value_documents` | yes |
Therefore **no scope change** for change D/E. UI permission: View to see, Manage to persist.

### Data flow
```
EntityDiagram (index.tsx)
 └ ChangeProvider ── useConnector()
      ├ useCustomObjectsFetcher({container:'mc-custom-object-schema', limit:200, offset:0}) -> schemas
      ├ useCustomObjectFetcher({container:'mc-link-data', key:'linkDataList'})      -> links0
      ├ useCustomObjectFetcher({container:'mc-link-data', key:'locationDataList'})  -> locations0
      ├ REST product-types pages, REST types pages (when the 3 queries are done)    -> nodes
      └ useCustomObjectCreatorOrUpdater().execute({draft:{container,key,value:JSON.stringify(list)}})
    status: loading | error | ready ; nodes = dedupe([...schemas, ...productTypes, ...types])
 └ Canvas (React Flow): nodeMapper/edgeMapper -> useNodesState/useEdgesState (initial only)
      onNodesChange -> trackNodeChange(position) ; onConnect/onEdgesChange/keys -> trackLinkChange
```
Node order [schemas, productTypes, types] is the old order and matters for id-collision "first wins".

### Test strategy
- Jest unit (`npm test`): `utils.spec.ts` (nodeMapper loc parse + malformed, edgeMapper, `buildUrlWithParams`
  with arrays/empty, `generateUUID` v4 shape/uniqueness), `hooks/mapper.spec.ts` (3 mappers, colours,
  inherited items, location lookup), `providers/apply-change.spec.ts` (add/duplicate add/modify/remove/
  text change from/to, node position new/existing, no-op returns same reference),
  `hooks/pagination.spec.ts` for the page loop (pure helper `fetchAllPages(fetchPage)`), and
  `index.spec.tsx` (component) following `states-list.spec.tsx`: `renderAppWithRedux` + `NimbusProvider`,
  msw `graphql.query('GetCustomObjects'|'GetCustomObject', ...)`; for the REST calls mock
  `jest.mock('@commercetools-frontend/sdk', ...)` `useAsyncDispatch` -> returns fixture (simplest; the
  sdk transport is not msw-friendly). Assert loading, error, empty, read-only alert (project permissions
  View only via `mapResourceAccessToAppliedPermissions([PERMISSIONS.View])`), and node names in the DOM.
  Pitfall: React Flow nodes have `visibility:hidden` in jsdom (no measuring); assert with `getByText`,
  not `toBeVisible`. Polyfills exist in `jest.setup.nimbus.js`; React Flow also needs
  `ResizeObserver` and `DOMMatrixReadOnly` (stub in the spec if "DOMMatrixReadOnly is not defined").
- Chrome E2E (change F) hooks: `data-testid`s `entity-diagram-canvas|loading|error|empty|readonly`;
  React Flow DOM: `.react-flow__node[data-id="<node id>"]`, `.react-flow__edge`, `.react-flow__handle`.
  Fixture for F (create via Custom Objects page of the app or MC API proxy): container `mc-custom-object-schema`,
  key `brand`, value `{"attributes":[{"name":"id","type":"string","required":true,"set":false},{"name":"title","type":"string","required":false,"set":false}]}`;
  a Product Type "Shoe" (attrs `size`,`color`) and a Type `order-extra` (field `note`). F script: open
  `/<projectKey>/visualizer/entity-diagram`, take snapshot (3 nodes), drag Shoe, drag handle to brand, reload
  and assert persistence, check network for `CreateOrUpdateCustomObject` count, verify Backspace-in-input.
- Quality gate before finishing: `npm run typecheck && npm run lint && npm test && npm run build`.

## Risks / Trade-offs

- [Provider rewrite diverges from "verbatim"] -> semantics of change events kept identical and covered by
  `apply-change.spec.ts`; the old file stays in `git show` for diffing.
- [`@commercetools-frontend/sdk` dispatch needs the Redux store] -> `ApplicationShell` provides it
  (`useAsyncDispatch` worked in the old app under the same shell); in tests use `renderAppWithRedux`.
- [REST page loop on large projects] -> 200/page, sequential; show the spinner; cap at 50 pages (10k) with a
  `console.warn` to avoid infinite loops on API misbehaviour.
- [Same-name collisions between Product Type name and Type key] -> first wins + warning; documented.
- [Last-write-wins on shared `mc-link-data` objects] -> accepted, as before.
- [Hidden Tailwind assumption] -> every class name from the old files is replaced; grep check in tasks.
- [Both built-in Delete and custom key handler fire] -> `linkRemoved` is idempotent.
- [`lodash`/`sdk` transitive deps] -> sdk made explicit here; lodash flagged to A/H (npm `--omit=dev` or a
  future dedupe can drop transitive packages).

## Migration Plan

Pure addition behind a route that does not exist until change D. Rollback = delete the folder and the
sdk dependency line. No data migration: stored objects keep their format.

## Open Questions

- Q-ED1: Who writes `mc-custom-object-schema`? (an external MC app?). If nothing, the green nodes never
  appear in a fresh project; keep reading it (compat) - owner to confirm.
- Q-ED2: Accept "first wins" for id collisions, or prefix ids (breaks stored links)?
- Q-ED3: Is a colour legend / auto-layout button wanted (new behaviour)? Default: no (Q1 default).
- Q-ED4: Add `lodash` (+`@types/lodash`) as direct dependencies in A/H? (used by custom-objects-list too).
