## ADDED Requirements

### Requirement: Page shell and entity-type selection
The page SHALL render a Nimbus `DefaultPage` with a localized title and description, and an entity-type
selector listing exactly the root entity types of the relationship graph: Business Units, Stores,
Customer Groups, Product Selections, Channels, Categories. No type SHALL be selected, and no request SHALL be
sent, until the user selects one. Selecting a type SHALL reset search, sort, breadcrumbs, hidden-type filters
for the previous view and previously loaded data, and SHALL load the first page of that type.

#### Scenario: Initial state
- **WHEN** the page is opened
- **THEN** the six root-type buttons are shown, none is pressed, a prompt text is shown, and no REST request has been made

#### Scenario: Selecting a type loads it
- **WHEN** the user presses "Stores"
- **THEN** that button is marked pressed (`aria-pressed="true"`), a loading indicator is shown while the request runs, and then a treemap of at most 20 store tiles is shown

#### Scenario: Switching type clears state
- **WHEN** the user has typed a search text and drilled two levels deep in Business Units and then presses "Categories"
- **THEN** the breadcrumb trail is gone, the search box is empty, and only Categories are shown

#### Scenario: Selector disabled while loading
- **WHEN** a request is in flight
- **THEN** the selector buttons are disabled so two root loads cannot race

### Requirement: Root-level paging, search and sort
For the selected root type the page SHALL fetch pages of 20 entities (`limit=20&offset=n`). When the server
reports more entities than loaded, a dashed "Load more" tile SHALL be shown; pressing it SHALL fetch the next
page and append (never replace) the entities. The page SHALL offer a search box and sort buttons per entity
type as defined in the design (search field and sortable fields per type). Search SHALL be sent as a
server-side `where` predicate; sort SHALL be sent as `sort=<field> <asc|desc>`; only one sort field is active
at a time; pressing an active sort button cycles asc, desc, none. Search and sort SHALL only be offered at
root level and SHALL be reset when the user drills down or navigates.

#### Scenario: Load more appends
- **WHEN** 45 stores exist and the user presses the "Load more" tile twice
- **THEN** requests with `offset=20` and `offset=40` are sent, 45 tiles are shown, and the "Load more" tile disappears

#### Scenario: Search is server side
- **WHEN** the user submits the text `Berlin` in the Stores search box
- **THEN** one request is sent with `where=name(<dataLocale>="Berlin")` and the treemap shows only the response

#### Scenario: Search text cannot break the predicate
- **WHEN** the user submits `a"b\c` in any search box
- **THEN** the double quote and the backslash are escaped in the `where` predicate (`a\"b\\c`) and the API does not return a 400 syntax error

#### Scenario: Sort cycling
- **WHEN** the user presses "Key" three times
- **THEN** requests carry `sort=key asc`, then `sort=key desc`, then no `sort` parameter, and the button label shows an up arrow, a down arrow, and nothing respectively

#### Scenario: Stale response is ignored
- **WHEN** the user submits search "a" then immediately "ab" and the response for "a" arrives last
- **THEN** the treemap shows the results for "ab"

### Requirement: Drill down through related entities
Pressing a tile whose entity type has children in the relationship graph SHALL (a) store the entity as the
"selected entity", (b) reset search and sort, (c) append a breadcrumb, and (d) fetch, for every child type of
the graph, the entities related to the pressed entity, using the relationship queries defined in the design.
Only child types with at least one entity SHALL be shown. Pressing a tile of a type without children SHALL
only select it (details can be opened) and SHALL NOT change level. The relationship graph SHALL be exactly:
business-unit to store, associate, business-unit; store to business-unit, product-selection, channel,
cart-discount, customer; customer-group to customer; product-selection to product, store; channel to store;
associate to business-unit; product to product-selection, standalone-price, category; standalone-price to
product; category to product, category.

#### Scenario: Business unit to stores
- **WHEN** the user presses a Business Unit tile that has two stores
- **THEN** a request `GET /stores?where=key in ("a","b")` is sent and two Store tiles (with a Store legend entry) are shown at level 1

#### Scenario: Business unit without relations
- **WHEN** the pressed Business Unit has no stores, no associates and no sub-units
- **THEN** an informational "no related entities" message is shown instead of an empty chart, and the breadcrumb still allows going back

#### Scenario: One relation fails
- **WHEN** the associates request returns 403 and the stores request succeeds
- **THEN** the store tiles are shown and a warning names the entity type that could not be loaded

