## ADDED Requirements

### Requirement: Source is copied without history, workflows or build output
The repository SHALL contain a copy of the Visualizer working tree from the source repo with the
exclusion list defined in `design.md` applied, and SHALL NOT contain any of: a copied `.git`
directory, a `.github` directory, `netlify.toml`, any `node_modules` that came from the source,
`visualizer/public/`, `google*.html`, `coverage/`, `.DS_Store`, `.serena/`, `.specify/`, or a
`.claude/` folder originating from the source.

#### Scenario: Excluded paths are absent
- **WHEN** a developer runs the "negative check" command from `tasks.md`
- **THEN** every excluded path is reported as missing (no output from the `find` command)

#### Scenario: Copied files are byte-identical
- **WHEN** the SHA-256 manifest of the copied files is compared with the manifest of the source's
  tracked files (minus excluded paths)
- **THEN** the comparison prints no difference, except for `visualizer/eslint.config.js`
  (intentionally changed, see the lint requirement) and `README.md` is the source README

### Requirement: Nested layout is preserved
The application SHALL live in `visualizer/` inside this repo, and `connect.yaml` SHALL live at the
repo root, so that `deployAs[].name: visualizer` matches the folder `./visualizer`.

#### Scenario: Connect folder-name rule
- **WHEN** `ls connect.yaml visualizer/package.json visualizer/custom-application-config.mjs` is run at the repo root
- **THEN** all three files are listed and no error is printed

### Requirement: Nothing is committed and local tooling folders cannot leak
The import SHALL NOT create any commit. The folders `.claude/`, `openspec/`, `plans/` (and
`.serena/`, `.specify/`, `.vscode/`, `.idea/`, `visualizer/.env.local`) SHALL be listed in
`.git/info/exclude` so they are never staged by `git add .`.

#### Scenario: Still a single pre-existing commit
- **WHEN** `git rev-list --count HEAD` is run after the import
- **THEN** it prints `1` and `git log --oneline` shows only `27b866d`

#### Scenario: Planning folders are not stageable
- **WHEN** `git add --dry-run .` is run
- **THEN** no path starting with `.claude/`, `openspec/` or `plans/` is listed

### Requirement: Reproducible dependency install
Dependencies SHALL be installed with `npm ci` inside `visualizer/` using Node 22, and the
installation SHALL NOT modify `package-lock.json`.

#### Scenario: Lock file untouched
- **WHEN** `shasum -a 256 visualizer/package-lock.json` is run before and after `npm ci`
- **THEN** both hashes are identical

### Requirement: Green baseline for typecheck, lint, test and build
After the import, from `visualizer/`: `npm run typecheck` SHALL exit 0; `npm run lint` SHALL exit 0
with 0 errors (warnings allowed, recorded); `npm test` SHALL pass all suites; and `npm run build`
SHALL exit 0 when the documented environment variables are provided. The observed numbers SHALL be
recorded in `tasks.md`.

#### Scenario: Lint is green after the documented fix
- **WHEN** `npm run lint` is run after `scripts/screenshots/**` was added to the ESLint `ignores`
- **THEN** the exit code is 0 and the summary shows `0 errors` (the baseline shows 14 warnings)

#### Scenario: Build needs environment variables
- **WHEN** `npm run build` is run without `CLOUD_IDENTIFIER`
- **THEN** it fails with `Missing environment variable 'CLOUD_IDENTIFIER'`
- **AND WHEN** it is run with the variables from `tasks.md`
- **THEN** it exits 0 and prints `Compiled successfully.`
