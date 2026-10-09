## Why

Requirement R7 says we must not depend on the owner to find regressions: Claude must test the migrated
Visualizer itself with the Chrome DevTools MCP tools. Unit tests (jest) cannot prove that the app works
inside a real Merchant Center (MC) session with real API permissions, real GraphQL schemas and the Nimbus
UI. After changes A-D and (optionally) E, we need one repeatable, written end-to-end (E2E) procedure, a place
to record results, and a triage procedure for failures. Screenshots from this run also feed change G (docs).

## What Changes

- A written test plan (in `design.md`) with a per-feature matrix: Welcome, Types, States, Subscriptions
  (all 7 destinations), API Extensions (3 destinations + triggers), Custom Objects, Entity Diagram,
  Visualize Drilldown, View-only vs Manage permissions.
- A numbered, copy-pasteable execution script (in `tasks.md`) using `mcp__chrome-devtools__*` tools.
- A results file `plans/e2e-results.md` (template created by this change; filled during the run).
- Evidence folder `plans/evidence/` (screenshots, snapshots, Lighthouse reports); gitignored from the final commit.
- A Lighthouse accessibility/best-practice quick check for the two new pages.
- Test data convention (`labs-e2e-` prefix) and mandatory cleanup.
- No application code is changed by this change. Bugs found are fixed in the owning change (B, C, D) or in a new
  small fix task logged in `plans/e2e-results.md`.

## Capabilities

### New Capabilities
- `e2e-verification-suite`: the repeatable browser-driven verification procedure, its pass/fail rules,
  evidence capture, data hygiene and failure triage.

### Modified Capabilities
<!-- none -->

## Impact

- New files only: `plans/e2e-results.md`, `plans/evidence/**` (generated), optional note appended to
  `plans/manual-steps.md` and `plans/owner-questions.md`.
- Requires: change D finished (routes visible); manual steps M1 (logged-in Chrome) and M2 (project key +
  cloud identifier in `visualizer/.env.local`). M3 (registering the app in MC) is only needed for the
  optional "served from Connect" run.
- Gate for: change G (screenshots) and change H onward.
