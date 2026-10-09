/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useCallback } from 'react';
import { useIntl, type MessageDescriptor } from 'react-intl';
import messages from '../messages';
import type { EntityType, QueryEntityType } from '../types';
import { convertToEntityType } from '../utils/relationship-constants';

export const ENTITY_TYPE_MESSAGES: Record<
  EntityType,
  { singular: MessageDescriptor; plural: MessageDescriptor }
> = {
  'business-unit': {
    singular: messages.businessUnitSingular,
    plural: messages.businessUnitPlural,
  },
  associate: {
    singular: messages.associateSingular,
    plural: messages.associatePlural,
  },
  customer: {
    singular: messages.customerSingular,
    plural: messages.customerPlural,
  },
  store: { singular: messages.storeSingular, plural: messages.storePlural },
  channel: {
    singular: messages.channelSingular,
    plural: messages.channelPlural,
  },
  product: {
    singular: messages.productSingular,
    plural: messages.productPlural,
  },
  category: {
    singular: messages.categorySingular,
    plural: messages.categoryPlural,
  },
  'product-selection': {
    singular: messages.productSelectionSingular,
    plural: messages.productSelectionPlural,
  },
  'cart-discount': {
    singular: messages.cartDiscountSingular,
    plural: messages.cartDiscountPlural,
  },
  'standalone-price': {
    singular: messages.standalonePriceSingular,
    plural: messages.standalonePricePlural,
  },
  'customer-group': {
    singular: messages.customerGroupSingular,
    plural: messages.customerGroupPlural,
  },
};

export const SORT_FIELD_MESSAGES: Record<string, MessageDescriptor> = {
  name: messages.sortFieldName,
  key: messages.sortFieldKey,
  email: messages.sortFieldEmail,
  firstName: messages.sortFieldFirstName,
  lastName: messages.sortFieldLastName,
  sku: messages.sortFieldSku,
  orderHint: messages.sortFieldOrderHint,
  createdAt: messages.sortFieldCreatedAt,
  lastModifiedAt: messages.sortFieldLastModifiedAt,
};

/** Localized singular / plural entity type labels and field labels. */
export const useEntityLabels = () => {
  const intl = useIntl();
  const singular = useCallback(
    (type: EntityType | QueryEntityType) =>
      intl.formatMessage(
        ENTITY_TYPE_MESSAGES[convertToEntityType(type)].singular
      ),
    [intl]
  );
  const plural = useCallback(
    (type: EntityType | QueryEntityType) =>
      intl.formatMessage(
        ENTITY_TYPE_MESSAGES[convertToEntityType(type)].plural
      ),
    [intl]
  );
  const field = useCallback(
    (name: string) =>
      SORT_FIELD_MESSAGES[name]
        ? intl.formatMessage(SORT_FIELD_MESSAGES[name])
        : name,
    [intl]
  );
  return { singular, plural, field };
};
