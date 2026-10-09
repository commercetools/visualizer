## ADDED Requirements

### Requirement: ossify refusals are resolved
Every item under "THIRD-PARTY DIRECTORIES EXCLUDED" or "FOREIGN COPYRIGHT - refused" in ossify's report SHALL have a written decision (remove, relicense not allowed, keep with attribution) in `design.md` task notes; the final dry run SHALL list none.

#### Scenario: Clean report
- **WHEN** the final ossify dry run is read
- **THEN** it has no "!!" sections

### Requirement: Dependency licences reviewed
The licences of all packages in both lockfiles SHALL be summarised and every non-permissive entry (LGPL, MPL, CC-BY, unknown) SHALL have a recorded decision. No third-party source is vendored into the repository.

#### Scenario: Summary recorded
- **WHEN** task 6 is complete
- **THEN** a table (licence -> count -> decision) exists in the change notes and `@commercetools/nimbus` has a verified licence

### Requirement: Published OpenSpec content is scrubbed and header-free
`openspec/` and `specs/` SHALL be published, SHALL carry no SPDX header (ossify skips `.md`/`.yaml`/`.json`), SHALL contain no internal strings, personal absolute paths or owner-only manual steps, and SHALL still pass `openspec validate --all`. `plans/` SHALL NOT be shipped and the published records SHALL say so.

#### Scenario: Gate clean on openspec
- **WHEN** the gate is run on a scratch commit containing `openspec/` and `specs/`
- **THEN** it reports no finding located in those folders and `openspec validate --all` passes

#### Scenario: Records readable by outsiders
- **WHEN** a reader opens `openspec/README.md`
- **THEN** it explains the purpose of the change records and that `plans/` is not part of the repository
