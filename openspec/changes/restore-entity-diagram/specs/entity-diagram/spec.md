## ADDED Requirements

### Requirement: Entity Diagram page
The system SHALL provide an Entity Diagram page component exported as the default export of
`src/components/entity-diagram` (`index.tsx`) that renders, inside a Nimbus `DefaultPage`, a title
(i18n key `EntityDiagram.title`) and an interactive node/edge canvas. The component SHALL NOT import any
`@commercetools-uikit/*` package and SHALL NOT use CSS utility classes that are not defined by the app.

#### Scenario: Page renders
- **WHEN** the component is mounted under an MC project context with data available
- **THEN** a heading with the page title and a canvas (`data-testid="entity-diagram-canvas"`) are shown

### Requirement: Entities shown as nodes
The system SHALL show one node per Product Type, per Custom Type (Type definition) and per Custom Object
schema. Product Type nodes SHALL be identified by `name ?? key`, Custom Type nodes by `key`, schema nodes
by the custom object `key`. Each node SHALL list its attributes (Product Type `attributes[].name`, Type
`fieldDefinitions[].name`, schema `value.attributes[].name`); an attribute named `id` SHALL be rendered in
italics. Product Type nodes SHALL additionally list the inherited attributes `id`, `name`, `description`
under "Inherited Attributes". Node border/dot colour SHALL be blue for Product Types, red for Custom
Types, green for Custom Object schemas.

#### Scenario: Product type node
- **WHEN** the project has a Product Type named "Shoe" with attributes `size` and `color`
- **THEN** a node "Shoe" shows `size`, `color` under "Attributes" and `id`, `name`, `description` under "Inherited Attributes", with a blue border

#### Scenario: Custom type node
- **WHEN** the project has a Type with key `order-extra` and field `note`
- **THEN** a node "order-extra" with attribute `note` and a red border is shown

#### Scenario: Schema node
- **WHEN** a custom object exists in container `mc-custom-object-schema` with key `brand` and value `{"attributes":[{"name":"id"},{"name":"title"}]}`
- **THEN** a green node "brand" is shown with `id` in italics and `title`

### Requirement: Data sources and completeness
The system SHALL read Product Types from `GET /{projectKey}/product-types` and Types from
`GET /{projectKey}/types` through the Merchant Center API proxy target `COMMERCETOOLS_PLATFORM`, and
schemas from custom objects of container `mc-custom-object-schema` (limit 200). The system SHALL request
further pages until all resources have been read (page size 200) and SHALL NOT silently truncate.

#### Scenario: More than 200 types
- **WHEN** the project has 450 Types
- **THEN** three requests are made (offsets 0, 200, 400) and 450 Custom Type nodes are created

### Requirement: Persisted relations and positions
The system SHALL persist user-drawn relations as custom object container `mc-link-data`, key
`linkDataList`, value = JSON array of `{key, from, to, text?, toText?}`, and node positions as
container `mc-link-data`, key `locationDataList`, value = JSON array of `{key, loc}` where `loc` is the
string `"<x> <y>"`. Existing objects written by the previous implementation SHALL load unchanged. On load,
nodes with a stored location SHALL be placed there; nodes without one SHALL be placed at `0 0`.

#### Scenario: Reload keeps layout
- **WHEN** a user drags node "Shoe" to (240, 80), waits for the save, and reloads the page
- **THEN** "Shoe" is rendered at (240, 80)

#### Scenario: Legacy data
- **WHEN** `locationDataList` was written by the old Entity Diagram
- **THEN** it is read without migration and positions are applied

### Requirement: First run without stored objects
The system SHALL treat a missing (`null`) `linkDataList` or `locationDataList` custom object as an empty
list, and a missing schema container as zero schemas. It SHALL still render all Product Types and Types.

#### Scenario: Fresh project
- **WHEN** no custom objects in `mc-link-data` or `mc-custom-object-schema` exist
- **THEN** the diagram renders Product Type and Type nodes without edges and no error is shown

### Requirement: Drawing, labelling and deleting relations
The system SHALL let the user create a relation by dragging from a node's bottom handle to another node's
top handle; the new edge gets a generated UUID key and empty labels, and a `linkAdded` change is
persisted. Double-clicking an unlabeled edge SHALL set labels "Label" (source side) and "Relation"
(target side) and persist them. Clicking a label SHALL turn it into a text input; pressing Enter SHALL
commit and persist the text, blur SHALL cancel. Pressing Delete or Backspace with a selected edge, while no
label is being edited, SHALL remove the edge and persist the removal.

