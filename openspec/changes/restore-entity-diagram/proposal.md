## Why

The Entity Diagram (an interactive, draggable graph of a project's Product Types, Custom Types and
Custom Object schemas, with user-drawn relations between them) was part of the Visualizer until it was
deleted by Philipp Hofmann in `e7cb4c4` ("Migrate remaining features to Nimbus") and its menu entry
dropped from `custom-application-config.mjs` in `3d8e4ba`. The owner wants every feature kept in the
`commercetools-labs` publication. Its source is
recoverable from git history (`e7cb4c4^`), and it never used UIKit, so the port is small, but it depends
on a removed private package (`<private-shared-hooks-package>`) and on Tailwind class
names that do not exist in this app.

## What Changes

- Re-add `visualizer/src/components/entity-diagram/` (9 files from `e7cb4c4^`, ported) plus new
  `messages.ts`, `use-available-height.ts`, `providers/apply-change.ts` and specs.
- Replace the private data-fetching package by the already inlined hooks in `src/hooks/`
  (`useCustomObjectsFetcher`, `useCustomObjectFetcher`, `useCustomObjectCreatorOrUpdater`).
- Re-implement the UI shell on Nimbus (`DefaultPage`, `Box`, `Text`, `Heading`, `LoadingSpinner`,
  `Alert`, `TextInput`) and i18n (`react-intl` messages, keys `EntityDiagram.*`, en + de).
- Fix robustness bugs of the old code without changing behaviour users saw: first-run (missing storage
  custom objects), loading/error/empty states, pagination beyond 200 items, pending save lost on
  navigation, view-only users, Strict-Mode double updater.
- Add `@commercetools-frontend/sdk` as an explicit dependency (today only transitive).
- NOT in this change: route registration, Welcome card, menu entry (see `wire-routes-and-welcome`).
- No new OAuth scopes are required.

## Capabilities

### New Capabilities
- `entity-diagram`: loading, rendering, laying out, editing (relations, labels, positions) and
  persisting the entity relationship diagram of a project; its states, permissions and i18n.

### Modified Capabilities

(none - there is no `openspec/specs/` baseline yet)

## Impact

- New code only under `visualizer/src/components/entity-diagram/`; `package.json` (+1 dep);
  `src/i18n/data/{core,en,de}.json` (new keys; shared with `restore-visualize-drilldown`).
- Data: reads Product Types and Types (MC REST proxy `COMMERCETOOLS_PLATFORM`) and Custom Objects;
  writes Custom Objects (container `mc-link-data`, keys `linkDataList`, `locationDataList`).
- Scopes (all already in `custom-application-config.mjs`): `view_products`, `view_types`,
  `view_key_value_documents`, `manage_key_value_documents`.
- Downstream: `wire-routes-and-welcome` imports `./components/entity-diagram` (default export);
  `e2e-verification` uses the test ids and fixtures documented in `design.md`.
