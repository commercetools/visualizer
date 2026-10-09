# Quickstart: Visualize Drilldown

Build guide for the **Visualize Drilldown** feature. Read alongside the constitution in [../README.md](../README.md).
There is no GraphQL contract: the feature reads through the REST API proxy.

## Prerequisites

- The Merchant Center custom application scaffold, the Nimbus design system and the app shell.
- The View scopes listed in `spec.md` section 5, registered in `custom-application-config.mjs`.

## 1. Route

| View | Route | Presentation |
|------|-------|--------------|
| Visualize Drilldown | `/visualize-drilldown` | full page, treemap |

## 2. Data layer

- A small REST helper that issues GET requests through the MC proxy and maps HTTP 403 to a typed error.
- A relationship table (see `data-model.md`) that maps each parent type to its child requests; every id or
  key put into a predicate is quoted and escaped.
- A navigation state (selected root, breadcrumb levels, search, sort, hidden types) held in a reducer;
  ignore responses of outdated requests.
- An additional-data queue with a concurrency limit of 4.

## 3. View

- Root-type buttons, search and sort at root level, breadcrumb `<nav>`, interactive legend, treemap of
  equal-size button tiles, "Load more" tile, details drawer (FR-001 to FR-015).
- Show localized 403 messages instead of crashing (FR-016).

## 4. Verify

`npm test` in `visualizer/`. On screen: choose "Stores", press a tile, check the breadcrumb, toggle a legend
entry, open "Entity details" and close it with Escape.
