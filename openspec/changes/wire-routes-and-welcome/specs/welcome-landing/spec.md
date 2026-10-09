## ADDED Requirements

### Requirement: Welcome shows one card per feature
The Welcome page SHALL render exactly seven cards, in this order: Types, Subscriptions, States,
API Extensions, Custom Objects, Visualize Drilldown, Entity Diagram. Each card SHALL have a heading,
a one-sentence description and a "View {title}" button.

#### Scenario: Seven cards
- **WHEN** the Welcome page is rendered
- **THEN** exactly seven level-2 headings with the titles above are present

#### Scenario: Descriptions are distinct
- **WHEN** the descriptions of all cards are compared
- **THEN** no two cards have identical description text

### Requirement: Cards navigate to the feature route
Pressing a card's "View {title}" button SHALL navigate to `<app-root>/<target>` where target is
`types`, `subscriptions`, `states`, `extensions`, `custom-objects`, `visualize-drilldown`, `entity-diagram`
respectively.

#### Scenario: Open Entity Diagram from Welcome
- **WHEN** the user presses "View Entity Diagram"
- **THEN** the browser location becomes `<app-root>/entity-diagram`

### Requirement: No dangling Visualize card
The Welcome page SHALL NOT contain a card that targets `visualize`.

#### Scenario: No card for the legacy route
- **WHEN** the Welcome page is rendered
- **THEN** no button navigates to `<app-root>/visualize`

### Requirement: Welcome texts are internationalised
All Welcome texts SHALL be react-intl messages with ids `Welcome.*` that exist in
`core.json`, `en.json` and `de.json`.

#### Scenario: Message ids present in all locale files
- **WHEN** `npm run extract-intl` is run
- **THEN** `core.json` contains the new `Welcome.visualizeDrilldown.*` and `Welcome.entityDiagram.*` ids and `en.json`/`de.json` contain the same ids
