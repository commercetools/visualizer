## Why

The owner requires **one commit** that still names **every contributor** (R3), and the labs skill requires that a
public repo has no history (a name removed in a later commit stays public in the ancestor) and that the blocking
gate (`gate.mjs`) is green on exactly what will be pushed. Today the target repo has one unrelated commit
(`27b866d`, a README containing "# visualizer") and a remote, and the finished work sits as uncommitted files.

## What Changes

- Back up the current target repo (git bundle + working-tree tarball) outside the repo.
- Re-create `.git` (`rm -rf .git && git init -b main`), re-add the `origin` remote, restore the local-only exclusions
  (`plans/`, `.claude/`, `.serena/`) via `.git/info/exclude` (`openspec/` and `specs/` are published; owner decision Q5/Q6), set the commit identity.
- Review `git add --dry-run .`, then create ONE commit with a message that explains the change and carries a
  `Co-authored-by:` trailer for every human and AI contributor identity, using the real e-mails exactly as in the source git history.
- Run `gate.mjs` until it exits 0 (fixing by `git commit --amend`, never by an extra commit).
- Prove the commit builds for a stranger: clean clone in the scratchpad + `npm ci && typecheck && lint && test && build`.
- Stop before any push (that is change J, owner approval).

## Capabilities

### New Capabilities
- `single-commit-history`: exactly one commit, correct author, remote preserved, trailers for all contributors, backup exists.
- `publication-gate`: gate exits 0 on a clean tree, and a clean clone installs, type-checks, tests and builds.

### Modified Capabilities
<!-- none -->

## Impact

- Destroys local git history of the target repo (recoverable from the bundle). Nothing remote changes in this change.
- Requires H complete (any later source edit means re-run ossify + amend + gate).
- Needs owner answers/defaults for Q2 (reset), Q3 (e-mails), Q4 (author), Q6 (local-only dirs), and new QI1-QI3.
