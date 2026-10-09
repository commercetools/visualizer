import type { BaseEntity, EntityType } from '../types';
import { RELATIONSHIP_QUERIES } from './relationship-constants';
import {
  buildSummaryRequest,
  ENTITY_SUMMARIES,
  type SummaryDefinition,
} from './entity-summaries';

const entity = (extra: Record<string, unknown> = {}): BaseEntity =>
  ({
    id: 'e-1',
    key: 'e-key',
    version: 1,
    createdAt: '',
    lastModifiedAt: '',
    ...extra,
  } as BaseEntity);

const local = (type: EntityType, key: string): SummaryDefinition =>
  ENTITY_SUMMARIES[type]!.find((s) => s.key === key)!;

const ctx = { locale: 'en' };

describe('local summaries', () => {
  it('counts product variants including the master variant', () => {
    const product = entity({
      masterData: { current: { variants: [{}, {}], categories: [{}, {}, {}] } },
    });
    expect(local('product', 'variants').local!(product, ctx)).toEqual({
      id: 'variants',
      values: { count: 3 },
    });
    expect(local('product', 'categories').local!(product, ctx)).toEqual({
      id: 'categories',
      values: { count: 3 },
    });
  });

  it('adds associates and inherited associates of a business unit', () => {
    const bu = entity({
      associates: [{}],
      inheritedAssociates: [{}, {}],
      stores: [{}, {}],
    });
    expect(
      local('business-unit', 'associates').local!(bu, ctx)?.values
    ).toEqual({
      count: 3,
    });
    expect(
      local('business-unit', 'usedInStores').local!(bu, ctx)?.values
    ).toEqual({ count: 2 });
  });

  it('counts the stores of a cart discount and omits zero', () => {
    expect(
      local('cart-discount', 'stores').local!(entity({ stores: [{}] }), ctx)
    ).toEqual({ id: 'stores', values: { count: 1 } });
    expect(local('cart-discount', 'stores').local!(entity(), ctx)).toBeNull();
  });

  it('formats a discounted standalone price with the currency digits', () => {
    const price = entity({
      discounted: { value: { currencyCode: 'JPY', centAmount: 1500 } },
    });
    const line = local('standalone-price', 'discountedTo').local!(price, ctx)!;
    expect(String(line.values.value)).toContain('1,500');
  });

  it('counts supply and distribution channels of a store', () => {
    const store = entity({
      supplyChannels: [{}],
      distributionChannels: [{}, {}],
    });
    expect(local('store', 'usedInChannels').local!(store, ctx)?.values).toEqual(
      {
        count: 3,
      }
    );
  });
});

describe('request summaries', () => {
  it('uses limit=1 on the endpoint of the relation', () => {
    expect(buildSummaryRequest('category->product', entity())).toEqual({
      endpoint: '/products',
      params: {
        limit: '1',
        offset: '0',
        where: 'masterData(current(categories(id="e-1")))',
        expand: undefined,
      },
    });
  });

  it('uses the sub-resource endpoint with expand for product selections', () => {
    const request = buildSummaryRequest('product-selection->product', entity());
    expect(request?.endpoint).toBe('/product-selections/e-1/products');
    expect(request?.params.expand).toBe('product');
  });

  it('returns null when the relation has nothing to ask', () => {
    expect(
      buildSummaryRequest('store->cart-discount', entity({ key: undefined }))
    ).toBeNull();
  });

  it('turns totals into lines and omits zero', () => {
    const def = ENTITY_SUMMARIES.category!.find((s) => s.key === 'products')!;
    expect(def.fromTotal!(4)).toEqual({ id: 'products', values: { count: 4 } });
    expect(def.fromTotal!(0)).toBeNull();
  });

  it('only declares relations that exist and never the dead ones', () => {
    const relations = Object.values(ENTITY_SUMMARIES)
      .flat()
      .map((def) => def?.relation)
      .filter((relation): relation is string => Boolean(relation));
    expect(relations.length).toBeGreaterThan(0);
    relations.forEach((relation) => {
      expect(Object.keys(RELATIONSHIP_QUERIES)).toContain(relation);
    });
    expect(relations).not.toContain('store->category');
    expect(relations).not.toContain('cart-discount->store');
    expect(relations).not.toContain('customer->customer-group');
  });
});
