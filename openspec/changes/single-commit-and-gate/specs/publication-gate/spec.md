## ADDED Requirements

### Requirement: Gate passes on the committed tree
`node $SK/scripts/gate.mjs --repo .` SHALL exit 0, with zero FAIL findings; any WARN SHALL have been read and either fixed or acknowledged with `--ack`.

#### Scenario: Gate clear
- **WHEN** the gate is run on a clean tree with one commit
- **THEN** the output ends with `CLEAR.` (or `CLEAR (warnings acknowledged).`) and the exit code is 0

### Requirement: Gate is run on the final commit
The gate result SHALL be valid only for the commit SHA printed by the gate; any later amend MUST be followed by a re-run.

#### Scenario: SHA recorded
- **WHEN** the change is complete
- **THEN** the task notes record the gate's `commit <sha8>` equal to `git rev-parse --short=8 HEAD`

### Requirement: Clean clone builds
A fresh clone of the committed repo made in the scratchpad directory, with an empty HOME, SHALL pass `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` inside `visualizer/` (build with the documented dummy environment variables).

#### Scenario: Stranger build
- **WHEN** the commands of tasks 8.x are run in the clone
- **THEN** each exits 0