#### Scenario: Product selection uses sub-resource endpoints
- **WHEN** the user presses a Product Selection tile
- **THEN** products are requested from `/product-selections/{id}/products?expand=product` and stores from `/stores?where=productSelections(productSelection(id="{id}"))`

#### Scenario: Leaf type
- **WHEN** the user presses a Customer tile (Customers have no children)
- **THEN** the level does not change and the "Entity details" button becomes available for that customer

### Requirement: Breadcrumb navigation
Below the selector a breadcrumb trail SHALL show Root plus one item per drilled entity, labelled
`<name> (<type>)`. At most the last three drilled items SHALL be shown, preceded by a non-interactive "..."
item when more exist. Pressing an earlier item SHALL show that level without refetching deeper levels'
parents; pressing Root SHALL return to the root list of the selected type (and refetch it). The trail SHALL be
a `<nav>` landmark with an accessible name and the current item SHALL carry `aria-current="page"`.

#### Scenario: Four levels deep
- **WHEN** the user has drilled four levels
- **THEN** the trail shows Root, "...", and the last three entities

#### Scenario: Back to a middle level
- **WHEN** the user presses the level-1 breadcrumb while at level 3
- **THEN** the level-1 treemap is shown, the trail has Root and one entity, and search/sort are cleared

### Requirement: Treemap rendering
Entities of the current level SHALL be rendered as a treemap whose tile area is equal for all entities
(weight 1; "Load more" tile weight 0.5). Each tile SHALL be a keyboard-focusable `<button>` that (1) shows the
localized entity name, (2) is filled with the colour of its entity type, (3) shows its additional-data lines
when there is room, (4) has an accessible name `<name>, <type label>[, <additional data>]`, and (5) shows the
same text as a tooltip on hover and keyboard focus. Names SHALL be resolved from a LocalizedString by
`dataLocale`, then project languages, then the first available value; Money values SHALL be formatted with the
currency's own number of fraction digits. The chart SHALL fill the available width, recompute on resize, and
SHALL never overflow its container horizontally.

#### Scenario: Localized name
- **WHEN** a store has `name = {"de": "Berlin", "en": "Berlin EN"}` and the data locale is `de`
- **THEN** the tile text and accessible name are "Berlin"

#### Scenario: Fallback name
- **WHEN** an entity has no name for the data locale or any project language but has `key`
- **THEN** the tile shows the key, and if no key either, the id

#### Scenario: Small tile
- **WHEN** a tile is smaller than 60 x 30 px
- **THEN** no visible text is drawn inside it, but its accessible name and tooltip still exist

#### Scenario: Money
- **WHEN** a Standalone Price value is `{currencyCode: "JPY", centAmount: 1500}`
- **THEN** the tile shows 1,500 yen (not 15.00)

### Requirement: Colour and accessibility of entity types
Each entity type SHALL have one fixed colour from the Visualizer data-viz palette (8 categorical slots, light
mode; table in the design). Types that can appear together at one level SHALL have distinct colours; types that
never appear together MAY share a slot. Identity SHALL never rely on colour alone: every colour is explained by
the legend and by each tile's accessible name/tooltip. Tile text colour SHALL be chosen to reach at least 4.5:1
contrast against the tile fill or the text SHALL be omitted (accessible name remains).

#### Scenario: No clash at one level
- **WHEN** the test iterates every parent type of the relationship graph
- **THEN** the child types listed for that parent (one level shows only the children of one parent) have pairwise different colours

#### Scenario: Colour does not follow rank
- **WHEN** the user hides one legend entry
- **THEN** the remaining entity types keep their colours

### Requirement: Interactive legend
Above the treemap a legend SHALL list each entity type present at the current level with its colour swatch,
plural label, loaded count and, when the server total is larger, "of <total>". Each legend entry SHALL be a
toggle button (`aria-pressed`) that hides or shows the tiles of that type (client-side only, no request). A
"Hide all" / "Show all" button SHALL toggle all types at once. When every type is hidden an explanatory
message with a "Show all" action SHALL replace the chart.

#### Scenario: Toggle a type
- **WHEN** a level has Stores (3) and Channels (2) and the user presses the Channels legend entry
- **THEN** 3 tiles remain, the Channels entry is shown as not pressed, and no request is sent

#### Scenario: Count of total
- **WHEN** 20 of 45 stores are loaded
- **THEN** the legend reads "Stores (20 of 45)"

