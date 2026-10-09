## ADDED Requirements

### Requirement: Backup before history reset
Before `.git` is removed, a verified git bundle of all refs and a tarball of the working tree (without `node_modules`) SHALL exist outside the repository.

#### Scenario: Bundle verifies
- **WHEN** `git bundle verify <bundle>` is run
- **THEN** it prints `<bundle> is okay`

### Requirement: Exactly one commit on main
After the reset, `HEAD` on branch `main` MUST have exactly one commit and no tags/other branches.

#### Scenario: Count
- **WHEN** `git rev-list --count HEAD` and `git branch -a` and `git tag` are run
- **THEN** the count is `1`, only `main` exists, and there are no tags

### Requirement: Remote is preserved
`origin` SHALL still point to `git@github.com:commercetools/visualizer.git` after the reset, and nothing SHALL have been pushed.

#### Scenario: Remote
- **WHEN** `git remote -v`
- **THEN** both lines show `git@github.com:commercetools/visualizer.git`

### Requirement: Every contributor is credited
The commit message SHALL contain one `Co-authored-by:` trailer per distinct contributor from the source history (design D5 table), with no duplicates, and the commit author SHALL be Behnam Tehrani (owner question Q4).

#### Scenario: Trailers parse
- **WHEN** `git log -1 --format='%(trailers:key=Co-authored-by,valueonly)'` is run
- **THEN** it prints exactly the 9 identities of design D5 (real e-mails exactly as in the source history)

### Requirement: Local-only directories are not published
`plans/`, `.claude/` and `.serena/` SHALL exist on disk (if present) but be absent from the commit and ignored via `.git/info/exclude`, so `git status --porcelain` is empty. `openspec/` and `specs/` SHALL be committed (published), and `.specify/` SHALL NOT be copied.

#### Scenario: Clean status
- **WHEN** `git status --porcelain` is run after the commit
- **THEN** it prints nothing, `git ls-files | grep -E '^(plans|\.claude|\.serena|\.specify)/'` prints nothing, and `git ls-files openspec` lists the published OpenSpec content
