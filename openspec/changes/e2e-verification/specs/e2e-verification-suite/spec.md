## ADDED Requirements

### Requirement: Every feature has a recorded E2E result
The verification run SHALL exercise every row of the test matrix in `design.md` and record PASS, FAIL or
SKIPPED (with reason) for each row in `plans/e2e-results.md`.

#### Scenario: Complete results file
- **WHEN** the run is finished
- **THEN** `plans/e2e-results.md` has a non-empty status for every matrix row and no row is left as TODO

### Requirement: Zero console errors
During every matrix row the browser console SHALL contain zero messages of type `error`. Warnings SHALL be
listed and each either fixed or allow-listed with a reason in `plans/e2e-results.md`.

#### Scenario: Clean console on the new pages
- **WHEN** `list_console_messages` with `types: ["error"]` is called after loading `/entity-diagram` and `/visualize-drilldown`
- **THEN** the result is empty

### Requirement: No failed API calls except expected ones
Network requests to the MC API proxy and GraphQL endpoint SHALL NOT return 4xx/5xx unless the row of the matrix
explicitly expects it (for example a deliberately invalid destination).

#### Scenario: Scope check
- **WHEN** the Visualize Drilldown page loads every entity type
- **THEN** no request returns HTTP 403

### Requirement: Test data is namespaced and removed
All resources created by the run SHALL have a key or name starting with `labs-e2e-`, and a final sweep SHALL
leave zero such resources in the test project.

#### Scenario: Cleanup proof
- **WHEN** each list page is filtered or scanned for `labs-e2e-`
- **THEN** no entry is found and this is recorded in the results file

### Requirement: Evidence is captured
For each matrix row at least one screenshot or snapshot SHALL be saved under `plans/evidence/` and referenced
by file name in the results file.

#### Scenario: Evidence reference
- **WHEN** a results row says PASS
- **THEN** it names an existing evidence file

### Requirement: Accessibility quick check
A Lighthouse audit SHALL be run on `/entity-diagram` and `/visualize-drilldown`; accessibility scores under 90
SHALL be recorded with the failing audits and a follow-up task.

#### Scenario: Audit recorded
- **WHEN** the audits are finished
- **THEN** the two scores and the report paths are in the results file

### Requirement: Failures are triaged
Each FAIL SHALL be classified (app bug, test-script bug, environment, expected API behaviour), assigned to an
owning change, and re-tested after the fix.

#### Scenario: Fixed failure
- **WHEN** a fix lands for a FAIL row
- **THEN** the row is re-run and its history keeps both the FAIL and the later PASS
