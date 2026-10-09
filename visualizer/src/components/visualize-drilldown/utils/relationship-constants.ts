/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import type {
  Associate,
  BusinessUnit,
  CategoryReference,
  ChannelReference,
  Customer,
  CustomerGroupAssignment,
  InheritedAssociate,
  Product,
  ProductSelectionSetting,
  StandalonePrice,
  Store,
} from '@commercetools/platform-sdk';
import type {
  BaseEntity,
  EntityType,
  QueryEntityType,
  RelationshipQuery,
  RelationshipQueryArgs,
} from '../types';
import { inList, quote } from './where-predicate';

const as = <T>(entity: BaseEntity): T => entity as unknown as T;

export const NON_ROOT_ENTITY_TYPES: EntityType[] = [
  'standalone-price',
  'associate',
  'product',
];

export const ENDPOINTS_WITH_EXPAND: Record<
  QueryEntityType,
  string | undefined
> = {
  'query-product-selections': 'productSelection',
  'query-products-in-product-selection': 'product',
};

export const ALL_ENTITY_TYPES: EntityType[] = [
  'business-unit',
  'associate',
  'customer',
  'store',
  'channel',
  'product',
  'cart-discount',
  'product-selection',
  'standalone-price',
  'customer-group',
  'category',
];

// Entity name field mapping - different entities use different fields for display names
export const ENTITY_NAME_FIELDS: Record<EntityType, string> = {
  'business-unit': 'name',
  associate: 'email',
  customer: 'email',
  store: 'name',
  channel: 'name',
  product: 'name',
  category: 'name',
  'product-selection': 'name',
  'cart-discount': 'name',
  'standalone-price': 'value',
  'customer-group': 'name',
};

export const QUERY_ENTITY_NAME_FIELDS: Record<QueryEntityType, string> = {
  'query-product-selections': 'name',
  'query-products-in-product-selection': 'name',
};

// Entity endpoint mapping
export const ENTITY_ENDPOINTS: Record<EntityType, string> = {
  'business-unit': '/business-units',
  associate: '/customers',
  customer: '/customers',
  store: '/stores',
  channel: '/channels',
  product: '/products',
  category: '/categories',
  'product-selection': '/product-selections',
  'cart-discount': '/cart-discounts',
  'standalone-price': '/standalone-prices',
  'customer-group': '/customer-groups',
};

export const QUERY_ENTITY_ENDPOINTS: Record<QueryEntityType, string> = {
  'query-product-selections': '/products/{id}/product-selections',
  'query-products-in-product-selection': '/product-selections/{id}/products',
};

/** Builds `{ where: 'id in ("a","b")', truncated }` or null when empty. */
const idsIn = (
  field: string,
  values: Array<string | undefined>
): RelationshipQueryArgs | null => {
  const list = inList(values);
  if (!list) {
    return null;
  }
  return {
    where: `${field} in ${list.predicate}`,
    ...(list.truncated ? { truncated: true } : {}),
  };
};

