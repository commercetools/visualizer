## ADDED Requirements

### Requirement: Every README image exists
Each image link in `README.md` SHALL resolve to a file in `visualizer/docs/`, and `visualizer/docs/` SHALL contain no image that README does not reference.

#### Scenario: No broken or orphan image
- **WHEN** the link-check command from design.md task 6.2 is run
- **THEN** it prints `OK` and lists no orphan files

### Requirement: Screenshots show the current app and the restored views
The 14 existing screenshots SHALL be regenerated from the verified app, and screenshots of Entity Diagram and Visualize Drilldown SHALL be added.

#### Scenario: Two new screenshots
- **WHEN** `ls visualizer/docs`
- **THEN** it contains `Entity-Diagram.jpg` and `Visualize-Drilldown.jpg` (and every old file name, unchanged, so old links keep working)

### Requirement: Screenshots contain no private data
Each screenshot MUST be taken from a sandbox project, show no real customer, person or e-mail data, and have been visually reviewed by the person doing the task.

#### Scenario: Review recorded
- **WHEN** task 5.4 is complete
- **THEN** a checklist line per image states "reviewed - no personal/customer data"

### Requirement: Screenshot scripts carry no internal defaults
`capture.mjs` and `login.mjs` MUST require `MC_PROJECT_KEY` instead of defaulting to an internal project key, and `capture.mjs` SHALL capture the two new views.

#### Scenario: Missing env var
- **WHEN** `node capture.mjs` is run without `MC_PROJECT_KEY`
- **THEN** it exits non-zero with a message telling the user to set `MC_PROJECT_KEY`
