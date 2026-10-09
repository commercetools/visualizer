## ADDED Requirements

### Requirement: Connect is the only build and hosting path
The app SHALL be built and served by commercetools Connect from the public repo at tag `v1.0.0` using `connect.yaml` (`applicationType: merchant-center-custom-application`), without GitHub Actions or other hosts.

#### Scenario: Deployment exists
- **WHEN** `commercetools connect deployment describe --key <deployment-key>` is run
- **THEN** its status is `Deployed` and it shows the connector tag `v1.0.0`

### Requirement: Register first, fix the URL last
The MC Custom Application SHALL be registered with a placeholder URL first, and after deployment its URL SHALL be replaced by the Connect deployment URL (manual steps M3 and M7).

#### Scenario: App loads from Connect
- **WHEN** the Visualizer menu entry is opened in Merchant Center
- **THEN** it loads from the Connect URL (not localhost) and the Welcome page shows all cards

### Requirement: Private connector, no certification by default
Unless the owner decides otherwise (Q11), the connector SHALL be published for the org only and NOT certified for the public marketplace.

#### Scenario: Certify not run
- **WHEN** the runbook is completed
- **THEN** no `connectorstaged certify` command was executed