// Relationship field mappings - how to find related entities. Every
// interpolated value goes through `quote` / `inList` (see where-predicate).
export const RELATIONSHIP_QUERIES: Record<string, RelationshipQuery> = {
  // Business Unit relationships
  'business-unit->store': {
    childEntity: 'store',
    parentEntitySelectorToQueryArgs: (parent) =>
      idsIn(
        'key',
        (as<BusinessUnit>(parent).stores ?? []).map((store) => store.key)
      ),
  },
  'business-unit->associate': {
    childEntity: 'associate',
    parentEntitySelectorToQueryArgs: (parent) => {
      const bu = as<BusinessUnit>(parent);
      return idsIn('id', [
        ...(bu.inheritedAssociates ?? []).map(
          (associate: InheritedAssociate) => associate.customer.id
        ),
        ...(bu.associates ?? []).map(
          (associate: Associate) => associate.customer.id
        ),
      ]);
    },
  },
  'business-unit->business-unit': {
    childEntity: 'business-unit',
    parentEntitySelectorToQueryArgs: (parent) =>
      parent.key ? { where: `parentUnit(key=${quote(parent.key)})` } : null,
  },

  // Store relationships
  'store->business-unit': {
    childEntity: 'business-unit',
    parentEntitySelectorToQueryArgs: (store) =>
      store.key ? { where: `stores(key=${quote(store.key)})` } : null,
  },
  'store->product-selection': {
    childEntity: 'product-selection',
    parentEntitySelectorToQueryArgs: (store) =>
      idsIn(
        'id',
        (as<Store>(store).productSelections ?? []).map(
          (setting: ProductSelectionSetting) => setting.productSelection.id
        )
      ),
  },
  'store->channel': {
    childEntity: 'channel',
    parentEntitySelectorToQueryArgs: (parent) => {
      const store = as<Store>(parent);
      return idsIn('id', [
        ...(store.supplyChannels ?? []).map(
          (channel: ChannelReference) => channel.id
        ),
        ...(store.distributionChannels ?? []).map(
          (channel: ChannelReference) => channel.id
        ),
      ]);
    },
  },
  'store->cart-discount': {
    childEntity: 'cart-discount',
    parentEntitySelectorToQueryArgs: (store) =>
      store.key ? { where: `stores(key=${quote(store.key)})` } : null,
  },
  'store->customer': {
    childEntity: 'customer',
    parentEntitySelectorToQueryArgs: (store) =>
      store.key ? { where: `stores(key=${quote(store.key)})` } : null,
  },

  // Customer group relationships
  'customer-group->customer': {
    childEntity: 'customer',
    parentEntitySelectorToQueryArgs: (group) => ({
      where: `customerGroup(id=${quote(group.id)})`,
    }),
  },

  // Product Selection relationships - sub-resource endpoints + a stores query
  'product-selection->product': {
    childEntity: 'query-products-in-product-selection',
    parentEntitySelectorToQueryArgs: (selection) => ({ id: selection.id }),
  },
  'product-selection->store': {
    childEntity: 'store',
    parentEntitySelectorToQueryArgs: (selection) => ({
      where: `productSelections(productSelection(id=${quote(selection.id)}))`,
    }),
  },

  // Channel relationships
  'channel->store': {
    childEntity: 'store',
    parentEntitySelectorToQueryArgs: (channel) => ({
      where: `supplyChannels(id=${quote(
        channel.id
      )}) or distributionChannels(id=${quote(channel.id)})`,
    }),
  },

  // Associate (a customer) relationships
  'associate->business-unit': {
    childEntity: 'business-unit',
    parentEntitySelectorToQueryArgs: (customer) => ({
      where: `inheritedAssociates(customer(id=${quote(
        customer.id
      )})) or associates(customer(id=${quote(customer.id)}))`,
    }),
  },
  'associate->customer-group': {
    childEntity: 'customer-group',
    parentEntitySelectorToQueryArgs: (parent) => {
      const customer = as<Customer>(parent);
      return idsIn('id', [
        customer.customerGroup?.id,
        ...(customer.customerGroupAssignments ?? []).map(
          (assignment: CustomerGroupAssignment) => assignment.customerGroup?.id
        ),
      ]);
    },
  },

  // Product relationships
  'product->product-selection': {
    childEntity: 'query-product-selections',
    parentEntitySelectorToQueryArgs: (product) => ({ id: product.id }),
  },
  'product->standalone-price': {
    childEntity: 'standalone-price',
    parentEntitySelectorToQueryArgs: (parent) => {
      const current = as<Product>(parent).masterData?.current;
      return idsIn('sku', [
        current?.masterVariant?.sku,
        ...(current?.variants ?? []).map((variant) => variant.sku),
      ]);
    },
  },
  'product->category': {
    childEntity: 'category',
    parentEntitySelectorToQueryArgs: (product) =>
      idsIn(
        'id',
        (as<Product>(product).masterData?.current?.categories ?? []).map(
          (category: CategoryReference) => category.id
        )
      ),
  },

  // Standalone Price relationships
  'standalone-price->product': {
    childEntity: 'product',
    parentEntitySelectorToQueryArgs: (price) => {
      const { sku } = as<StandalonePrice>(price);
      return sku
        ? {
            where: `masterData(current(masterVariant(sku=${quote(
              sku
            )}))) or masterData(current(variants(sku=${quote(sku)})))`,
          }
        : null;
    },
  },

  // Category relationships
  'category->product': {
    childEntity: 'product',
    parentEntitySelectorToQueryArgs: (category) => ({
      where: `masterData(current(categories(id=${quote(category.id)})))`,
    }),
  },
  'category->category': {
    childEntity: 'category',
    parentEntitySelectorToQueryArgs: (category) => ({
      where: `parent(id=${quote(category.id)})`,
    }),
  },
};

export const convertToEntityType = (
  entity: EntityType | QueryEntityType
): EntityType => {
  switch (entity) {
    case 'query-product-selections':
      return 'product-selection';
    case 'query-products-in-product-selection':
      return 'product';
    default:
      return entity;
  }
};

// Sortable fields mappings for root entities
export const ENTITY_SORTABLE_FIELDS: Record<EntityType, string[]> = {
  'business-unit': ['name', 'key', 'createdAt', 'lastModifiedAt'],
  associate: ['email', 'firstName', 'lastName', 'createdAt', 'lastModifiedAt'],
  customer: ['email', 'firstName', 'lastName', 'createdAt', 'lastModifiedAt'],
  store: ['key', 'createdAt', 'lastModifiedAt'],
  channel: ['key', 'createdAt', 'lastModifiedAt'],
  product: ['key', 'createdAt', 'lastModifiedAt'], // product name is in master data, complex to sort
  category: ['key', 'orderHint', 'createdAt', 'lastModifiedAt'],
  'product-selection': ['key', 'createdAt', 'lastModifiedAt'],
  'cart-discount': ['name', 'key', 'createdAt', 'lastModifiedAt'],
  'standalone-price': ['sku', 'key', 'createdAt', 'lastModifiedAt'],
  'customer-group': ['name', 'key', 'createdAt', 'lastModifiedAt'],
};

// Field the search box matches (labels come from messages `sortField.*`)
export const SEARCH_FIELD_KEYS: Record<EntityType, string> = {
  'business-unit': 'name',
  associate: 'email',
  customer: 'email',
  store: 'name',
  channel: 'name',
  product: 'sku',
  category: 'name',
  'product-selection': 'key',
  'cart-discount': 'name',
  'standalone-price': 'sku',
  'customer-group': 'name',
};