#### Scenario: All hidden
- **WHEN** the user presses "Hide all"
- **THEN** the chart is replaced by the message "No entities visible" and the button reads "Show all"

### Requirement: Additional data on tiles
After the tiles of a level are shown, the page SHALL fetch small summaries for the visible entities (for
example "has 3 stores", "belongs to 2 business units") using the per-type queries defined in the design, and
append them to the tiles as they arrive. These requests SHALL NOT block the chart, SHALL run with a
concurrency limit of at most 4, SHALL be requested at most once per entity id and level, SHALL be abandoned
(results ignored) when the level changes, and a failure SHALL only omit that line (no error banner). Results of
earlier batches SHALL be kept when more entities are loaded.

#### Scenario: Chart is not blocked
- **WHEN** the additional-data requests are still pending
- **THEN** all tiles are already clickable and a small "Loading details..." caption is shown

#### Scenario: Concurrency
- **WHEN** 20 stores with 5 summary queries each are shown
- **THEN** never more than 4 summary requests are in flight at the same time

#### Scenario: Load more keeps summaries
- **WHEN** the user loads 20 more entities
- **THEN** only the new entities trigger summary requests and the old tiles keep their lines

#### Scenario: Summary failure is silent
- **WHEN** one summary request returns 500
- **THEN** the tile shows without that line and the page shows no error

### Requirement: Entity details drawer
When an entity is selected, an "Entity details" button SHALL appear next to the legend. It SHALL open a Nimbus
`Drawer` (right) titled "Entity info" showing localized name, entity type, id, key (if any), version, created
and last-modified timestamps (formatted with the user's locale), and the entity's raw JSON in a scrollable
monospace block. The drawer SHALL be closable with its close button and the Escape key, and focus SHALL return
to the opening button.

#### Scenario: Open and close
- **WHEN** the user presses a tile and then "Entity details"
- **THEN** a dialog with the entity's id and JSON is shown, and pressing Escape closes it

#### Scenario: Missing timestamps
- **WHEN** the entity has no `createdAt`
- **THEN** the field shows the commercetools "no value" fallback, never "Invalid Date"

### Requirement: Permission-aware data access
Every request SHALL be a GET through the Merchant Center API proxy for the current project. When a request
fails with HTTP 403 (missing OAuth scope of the custom application or missing Merchant Center permission of the
user), the page SHALL show a localized, non-technical message naming the entity type and stating that the
required permission is missing (including the failing endpoint), SHALL NOT crash, and SHALL keep any data that
did load. The set of OAuth scopes the page needs SHALL be documented in the design and verified in the final
change (task 9.3).

#### Scenario: Root type without scope
- **WHEN** the user selects "Categories" and the proxy answers 403
- **THEN** an `Alert` states that "Categories" could not be loaded because of a missing permission, the selector stays usable, and the other root types still work

#### Scenario: Missing project
- **WHEN** the application context has no project key
- **THEN** no request is sent and an error alert is shown

### Requirement: Large-project performance bounds
The page SHALL never fetch more than 20 entities per type per request and SHALL NOT fetch the whole
collection of any type. A relationship query that needs a list of ids (`id in (...)` / `key in (...)`) SHALL use
at most 100 ids and SHALL tell the user when the list was truncated. The treemap SHALL render at most 200 tiles
at once. Unmounting the page SHALL cancel the effect of in-flight requests (no state updates after unmount).

#### Scenario: 500 associates
- **WHEN** a Business Unit lists 500 associates
- **THEN** the associates request contains 100 ids, 20 tiles are shown and a note says the list was truncated to 100

#### Scenario: Unmount during load
- **WHEN** the user navigates to another page while requests are in flight
- **THEN** no React "state update on an unmounted component" warning is logged

### Requirement: Localization
Every user-visible string SHALL come from `react-intl` messages with ids `VisualizeDrilldown.*`, with English
and German translations in `src/i18n/data/en.json` and `de.json` and the extracted `core.json`. Entity-type
labels SHALL have separate singular and plural messages (no string slicing). Counts SHALL use ICU plural
syntax. Technical identifiers (entity ids, keys, JSON) are not translated.

#### Scenario: German UI
- **WHEN** the MC UI language is German
- **THEN** title, buttons, legend, empty and error states render in German

#### Scenario: Singular and plural
- **WHEN** one store is loaded
- **THEN** the legend reads "Stores (1)" (plural label) and, after pressing that tile, the details button reads "Store details" (singular label)
