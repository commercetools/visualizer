# commercetools Visualizer

> **commercetools-labs reference code.** Freely available under the [MIT license](./LICENSE), shared
> as-is and not supported by commercetools. See [SUPPORT.md](./SUPPORT.md).

**See and edit the commercetools resources the Merchant Center doesn't show, and map how your data fits together.**

Some of the resources that hold a project together, such as custom Types, States, Subscriptions,
API Extensions and Custom Objects, have no Merchant Center screen. Teams end up working with them
through raw API calls, and it's hard to see how Business Units, Stores, Product Selections and the
rest relate.

The Visualizer is a [Merchant Center custom application](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
for the developers, solution architects and project owners who work with that setup. It lets you
browse and edit those resources in forms, see State transitions as a flow diagram, draw Product
Types and Custom Object schemas as an entity diagram, and drill into your organisation structure
as a treemap.

When it works, you can understand and adjust a project's setup from one place, without leaving
the Merchant Center.


## Features

| Area | What you can do | Docs |
|---|---|---|
| Welcome | Landing page with a card for every area below | [spec](./specs/001-welcome/spec.md) |
| [Types](https://docs.commercetools.com/api/projects/types) | Browse, create and edit custom Types and their field definitions | [spec](./specs/002-types/spec.md) |
| [States](https://docs.commercetools.com/api/projects/states) | See States and their transitions as a flow diagram; create and edit States | [spec](./specs/003-states/spec.md) |
| [Subscriptions](https://docs.commercetools.com/api/projects/subscriptions) | Browse, create and edit Subscriptions (destination, messages, changes, events) | [spec](./specs/004-subscriptions/spec.md) |
| [API Extensions](https://docs.commercetools.com/api/projects/api-extensions) | Browse, create and edit API Extensions (destination, triggers, timeout) | [spec](./specs/005-extensions/spec.md) |
| [Custom Objects](https://docs.commercetools.com/api/projects/custom-objects) | Find Custom Objects by container and edit their JSON value | [spec](./specs/006-custom-objects/spec.md) |
| Entity Diagram | Draw Product Types, Types and Custom Object schemas as nodes, connect and label them; the layout is saved in your project as Custom Objects | [spec](./specs/007-entity-diagram/spec.md) |
| Visualize Drilldown | Explore Business Units, Stores, Customer Groups, Product Selections, Channels and Categories as a treemap and drill down to related entities (read-only) | [spec](./specs/008-visualize-drilldown/spec.md) |

A longer, code-derived inventory is in [FEATURES.md](./FEATURES.md). Without the Manage permission all forms are read-only.

## Installation (commercetools Connect)

The Visualizer is a Merchant Center **custom application** (UI only). It is delivered as a Connect
application of type `merchant-center-custom-application`; the folder `visualizer/` matches the `name` in
[`connect.yaml`](./connect.yaml). It has **no backend**: no endpoint, no secrets, no Extension or
Subscription is registered in your project by this app. See the
[Connect deployment documentation](https://docs.commercetools.com/merchant-center-customizations/deployment/commercetools-connect)
for details.

### Steps

1. Register the Custom Application in the Merchant Center (Organization > Custom Applications) with a
   placeholder URL (`https://example.com`), entry point `visualizer`, the scopes above and the menu links;
   note its **Application ID**.
2. Authenticate the Connect CLI: `commercetools auth login --client-credentials --client-id <client-id> --client-secret <client-secret> --region <region> --project-key <project-key>` (never commit or paste secrets).
3. Create a release **tag** of this repository.
4. Stage, preview, publish and deploy the connector with the Connect CLI, passing the three configuration
   values, in the **same region** as your project:
   `commercetools connect connectorstaged create --repository-url <https-url> --repository-tag <tag> --creator-email <email> --name visualizer --key visualizer --description "<text>" --integration-types other --supported-regions <regions>`,
   then `connectorstaged preview --key visualizer --deployment-key visualizer-preview --region <connect-region>`,
   `connectorstaged publish --key visualizer`, and
   `commercetools connect deployment create --connector-key visualizer --region <connect-region> --type production`
   (plus the configuration values).
5. Read the deployment's application URL (`deployment describe`, `applications[].url`) and put it into the
   Custom Application's *Application URL* in the Merchant Center. Install the application for your project
   and assign Teams the View/Manage permission.

Validate the manifest before staging with `commercetools connect validate .` (needs Docker).


### Configuration

| Key | In `connect.yaml` | Required | Default | Meaning |
|---|---|---|---|---|
| `CUSTOM_APPLICATION_ID` | standard | yes | - | Application ID of the Custom Application registered in the Merchant Center |
| `ENTRY_POINT_URI_PATH` | standard | yes | `visualizer` | Entry point URI path of that registration; the app is served at `<mc-host>/<project-key>/<value>` |
| `CLOUD_IDENTIFIER` | standard | yes | `gcp-eu` | Merchant Center region: `gcp-au`, `gcp-eu`, `gcp-us`, `aws-eu`, `aws-us` |
| `APPLICATION_URL` | not declared | - | - | Provided by Connect at deployment; used as the app URL |
| `INITIAL_PROJECT_KEY` | not declared | local only | `your-project-key` | Project opened by `npm start` / used by `npm run generate-types:ctp`; set in `visualizer/.env.local` |

There is no `securedConfiguration`: the app holds no secrets.

### Scopes (permissions)

| Scope | Permission group | Used for |
|---|---|---|
| `view_states` | View | States list, detail and flow diagram |
| `manage_states` | Manage | Create, edit, delete States |
| `view_types` | View | Types; Entity Diagram |
| `manage_types` | Manage | Create, edit, delete Types |
| `manage_subscriptions` | Manage | Subscriptions (the API has no `view_` scope) |
| `manage_extensions` | Manage | API Extensions (the API has no `view_` scope) |
| `view_key_value_documents` | View | Custom Objects; Entity Diagram schemas |
| `manage_key_value_documents` | Manage | Edit/delete Custom Objects; Entity Diagram saves its layout |
| `view_products` | View | Visualize Drilldown: products, channels; Entity Diagram: product types |
| `view_customers` | View | Visualize Drilldown: customers, associates, customer groups |
| `view_business_units` | View | Visualize Drilldown: business units |
| `view_stores` | View | Visualize Drilldown: stores |
| `view_product_selections` | View | Visualize Drilldown: product selections |
| `view_categories` | View | Visualize Drilldown: categories |
| `view_cart_discounts` | View | Visualize Drilldown: cart discounts |
| `view_standalone_prices` | View | Visualize Drilldown: standalone prices |

Users with the **View** permission of the app receive the `view_*` scopes; users with **Manage** receive all.
`manage_subscriptions` and `manage_extensions` have no `view_` counterpart in the commercetools API.
Keep the scopes registered in the Merchant Center identical to `visualizer/custom-application-config.mjs`
(`npm run sync` in `visualizer/` synchronises them).

### Failure behaviour

*Fail-open / fail-closed: not applicable.* The app is not in the request path of any commercetools API call:
it registers no API Extension and no Subscription, and no cart, order or other operation of your project
depends on it. If the app or Connect is unavailable, only this UI is unavailable.
*Poison messages / replay: not applicable.* The app receives and processes no messages.

### Operations runbook

| Symptom | Likely cause | What to do |
|---|---|---|
| Blank page / endless spinner after opening the app | Application URL in Merchant Center still the placeholder or wrong | Copy the deployment's application URL (`applications[].url`) into the registration |
| "Application not found" / 404 in the Merchant Center | `ENTRY_POINT_URI_PATH` or `CLOUD_IDENTIFIER` differs from the registration / region | Redeploy with the exact registered values (`deployment redeploy --configuration KEY=value`) |
| A page shows an error or empty list, browser network tab shows 403 | A needed scope is not registered in the Merchant Center | Compare the registered scopes with the table above, run `npm run sync`, re-login |
| Menu entry missing | The user's Team lacks View permission for the app | Assign the permission in Organization settings |
| Subscriptions / API Extensions pages empty for a View-only user | The commercetools API needs `manage_*` scopes for these resources | Give the Team the Manage permission |
| Change of configuration value | - | Redeploy (do not delete and recreate the deployment) |
| Where are the logs? | - | `commercetools connect deployment logs --key <deployment-key> --application visualizer` |

## Local development

Requires Node 22 and npm 10.9.2 (see `visualizer/.nvmrc`). Copy the example file, set your project key and region, and start the dev server:

```shell
cd ./visualizer
cp .env.example .env.local
# edit .env.local: INITIAL_PROJECT_KEY, CLOUD_IDENTIFIER
npm ci
npm run login
npm start
```

`visualizer/.env.example` contains these variables (the file is the reference; never commit real values):

```shell
ENTRY_POINT_URI_PATH=visualizer
CLOUD_IDENTIFIER=gcp-eu
CUSTOM_APPLICATION_ID=TODO
APPLICATION_URL=https://localhost
INITIAL_PROJECT_KEY=your-project-key
ENABLE_NEW_JSX_TRANSFORM="true"
FAST_REFRESH="true"
```

Register `http://localhost:3001` as the Application URL of a Custom Application in your Merchant Center
(see [Custom Applications](https://docs.commercetools.com/merchant-center-customizations/custom-applications)),
then open `http://localhost:3001/<your-project-key>/visualizer`.

## Development

```shell
cd ./visualizer
npm test            # jest
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
```

This repository has no GitHub Actions workflows; builds happen in Connect.

The docs screenshots can be regenerated with the Playwright scripts in [visualizer/scripts/screenshots](./visualizer/scripts/screenshots) (requires `MC_PROJECT_KEY`).

## Known issues

 - On Types: a field definition's `required` flag can only be set when the field is created; the commercetools API has no update action for it, so changing it on an existing field has no effect.
 - On Subscriptions: the subscription `format` (Platform / CloudEvents) and `status` are not exposed.
 - On Entity Diagram: it writes Custom Objects (container `mc-link-data`) into your project to save the layout, which needs the Manage permission; without it, changes are not saved.
 - On Visualize Drilldown: search is an exact match, and if your project or user lacks a permission for an entity type, that type shows a "missing permission" message instead of data.

## Specifications

The behavior of every feature is described in [specs/README.md](./specs/README.md).

## Licence and support

MIT, see [LICENSE](./LICENSE). Unsupported, see [SUPPORT.md](./SUPPORT.md). Contributions: [CONTRIBUTING.md](./CONTRIBUTING.md). Contributors: [AUTHORS.md](./AUTHORS.md).
