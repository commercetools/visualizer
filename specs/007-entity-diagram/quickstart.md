# Quickstart: Entity Diagram

Build guide for the **Entity Diagram** feature. Read alongside the constitution in [../README.md](../README.md).
There is no GraphQL contract: the feature reads through the REST API proxy.

## Prerequisites

- The Merchant Center custom application scaffold, the Nimbus design system and the app shell.
- OAuth scopes `view_products`, `view_types`, `view_key_value_documents`, `manage_key_value_documents`
  in `custom-application-config.mjs`.

## 1. Route

| View | Route | Presentation |
|------|-------|--------------|
| Entity Diagram | `/entity-diagram` | full page, canvas |

## 2. Data layer

- Read Product Types and Types page by page (200 per request) from the REST proxy; read schemas, links and
  locations as Custom Objects.
- Write links and locations with a create-or-update Custom Object mutation, debounced by 1000 ms,
  flushed on unmount, and only when the user has Manage.

## 3. View

- Render nodes (title, attributes, colour by kind) and edges on a canvas; build edges from `linkDataList`,
  positions from `locationDataList`.
- Handle connect, label edit (click, Enter, blur) and Delete/Backspace as in FR-010 to FR-012.
- Show spinner, error alert, empty message and the read-only alert as in FR-014/FR-015.

## 4. Verify

`npm test` in `visualizer/` (component spec next to the page). On screen: drag a node, wait a second,
reload: the node stays; as a View-only user nothing is written.
