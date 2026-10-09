# About these change records

This folder holds the planning records of the commercetools Visualizer, written with
[OpenSpec](https://github.com/Fission-AI/OpenSpec) for coding agents and maintainers. Each folder under
`changes/` describes one step (proposal, design, tasks, requirement specs); `specs/` holds the resulting
requirements.

They describe a one-off migration: importing the app from an internal source repository, restoring features,
relicensing it as an unsupported commercetools-labs project (MIT) and publishing it as a single commit.

- Owner notes (`plans/`) and local tool folders (`.claude/`, `.serena/`) are not part of this repository. Any
  reference to them in a change file is historical; the relevant decision is stated in the file itself.
- Steps that need private credentials, organisation admin rights or a logged-in Merchant Center session are
  marked "maintainer step" and are intentionally not documented in detail.
- The records are provided AS IS and are unsupported, like the rest of the project (see [SUPPORT.md](../SUPPORT.md)).
  You do not need them to build or run the app; see the [README](../README.md).
