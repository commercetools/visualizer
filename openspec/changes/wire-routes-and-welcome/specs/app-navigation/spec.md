## ADDED Requirements

### Requirement: Entity Diagram and Visualize Drilldown are reachable by URL
The application SHALL render the Entity Diagram page at `<app-root>/entity-diagram` and the Visualize
Drilldown page at `<app-root>/visualize-drilldown`, where `<app-root>` is
`/<project-key>/<entryPointUriPath>`. Both routes SHALL be declared before the catch-all Welcome route.

#### Scenario: Open the Entity Diagram by URL
- **WHEN** the user navigates to `<app-root>/entity-diagram`
- **THEN** the Entity Diagram page is rendered and the Welcome page is not

#### Scenario: Open the Visualize Drilldown by URL
- **WHEN** the user navigates to `<app-root>/visualize-drilldown`
- **THEN** the Visualize Drilldown page is rendered and the Welcome page is not

#### Scenario: Existing routes keep working
- **WHEN** the user navigates to `<app-root>/types`, `/states`, `/subscriptions`, `/extensions` or `/custom-objects`
- **THEN** the same page as before this change is rendered

### Requirement: Submenu links for the two visualizations
`custom-application-config.mjs` SHALL declare submenu links with `uriPath` `visualize-drilldown`
(default label "Visualize Drilldown") and `entity-diagram` (default label "Entity Diagram"), placed after
the "Custom Objects" link, each requiring the `View` permission of the application.

#### Scenario: Menu shows the links
- **WHEN** a user with the `View` permission opens the Visualizer main menu entry
- **THEN** the sub-menu lists "Visualize Drilldown" and "Entity Diagram" after "Custom Objects"

#### Scenario: Menu hides the links without View
- **WHEN** a user without the `View` permission of this application loads the Merchant Center
- **THEN** the application's main menu entry and both links are not shown

### Requirement: Least-privilege OAuth scopes
The `oAuthScopes` in `custom-application-config.mjs` SHALL contain every scope needed by any page of
the application and SHALL NOT contain a scope that no page uses. For the two visualizations the view
scopes are: `view_business_units`, `view_customers`, `view_stores`, `view_products`, `view_categories`,
`view_product_selections`, `view_cart_discounts`, `view_standalone_prices`, `view_types`,
`view_key_value_documents`. Write access SHALL only be requested by `manage_*` scopes of features that
write (states, subscriptions, types, extensions, key-value documents).

#### Scenario: Drilldown fetches all its entity kinds
- **WHEN** Visualize Drilldown requests each supported entity endpoint through the MC API proxy
- **THEN** no request is answered with HTTP 403 caused by a missing scope

#### Scenario: Unused scope removed
- **WHEN** the source tree is searched for the resources `orders`, `shopping-lists`, `quote-requests`
- **THEN** no match exists in runtime code and the matching scopes are absent from the config

### Requirement: Unknown paths fall back to Welcome
Any path under `<app-root>` that matches no route SHALL render the Welcome page.

#### Scenario: Stray legacy path
- **WHEN** the user navigates to `<app-root>/visualize`
- **THEN** the Welcome page is rendered
