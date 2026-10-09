## ADDED Requirements

### Requirement: Specs cover every routed feature
`specs/` SHALL contain one numbered spec-kit directory per route in `visualizer/src/routes.tsx`, including
`007-entity-diagram` and `008-visualize-drilldown`, each with `spec.md`, `data-model.md` and `quickstart.md`.

#### Scenario: Every route has a spec
- **WHEN** the route paths in `routes.tsx` are compared with the feature index table in `specs/README.md`
- **THEN** every route is listed and its linked `spec.md` exists

### Requirement: specs/README.md matches reality
`specs/README.md` MUST list the two visualizations in the feature index and MUST NOT state that they are not
reimplemented or that drop their cards/routes.

#### Scenario: Feature index
- **WHEN** `specs/README.md` is read
- **THEN** its index has 8 rows (001-008) and the note "not being reimplemented" is gone

### Requirement: Welcome spec matches the Welcome screen
`specs/001-welcome/spec.md` SHALL describe the cards that the Welcome screen really renders after change D, with
no "either restore a target or drop the card" open item left.

#### Scenario: No open item
- **WHEN** `grep -n -i "either restore" specs/001-welcome/spec.md`
- **THEN** nothing is found

### Requirement: Specs are scrubbed
`specs/**` MUST NOT contain `<internal-org>` (the three `data-model.md` references to the shared
data-fetching hooks are reworded to "the shared data-fetching hooks").

#### Scenario: Scrub
- **WHEN** `git grep -n -i "<internal-org>" -- specs` is run
- **THEN** it prints nothing
