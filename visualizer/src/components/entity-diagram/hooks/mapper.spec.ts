import {
  mapProductTypeToGoEntities,
  mapSchemaTypeToGoEntities,
  mapTypeToGoEntities,
} from './mapper';
import type {
  PagedQueryResponse,
  ProductTypeResponse,
  SchemaTypeResponse,
  TypeResponse,
} from './types';

const page = <T>(results: T[]): PagedQueryResponse<T> => ({
  limit: 200,
  offset: 0,
  count: results.length,
  total: results.length,
  results,
});

const productType = {
  id: 'pt-1',
  name: 'Shoe',
  key: 'shoe',
  attributes: [{ name: 'size' }, { name: 'color' }],
} as unknown as ProductTypeResponse;

const type = {
  id: 't-1',
  name: 'Order extra',
  key: 'order-extra',
  fieldDefinitions: [{ name: 'note' }],
  resourceTypeIds: ['order'],
} as unknown as TypeResponse;

const schema = {
  id: 's-1',
  key: 'brand',
  value: {
    attributes: [
      { name: 'id', type: 'string', required: true, set: false },
      { name: 'title', type: 'string', required: false, set: false },
    ],
  },
} as SchemaTypeResponse;

describe('mapProductTypeToGoEntities', () => {
  it('uses the name as key, blue items and inherited attributes', () => {
    const [node] = mapProductTypeToGoEntities(page([productType]));
    expect(node.key).toBe('Shoe');
    expect(node.items.map((i) => i.name)).toEqual(['size', 'color']);
    expect(node.items.every((i) => i.color === 'blue')).toBe(true);
    expect(node.inheritedItems?.map((i) => i.name)).toEqual([
      'id',
      'name',
      'description',
    ]);
  });

  it('applies the stored location and omits loc without one', () => {
    const [withLoc] = mapProductTypeToGoEntities(page([productType]), [
      { key: 'Shoe', loc: '240 80' },
    ]);
    expect(withLoc.loc).toBe('240 80');
    const [withoutLoc] = mapProductTypeToGoEntities(page([productType]), [
      { key: 'other', loc: '1 1' },
    ]);
    expect(withoutLoc).not.toHaveProperty('loc');
  });
});

describe('mapTypeToGoEntities', () => {
  it('uses the key, red items and no inherited items', () => {
    const [node] = mapTypeToGoEntities(page([type]), [
      { key: 'order-extra', loc: '10 20' },
    ]);
    expect(node.key).toBe('order-extra');
    expect(node.items).toEqual([
      { name: 'note', iskey: false, figure: 'Rectangle', color: 'red' },
    ]);
    expect(node.inheritedItems).toBeUndefined();
    expect(node.loc).toBe('10 20');
  });
});

describe('mapSchemaTypeToGoEntities', () => {
  it('uses the object key, green items and marks id as key', () => {
    const [node] = mapSchemaTypeToGoEntities(page([schema]));
    expect(node.key).toBe('brand');
    expect(node.items.map((i) => [i.name, i.iskey, i.color])).toEqual([
      ['id', true, 'green'],
      ['title', false, 'green'],
    ]);
    expect(node.inheritedItems).toBeUndefined();
    expect(node).not.toHaveProperty('loc');
  });

  it('applies the stored location', () => {
    const [node] = mapSchemaTypeToGoEntities(page([schema]), [
      { key: 'brand', loc: '5 6' },
    ]);
    expect(node.loc).toBe('5 6');
  });
});
