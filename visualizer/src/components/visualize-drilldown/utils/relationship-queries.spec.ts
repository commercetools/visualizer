import type { BaseEntity } from '../types';
import {
  ENTITY_ENDPOINTS,
  QUERY_ENTITY_ENDPOINTS,
  RELATIONSHIP_QUERIES,
} from './relationship-constants';

const entity = (extra: Record<string, unknown> = {}): BaseEntity =>
  ({
    id: 'p-1',
    key: 'p-key',
    version: 1,
    createdAt: '',
    lastModifiedAt: '',
    ...extra,
  } as BaseEntity);

const args = (relation: string, parent: BaseEntity) =>
  RELATIONSHIP_QUERIES[relation].parentEntitySelectorToQueryArgs!(parent);

describe('relationship queries (one row per line of the design table)', () => {
  const store = entity({
    stores: [{ key: 'a' }, { key: 'b' }],
  });
  const customers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ customer: { id: `c-${i}` } }));

  it.each([
    ['business-unit->store', store, 'store', { where: 'key in ("a","b")' }],
    [
      'business-unit->associate',
      entity({
        associates: [{ customer: { id: 'c1' } }],
        inheritedAssociates: [{ customer: { id: 'c2' } }],
      }),
      'associate',
      { where: 'id in ("c2","c1")' },
    ],
    [
      'business-unit->business-unit',
      entity(),
      'business-unit',
      { where: 'parentUnit(key="p-key")' },
    ],
    [
      'store->business-unit',
      entity(),
      'business-unit',
      { where: 'stores(key="p-key")' },
    ],
    [
      'store->product-selection',
      entity({
        productSelections: [
          { productSelection: { id: 's1' } },
          { productSelection: { id: 's2' } },
        ],
      }),
      'product-selection',
      { where: 'id in ("s1","s2")' },
    ],
    [
      'store->channel',
      entity({
        supplyChannels: [{ id: 'ch1' }],
        distributionChannels: [{ id: 'ch2' }],
      }),
      'channel',
      { where: 'id in ("ch1","ch2")' },
    ],
    [
      'store->cart-discount',
      entity(),
      'cart-discount',
      { where: 'stores(key="p-key")' },
    ],
    ['store->customer', entity(), 'customer', { where: 'stores(key="p-key")' }],
    [
      'customer-group->customer',
      entity(),
      'customer',
      { where: 'customerGroup(id="p-1")' },
    ],
    [
      'product-selection->product',
      entity(),
      'query-products-in-product-selection',
      { id: 'p-1' },
    ],
    [
      'product-selection->store',
      entity(),
      'store',
      { where: 'productSelections(productSelection(id="p-1"))' },
    ],
    [
      'channel->store',
      entity(),
      'store',
      {
        where: 'supplyChannels(id="p-1") or distributionChannels(id="p-1")',
      },
    ],
    [
      'associate->business-unit',
      entity(),
      'business-unit',
      {
        where:
          'inheritedAssociates(customer(id="p-1")) or associates(customer(id="p-1"))',
      },
    ],
    [
      'product->product-selection',
      entity(),
      'query-product-selections',
      { id: 'p-1' },
    ],
    [
      'product->standalone-price',
      entity({
        masterData: {
          current: {
            masterVariant: { sku: 'm' },
            variants: [{ sku: 'v1' }, { sku: '' }],
          },
        },
      }),
      'standalone-price',
      { where: 'sku in ("m","v1")' },
    ],
    [
      'product->category',
      entity({
        masterData: { current: { categories: [{ id: 'k1' }, { id: 'k2' }] } },
      }),
      'category',
      { where: 'id in ("k1","k2")' },
    ],
    [
      'standalone-price->product',
      entity({ sku: 'S1' }),
      'product',
      {
        where:
          'masterData(current(masterVariant(sku="S1"))) or masterData(current(variants(sku="S1")))',
      },
    ],
    [
      'category->product',
      entity(),
      'product',
      { where: 'masterData(current(categories(id="p-1")))' },
    ],
    ['category->category', entity(), 'category', { where: 'parent(id="p-1")' }],
  ])('%s', (relation, parent, child, expected) => {
    expect(RELATIONSHIP_QUERIES[relation].childEntity).toBe(child);
    expect(args(relation, parent)).toEqual(expected);
  });

  it('uses the sub-resource endpoints with the parent id', () => {
    expect(QUERY_ENTITY_ENDPOINTS['query-products-in-product-selection']).toBe(
      '/product-selections/{id}/products'
    );
    expect(QUERY_ENTITY_ENDPOINTS['query-product-selections']).toBe(
      '/products/{id}/product-selections'
    );
    expect(ENTITY_ENDPOINTS.store).toBe('/stores');
  });

  it('caps a business unit with 150 associates at 100 ids and flags it', () => {
    const result = args(
      'business-unit->associate',
      entity({ associates: customers(150) })
    )!;
    expect(result.truncated).toBe(true);
    expect(result.where!.match(/"/g)).toHaveLength(200);
  });

  it('returns null (no request) when there is nothing to query', () => {
    expect(args('business-unit->store', entity())).toBeNull();
    expect(args('business-unit->associate', entity())).toBeNull();
    expect(args('store->cart-discount', entity({ key: undefined }))).toBeNull();
    expect(args('store->customer', entity({ key: undefined }))).toBeNull();
    expect(args('product->category', entity())).toBeNull();
  });

  it('escapes quotes and backslashes in keys', () => {
    expect(args('store->business-unit', entity({ key: 'a"b\\c' }))).toEqual({
      where: 'stores(key="a\\"b\\\\c")',
    });
  });
});
