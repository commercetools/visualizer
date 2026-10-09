# Feature: Entity Diagram

**Status:** Restored and specified from the current implementation
**Domain:** Product Types, Custom Types (Types) and Custom Object schemas, drawn as a diagram
**Spec version:** 1.0 (2026-10-09)

> Shared conventions are in [../README.md](../README.md).

## 1. Overview

The Entity Diagram draws the data model of a project as an interactive node/edge canvas. One node is
shown per **Product Type**, per **Custom Type** (Type definition) and per **Custom Object schema**.
Merchants can drag nodes, draw labelled relations between them and the layout is saved in the project
as Custom Objects, so it survives a reload. It reads through the Merchant Center REST API proxy
(`COMMERCETOOLS_PLATFORM` target); it has no GraphQL operations.

## 2. User scenarios

- As a merchant, I can see all Product Types, Types and Custom Object schemas of the project as nodes with their attributes.
- As a merchant, I can drag nodes and find them where I left them after a reload.
- As a merchant, I can draw a relation between two nodes, label it, and delete it.
- As a View-only user, I can look at and rearrange the diagram, but nothing is saved.

## 3. Functional requirements

### Nodes

- **FR-001** The page shows a title and a canvas (`data-testid="entity-diagram-canvas"`).
- **FR-002** One node per Product Type (identified by `name`, falling back to `key`), per Type (by `key`)
  and per schema (by the custom object `key`).
- **FR-003** Each node lists its attributes (Product Type `attributes[].name`, Type `fieldDefinitions[].name`,
  schema `value.attributes[].name`). An attribute named `id` is shown in italics.
- **FR-004** Product Type nodes additionally list the inherited attributes `id`, `name`, `description`
  under "Inherited Attributes".
- **FR-005** Node colour: blue for Product Types, red for Custom Types, green for Custom Object schemas.

### Data sources

- **FR-006** Product Types come from `GET /{projectKey}/product-types`, Types from `GET /{projectKey}/types`,
  schemas from the Custom Objects of container `mc-custom-object-schema`.
- **FR-007** All pages are read (page size 200); the result is never silently truncated.

### Relations and layout

- **FR-008** Relations are persisted as Custom Object container `mc-link-data`, key `linkDataList`
  (JSON array of `{key, from, to, text?, toText?}`); positions as key `locationDataList`
  (JSON array of `{key, loc}`, `loc` = `"<x> <y>"`).
- **FR-009** On load, nodes with a stored location are placed there; nodes without one are placed at `0 0`.
- **FR-010** A relation is drawn by dragging from a node's bottom handle to another node's top handle.
- **FR-011** Double-clicking an unlabelled relation sets the labels "Label" and "Relation". Clicking a label
  turns it into a text input; Enter commits, blur cancels.
- **FR-012** Delete or Backspace with a selected relation, while no label is edited, removes it. Backspace in a
  focused label input only deletes a character.
- **FR-013** Writes are debounced (1000 ms trailing, per object) and a pending write is flushed when the page
  is left. Local state stays the source of truth after the first load.

### Permissions

- **FR-014** Viewing needs the app's View permission. Saving needs **Manage**. Without Manage the user can
  still move nodes and draw relations locally, no write is attempted and an informational alert states that
  changes are not saved.

### States and robustness

- **FR-015** A spinner (`data-testid="entity-diagram-loading"`) is shown while loading; a critical alert
  (`data-testid="entity-diagram-error"`) if a read fails; an empty message (`data-testid="entity-diagram-empty"`)
  if there is no node.
- **FR-016** Missing `linkDataList` / `locationDataList` objects (first run) count as empty lists; no error.
- **FR-017** A failed save shows an error notification and keeps the local state.
- **FR-018** Stored relations pointing to a node that no longer exists are not drawn (and stay in storage);
  duplicate node ids keep the first; a malformed `loc` falls back to `0 0`.
- **FR-019** All strings are localized (`EntityDiagram.*`, English and German).

## 4. Views & navigation

Single page at route `/entity-diagram` (menu link "Entity Diagram"; card on the Welcome screen).

## 5. Required OAuth scopes

`view_products`, `view_types`, `view_key_value_documents` (View) and `manage_key_value_documents` (Manage).

## 6. Edge cases & known limitations

- The feature **writes Custom Objects into the project** (container `mc-link-data`), which is why saving needs Manage.
- Positions are stored per project, not per user.

## 7. Out of scope / non-goals

- Automatic layout, export to an image, or deriving relations from the data.

## Review checklist

- [x] Nodes, data sources, persistence and permissions captured
- [x] Every FR can be checked on the screen
