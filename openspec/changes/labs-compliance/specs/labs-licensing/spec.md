## ADDED Requirements

### Requirement: MIT LICENSE at the repository root
The repository SHALL contain `LICENSE` with the MIT text and the holder line "commercetools GmbH and the commercetools-labs contributors" and year 2026.

#### Scenario: LICENSE present
- **WHEN** `head -3 LICENSE` is run
- **THEN** it shows `MIT License` and `Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors`

### Requirement: SPDX header in every source file
Every tracked file with extension `.ts .tsx .js .jsx .mjs .cjs` (except generated files under `src/types/generated/`) SHALL start (after an optional shebang) with the 4-line block `SPDX-License-Identifier: MIT`, copyright line, and "Freely available, AS IS and UNSUPPORTED. See LICENSE.". `.graphql` and `.css` files SHALL carry the same text as `#` / block comments.

#### Scenario: Idempotent dry run
- **WHEN** `ossify.mjs --repo . --year 2026` (dry run) is run after `--apply`
- **THEN** it reports `0 headered` and `0 FOREIGN COPYRIGHT` and `0 package.json renamed`

#### Scenario: Gate sees no missing header
- **WHEN** the gate runs later (change I)
- **THEN** its "missing SPDX header" check has zero findings

### Requirement: Package names and URLs
Both `package.json` files SHALL be named `@commercetools-labs/<name>` (`visualizer`, `visualizer-screenshots`), and `visualizer/package.json` SHALL contain `repository`, `bugs`, `homepage` pointing to `https://github.com/commercetools/visualizer`, `"license": "MIT"` and a non-empty `description`.

#### Scenario: Names
- **WHEN** `node -p "require('./visualizer/package.json').name"` is run
- **THEN** it prints `@commercetools-labs/visualizer`

#### Scenario: Lockfile consistent
- **WHEN** `cd visualizer && npm ci --dry-run --ignore-scripts`
- **THEN** it succeeds and `grep -m1 '"name"' package-lock.json` shows the new name

### Requirement: No forbidden files
The tree MUST NOT contain `.env`, `.env.local`, `*.pem`, `*.key`, `.npmrc`; `.env.example` MAY exist.

#### Scenario: Forbidden file scan
- **WHEN** `find . -path ./node_modules -prune -o \( -name .env -o -name .env.local -o -name '*.pem' -o -name '*.key' -o -name .npmrc \) -print` (excluding `*/node_modules`) is run
- **THEN** it prints nothing
