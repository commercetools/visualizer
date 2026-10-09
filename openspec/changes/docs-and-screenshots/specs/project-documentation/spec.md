## ADDED Requirements

### Requirement: README describes the product as published
The `README.md` SHALL describe all seven areas (Types, States, Subscriptions, API Extensions, Custom Objects,
Welcome, plus Visualize Drilldown and Entity Diagram), how to install via Connect, the OAuth scopes table, the
Connect configuration table, local development, known issues and screenshots.

#### Scenario: Feature list is complete
- **WHEN** a reader opens `README.md`
- **THEN** the features list names Entity Diagram and Visualize Drilldown and every submenu link in `custom-application-config.mjs` appears in the README

#### Scenario: Scopes match the config
- **WHEN** every `view_*`/`manage_*` scope in `visualizer/custom-application-config.mjs` is searched in `README.md`
- **THEN** each one is found and the README lists no scope that the config does not request

#### Scenario: Config table matches connect.yaml
- **WHEN** each `key` under `standardConfiguration` in `connect.yaml` is searched in the README configuration table
- **THEN** each one is found with the same default and required flag

### Requirement: Documentation states there is no GitHub Actions
`CLAUDE.md` and `README.md` MUST NOT claim that CI runs on GitHub Actions and SHALL state that the project ships
no GitHub workflows and is built and hosted only through commercetools Connect.

#### Scenario: No stale CI claim
- **WHEN** `grep -rn -i "github/workflows\|ci.yml\|netlify" README.md FEATURES.md CLAUDE.md` is run
- **THEN** the only hits are sentences saying that no workflows / no Netlify are used

### Requirement: Stale statements about the two views are removed
Documentation MUST NOT say that `entity-diagram` or `visualize-drilldown` are removed or "not being reimplemented".

#### Scenario: No "not being reimplemented"
- **WHEN** `grep -rn -i "not being reimplemented\|not reimplemented\|were removed" README.md FEATURES.md CLAUDE.md specs/`
- **THEN** there are no matches that refer to the two views

### Requirement: No internal organisation names
Tracked documentation and scripts MUST NOT contain the string `<internal-org>` or the internal sandbox
project key `<project-key>`.

#### Scenario: Scrub grep is empty
- **WHEN** `git grep -n -i -e "<internal-org>" -e "<internal-sandbox>" -- . ':!plans' ':!.claude'` is run after the commit (openspec/ and specs/ are published, so they are included in the scan)
- **THEN** it prints nothing
