## Why

After the single, gate-clean commit exists (change I) the code must be made public in the `commercetools` GitHub org
as a commercetools-labs repo, verified from the outside, and released through Connect (R4: Connect is the only
build/hosting path). These steps are outward-facing and mostly irreversible, so they are written as an explicit,
owner-approved runbook. Nothing in this change runs until the owner says "go" (manual step M6).

## What Changes

- Detect whether `commercetools/visualizer` already exists and pick the matching push path (create, push into empty, or replace the old `27b866d` commit).
- Re-run the gate on the exact commit, push `main` and a `v1.0.0` tag **public from the start**.
- Set the `commercetools-labs=true` custom property, topic `labs`, and repository settings (issues on, Actions off, etc.).
- Verify from an anonymous fresh clone (install, typecheck, lint, test, build, gate).
- Release through Connect: stage, preview, publish, deploy; register/update the Custom Application in Merchant Center.
- Define rollback ("squash, never fixup") and an announcement text.

## Capabilities

### New Capabilities
- `public-repo-publication`: repo is public with one commit, labs property + topic, safe settings, verified by anonymous clone.
- `connect-release`: the app is staged/published/deployed on Connect and registered in MC, with the URL handshake finished.

### Modified Capabilities
<!-- none -->

## Impact

- Public, effectively irreversible exposure of the repository contents and the contributor e-mails in trailers (real e-mails exactly as in history, owner decision) and of the published `openspec/` and `specs/` folders (`plans/`, `.claude/`, `.serena/` are not shipped).
- Org-level side effects: new repo in `commercetools`, custom property value, topic.
- Connect resources (connector, deployments) and the MC Custom Application registration change.
- Manual steps M4-M8 and owner questions QJ1-QJ4 apply. Every outward-facing task below is tagged **REQUIRES OWNER APPROVAL**.
