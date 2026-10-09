/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { PERMISSIONS } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Visualizer',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      // Local development only (`npm start`, `npm run login`); NOT a Connect setting.
      // Put your real project key in visualizer/.env.local (see .env.example).
      initialProjectKey: process.env.INITIAL_PROJECT_KEY ?? 'your-project-key',
    },
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
  },
  oAuthScopes: {
    view: [
      'view_states',
      'view_types',
      'view_customers',
      'view_products',
      'view_key_value_documents',
      'view_business_units',
      'view_stores',
      'view_product_selections',
      'view_categories',
      'view_cart_discounts',
      'view_standalone_prices',
    ],
    manage: [
      'manage_states',
      'manage_subscriptions',
      'manage_types',
      'manage_extensions',
      'manage_key_value_documents',
    ],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'Visualizer',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
  submenuLinks: [
    {
      uriPath: 'extensions',
      defaultLabel: 'API Extensions',
      labelAllLocales: [],
      // permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'states',
      defaultLabel: 'States',
      labelAllLocales: [],
      // permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'subscriptions',
      defaultLabel: 'Subscriptions',
      labelAllLocales: [],
      // permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'types',
      defaultLabel: 'Types',
      labelAllLocales: [],
      // permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'custom-objects',
      defaultLabel: 'Custom Objects',
      labelAllLocales: [],
      // permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'visualize-drilldown',
      defaultLabel: 'Visualize Drilldown',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
    {
      uriPath: 'entity-diagram',
      defaultLabel: 'Entity Diagram',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
  ],
};

export default config;
