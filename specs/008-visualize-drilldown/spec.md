# Feature: Visualize Drilldown

**Status:** Restored and specified from the current implementation
**Domain:** Relationships between Business Units, Stores, Customer Groups, Product Selections, Channels, Categories and the entities related to them
**Spec version:** 1.0 (2026-10-09)

> Shared conventions are in [../README.md](../README.md).

## 1. Overview

Visualize Drilldown is a read-only explorer. The user picks a root entity type, sees its entities as a
treemap of equal-size tiles, and presses a tile to drill down to the entities related to it (for example
a Business Unit to its Stores, associates and sub-units). It reads through the Merchant Center REST API
proxy (`COMMERCETOOLS_PLATFORM` target) with GET requests only.

## 2. User scenarios

- As a merchant, I can choose a root entity type and browse its entities page by page.
- As a merchant, I can search and sort the root list.
- As a merchant, I can press a tile to see the related entities, and go back with a breadcrumb trail.
- As a merchant, I can hide entity types with a legend and open an entity's raw details in a drawer.

## 3. Functional requirements

### Root selection, paging, search, sort

- **FR-001** The page shows a title, a description and six root-type buttons: Business Units, Stores,
  Customer Groups, Product Selections, Channels, Categories. Nothing is selected and no request is made
  until the user selects one.
- **FR-002** Selecting a type resets search, sort, breadcrumbs, hidden types and loaded data, then loads
  the first page (20 entities). The buttons are disabled while a request is running.
- **FR-003** When more entities exist than are loaded, a dashed "Load more" tile appends the next page.
- **FR-004** A search box (server-side `where` predicate; the text is escaped) and sort buttons
  (`sort=<field> <asc|desc>`, cycling asc, desc, none; one active field) are offered at root level only.
- **FR-005** A response that arrives for an outdated request is ignored.

### Drilldown and breadcrumbs

- **FR-006** Pressing a tile whose type has children selects it, resets search/sort, appends a breadcrumb and
  loads the related entities of every child type; only types with at least one entity are shown. Pressing a
  tile of a type without children only selects it.
- **FR-007** The relationship graph is: business-unit to store, associate, business-unit; store to business-unit,
  product-selection, channel, cart-discount, customer; customer-group to customer; product-selection to product,
  store; channel to store; associate to business-unit; product to product-selection, standalone-price, category;
  standalone-price to product; category to product, category.
- **FR-008** If an entity has no related entities, a "no related entities" message is shown and the breadcrumb
  still allows going back. If one relation fails with 403, the others are shown and a warning names the failed type.
- **FR-009** The breadcrumb is a `<nav>` showing Root plus the drilled entities as `<name> (<type>)`; at most the
  last three, preceded by a non-interactive "..." when there are more. Pressing an item goes back to that level; the
  current item has `aria-current="page"`.

### Treemap, legend, details

- **FR-010** Tiles have equal area; each is a keyboard-focusable button with the localized name, the colour of its
  type, optional additional-data lines when there is room, an accessible name `<name>, <type>[, <data>]` and the
  same text as tooltip. At most 200 tiles are drawn.
- **FR-011** Names resolve by data locale, then project languages, then the first value, then key, then id.
  Money uses the currency's own number of fraction digits.
- **FR-012** Each entity type has one fixed colour; types that appear together at one level have different colours.
  Colour is never the only identification (legend, accessible name, tooltip).
- **FR-013** A legend lists the types of the current level with colour, plural label, loaded count and "of <total>"
  when more exist. Each entry toggles the visibility of its tiles (client-side). "Hide all" / "Show all" toggles all;
  when all are hidden a message with a "Show all" action is shown.
- **FR-014** Additional data (such as "has 3 stores") is fetched after the tiles are shown, with at most 4
  requests in flight, once per entity and level; failures only omit that line.
- **FR-015** For a selected entity an "Entity details" button opens a drawer with name, type, id, key, version,
  created and last-modified timestamps and the raw JSON. Escape closes it and focus returns to the button.

### Permissions, limits, i18n

- **FR-016** Viewing needs only the View permission; the page never writes. A 403 shows a localized message
  naming the entity type and the missing permission; the page keeps working and keeps loaded data.
- **FR-017** At most 20 entities per type per request; id lists in relationship queries are cut at 100 ids and the
  user is told when that happened.
- **FR-018** All strings are localized (`VisualizeDrilldown.*`, English and German), with singular and plural labels.

## 4. Views & navigation

Single page at route `/visualize-drilldown` (menu link "Visualize Drilldown"; card on the Welcome screen).
Navigation inside the page is state-based (breadcrumbs); the URL does not change.

## 5. Required OAuth scopes

`view_business_units`, `view_customers`, `view_stores`, `view_products`, `view_categories`,
`view_product_selections`, `view_cart_discounts`, `view_standalone_prices`.

## 6. Edge cases & known limitations

- Search is an exact match, not a substring search.
- Customer Groups are read with the scopes above; if a project answers 403 for them, the page shows the
  permission message (FR-016).

## 7. Out of scope / non-goals

- Editing any entity; opening the Merchant Center detail page of an entity.

## Review checklist

- [x] Root types, relationship graph, paging, limits and permissions captured
- [x] Every FR can be checked on the screen
