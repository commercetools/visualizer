## ADDED Requirements

### Requirement: Publish only after explicit approval and a fresh gate
No push, repo creation, visibility change, property/topic/setting change SHALL happen before the owner has approved (manual step M6), and the gate SHALL be re-run on the exact commit being pushed immediately beforehand.

#### Scenario: Gate SHA equals pushed SHA
- **WHEN** the push command is about to run
- **THEN** `git rev-parse --short=8 HEAD` equals the sha printed by the latest passing gate run, and `git status --porcelain` is empty

### Requirement: Public from the first push, one commit
The repository SHALL be public when the first commit is pushed (no private-then-flip with non-trivial history), and `origin/main` SHALL have exactly one commit.

#### Scenario: Remote has one commit
- **WHEN** `git clone https://github.com/commercetools/visualizer.git` is run anonymously and `git rev-list --count HEAD` executed
- **THEN** the result is `1`

### Requirement: Labs marking
The repo SHALL have the custom property `commercetools-labs=true` and the topic `labs`.

#### Scenario: Property and topic readable
- **WHEN** `gh api repos/commercetools/visualizer/properties/values` and `gh repo view commercetools/visualizer --json repositoryTopics` are run
- **THEN** the property value is `true` and the topics include `labs`

### Requirement: No GitHub Actions
The repository SHALL contain no workflows and Actions SHALL be disabled for the repo if the org allows it.

#### Scenario: Actions off
- **WHEN** `gh api repos/commercetools/visualizer/actions/permissions --jq .enabled`
- **THEN** it prints `false` (or the owner records that org policy prevents it)

### Requirement: Fresh anonymous clone builds
A clone made without credentials from the public URL SHALL pass `npm ci`, typecheck, lint, test, build (with documented dummy env) and the gate.

#### Scenario: Stranger check
- **WHEN** tasks of group 6 are run
- **THEN** all exit 0
