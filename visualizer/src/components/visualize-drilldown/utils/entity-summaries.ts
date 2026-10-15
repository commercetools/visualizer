import type {
  BaseEntity,
  EntityType,
  RelationshipQueryArgs,
  SummaryLine,
} from '../types';
import { formatMoney } from './extract-name';
import { RELATIONSHIP_QUERIES } from './relationship-constants';
import { getEndpoint, getExpand } from './endpoints';

export interface SummaryContext {
  locale: string;
}

/**
 * One extra line on a tile ("has 3 stores"). Either computed locally from the
 * entity already returned by the list request (no request), or by a
 * `limit=1` request whose `total` is the count.
 */
export interface SummaryDefinition {
  key: string;
  local?: (entity: BaseEntity, context: SummaryContext) => SummaryLine | null;
  /** Key of `RELATIONSHIP_QUERIES` whose request `total` is counted. */
  relation?: string;
  /** Builds the line from the `total` of the relation request. */
  fromTotal?: (total: number) => SummaryLine | null;
}

const count = (id: string, value: number): SummaryLine | null =>
  value > 0 ? { id, values: { count: value } } : null;

// REST payloads are only partly typed; read fields defensively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;
const loose = (entity: BaseEntity): Loose => entity as unknown as Loose;
const len = (value: unknown): number =>
  Array.isArray(value) ? value.length : 0;

export const ENTITY_SUMMARIES: Partial<
  Record<EntityType, SummaryDefinition[]>
> = {
  'customer-group': [
    {
      key: 'customers',
      relation: 'customer-group->customer',
      fromTotal: (total) => count('customers', total),
    },
  ],
  'product-selection': [
    {
      key: 'products',
      relation: 'product-selection->product',
      fromTotal: (total) => count('products', total),
    },
    {
      key: 'usedInStores',
      relation: 'product-selection->store',
      fromTotal: (total) => count('usedInStores', total),
    },
  ],
  product: [
    {
      key: 'variants',
      local: (entity) => {
        const current = loose(entity).masterData?.current;
        return current ? count('variants', len(current.variants) + 1) : null;
      },
    },
    {
      key: 'standalonePrices',
      relation: 'product->standalone-price',
      fromTotal: (total) => count('standalonePrices', total),
    },
    {
      key: 'categories',
      local: (entity) =>
        count('categories', len(loose(entity).masterData?.current?.categories)),
    },
  ],
  'business-unit': [
    {
      key: 'associates',
      local: (entity) =>
        count(
          'associates',
          len(loose(entity).associates) + len(loose(entity).inheritedAssociates)
        ),
    },
    {
      key: 'usedInStores',
      local: (entity) => count('usedInStores', len(loose(entity).stores)),
    },
    {
      key: 'divisions',
      relation: 'business-unit->business-unit',
      fromTotal: (total) => count('divisions', total),
    },
  ],
  store: [
    {
      key: 'productSelections',
      local: (entity) =>
        count('productSelections', len(loose(entity).productSelections)),
    },
    {
      key: 'usedInChannels',
      local: (entity) =>
        count(
          'usedInChannels',
          len(loose(entity).supplyChannels) +
            len(loose(entity).distributionChannels)
        ),
    },
    {
      key: 'cartDiscounts',
      relation: 'store->cart-discount',
      fromTotal: (total) => count('cartDiscounts', total),
    },
    {
      key: 'customers',
      relation: 'store->customer',
      fromTotal: (total) => count('customers', total),
    },
  ],
  channel: [
    {
      key: 'usedInStores',
      relation: 'channel->store',
      fromTotal: (total) => count('usedInStores', total),
    },
  ],
  category: [
    {
      key: 'products',
      relation: 'category->product',
      fromTotal: (total) => count('products', total),
    },
    {
      key: 'subcategories',
      relation: 'category->category',
      fromTotal: (total) => count('subcategories', total),
    },
  ],
  'cart-discount': [
    {
      key: 'stores',
      local: (entity) => count('stores', len(loose(entity).stores)),
    },
  ],
  associate: [
    {
      key: 'businessUnits',
      relation: 'associate->business-unit',
      fromTotal: (total) => count('businessUnits', total),
    },
  ],
  'standalone-price': [
    {
      key: 'discountedTo',
      local: (entity, { locale }) => {
        const value = loose(entity).discounted?.value;
        return value
          ? {
              id: 'discountedTo',
              values: { value: formatMoney(value, locale) },
            }
          : null;
      },
    },
  ],
};

export interface SummaryRequest {
  endpoint: string;
  params: { limit: string; offset: string; where?: string; expand?: string };
}

/** The `limit=1` request for a relation summary, or null if nothing to ask. */
export const buildSummaryRequest = (
  relation: string,
  entity: BaseEntity
): SummaryRequest | null => {
  const query = RELATIONSHIP_QUERIES[relation];
  const args: RelationshipQueryArgs | null =
    query?.parentEntitySelectorToQueryArgs?.(entity) ?? null;
  if (!query || !args) {
    return null;
  }
  return {
    endpoint: getEndpoint(query.childEntity, args),
    params: {
      limit: '1',
      offset: '0',
      where: args.where,
      expand: getExpand(query.childEntity),
    },
  };
};
