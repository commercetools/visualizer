/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { defineMessages } from 'react-intl';

export default defineMessages<string>({
  title: {
    id: 'EntityDiagram.title',
    defaultMessage: 'Entity Diagram',
  },
  loading: {
    id: 'EntityDiagram.loading',
    defaultMessage: 'Loading entity diagram',
  },
  loadError: {
    id: 'EntityDiagram.loadError',
    defaultMessage: 'The entity diagram could not be loaded',
  },
  saveError: {
    id: 'EntityDiagram.saveError',
    defaultMessage: 'Your changes could not be saved',
  },
  empty: {
    id: 'EntityDiagram.empty',
    defaultMessage:
      'No product types, types or custom object schemas found in this project.',
  },
  readOnly: {
    id: 'EntityDiagram.readOnly',
    defaultMessage:
      'You have view-only access. Changes to the diagram are not saved.',
  },
  attributes: {
    id: 'EntityDiagram.attributes',
    defaultMessage: 'Attributes',
  },
  inheritedAttributes: {
    id: 'EntityDiagram.inheritedAttributes',
    defaultMessage: 'Inherited Attributes',
  },
  edgeLabelInput: {
    id: 'EntityDiagram.edgeLabelInput',
    defaultMessage: 'Relation label',
  },
  canvasAriaLabel: {
    id: 'EntityDiagram.canvasAriaLabel',
    defaultMessage: 'Entity diagram canvas',
  },
});
