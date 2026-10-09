## ADDED Requirements

### Requirement: "Unsupported" is stated in three places
The word "unsupported" SHALL appear (1) in every SPDX source header, (2) in a banner at the top of `README.md`, (3) in `SUPPORT.md`.

#### Scenario: Three places
- **WHEN** `grep -il unsupported README.md SUPPORT.md visualizer/src/index.tsx`
- **THEN** all three files are listed

### Requirement: SUPPORT.md and CONTRIBUTING.md exist and agree
`SUPPORT.md` SHALL state there is no support, SLA or guaranteed response; `CONTRIBUTING.md` SHALL explain what contributions are welcome without promising review, and SHALL state that pull requests may be ignored.

#### Scenario: Files present and non-promising
- **WHEN** the files are read
- **THEN** neither promises a response time and both link to `LICENSE`

### Requirement: Every contributor is named
`AUTHORS.md` SHALL list every human and AI contributor found in the history of the source repository's `main` branch (see design.md table), without private e-mail addresses.

#### Scenario: All names present
- **WHEN** each name from `git -C $SRC shortlog -s HEAD` and each `Co-Authored-By` name is searched in `AUTHORS.md`
- **THEN** every one is found