#### Scenario: Connect two nodes
- **WHEN** the user drags from the bottom handle of "Shoe" to the top handle of "brand"
- **THEN** an edge appears and, within about 1 s, `linkDataList` contains one entry `from: "Shoe"`, `to: "brand"`

#### Scenario: Edit label
- **WHEN** the user clicks the label "Label", types "belongs to" and presses Enter
- **THEN** the edge shows "belongs to" and the stored `text` is "belongs to"

#### Scenario: Backspace while typing
- **WHEN** a label input is focused with an edge selected and the user presses Backspace
- **THEN** a character is deleted and the edge is NOT removed

#### Scenario: Delete edge
- **WHEN** the user selects an edge and presses Delete
- **THEN** the edge disappears and its entry is removed from the stored list

### Requirement: Debounced, lossless persistence
The system SHALL coalesce persistence writes with a 1000 ms trailing debounce per object (links,
locations) and SHALL flush a pending write when the page unmounts. Local state SHALL be the source of truth
after the initial load and SHALL NOT be overwritten by cache updates caused by the system's own saves.

#### Scenario: Leave quickly
- **WHEN** the user drags a node and navigates to another Visualizer page within 1 s
- **THEN** the location write is still sent

#### Scenario: Burst of drags
- **WHEN** a node is dragged continuously for 3 s
- **THEN** at most a few writes are sent (not one per mouse move)

### Requirement: Permissions
The system SHALL allow viewing the diagram with the app's View permission. It SHALL persist changes only
if `useIsAuthorized({demandedPermissions:[PERMISSIONS.Manage]})` is true. Without Manage, the user MAY
still move nodes and draw edges locally, no custom object write SHALL be attempted, and an informational
Nimbus `Alert` (key `EntityDiagram.readOnly`) SHALL state that changes are not saved.

#### Scenario: View-only user
- **WHEN** a user with only View drags a node
- **THEN** no `createOrUpdateCustomObject` mutation is sent and the read-only alert is visible

### Requirement: Loading, error and empty states
The system SHALL show a Nimbus `LoadingSpinner` (`data-testid="entity-diagram-loading"`) until the three
custom-object queries and the REST requests have finished; an `Alert` with colorPalette `critical`
(`data-testid="entity-diagram-error"`) with the message when product types, types, schemas, links or
locations fail to load; and an empty message (`data-testid="entity-diagram-empty"`) if zero nodes exist.
A failed save SHALL raise an error notification (`useShowNotification`) and keep the local state.

#### Scenario: Proxy failure
- **WHEN** the product-types request returns 403
- **THEN** the error alert with the error message is shown and no canvas is rendered

#### Scenario: Save failure
- **WHEN** `createOrUpdateCustomObject` rejects
- **THEN** an error notification is shown and the edge/position remains on the canvas

### Requirement: Robustness against inconsistent data
The system SHALL NOT crash if a stored link references a node that no longer exists (it is not rendered
and stays in storage), if two entities produce the same node id (the first one wins and a
`console.warn` is emitted), or if a stored `loc` is malformed (position falls back to `0 0`).

#### Scenario: Orphan link
- **WHEN** a link points to a deleted Product Type
- **THEN** the page renders normally without that edge

### Requirement: Internationalisation
All user-visible strings added by this capability SHALL be defined with `defineMessages` under ids
`EntityDiagram.*` in `messages.ts` and present in `src/i18n/data/core.json`, `en.json` and `de.json`.

#### Scenario: German locale
- **WHEN** the MC user language is German
- **THEN** the page title, alerts and empty message are shown from `de.json`

### Requirement: Required OAuth scopes
The capability SHALL work with exactly these scopes, all of which SHALL be present in
`custom-application-config.mjs`: `view_products`, `view_types`, `view_key_value_documents` (view) and
`manage_key_value_documents` (manage).

#### Scenario: Scope audit
- **WHEN** `oAuthScopes` is inspected
- **THEN** each of the four scopes is present and no additional scope is needed by this feature
