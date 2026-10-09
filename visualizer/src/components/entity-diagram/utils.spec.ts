import {
  buildUrlWithParams,
  edgeMapper,
  generateUUID,
  nodeMapper,
} from './utils';

const entity = { key: 'Shoe', items: [], inheritedItems: [] };

describe('nodeMapper', () => {
  it('parses the stored location', () => {
    expect(nodeMapper({ ...entity, loc: '240 80' }).position).toEqual({
      x: 240,
      y: 80,
    });
  });

  it('falls back to 0 0 without or with a malformed location', () => {
    expect(nodeMapper(entity).position).toEqual({ x: 0, y: 0 });
    expect(nodeMapper({ ...entity, loc: 'abc def' }).position).toEqual({
      x: 0,
      y: 0,
    });
    expect(nodeMapper({ ...entity, loc: '12' }).position).toEqual({
      x: 12,
      y: 0,
    });
  });

  it('uses the key as id and label', () => {
    const node = nodeMapper(entity);
    expect(node.id).toBe('Shoe');
    expect(node.data.label).toBe('Shoe');
    expect(node.type).toBe('custom');
  });
});

describe('edgeMapper', () => {
  it('maps from/to/text/toText', () => {
    const edge = edgeMapper({
      key: 'e1',
      from: 'a',
      to: 'b',
      text: 'has',
      toText: 'of',
    });
    expect(edge).toMatchObject({
      id: 'e1',
      source: 'a',
      target: 'b',
      type: 'custom',
      data: { label: 'has', toLabel: 'of' },
    });
  });
});

describe('buildUrlWithParams', () => {
  it('appends scalar and array params', () => {
    expect(buildUrlWithParams('/x', { limit: '200', a: ['1', '2'] })).toBe(
      '/x?limit=200&a=1&a=2'
    );
  });

  it('returns the base url without options', () => {
    expect(
      buildUrlWithParams('/x', undefined as unknown as Record<string, string>)
    ).toBe('/x');
  });
});

describe('generateUUID', () => {
  it('has the v4 shape and is unique', () => {
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const id = generateUUID();
      expect(id).toMatch(re);
      seen.add(id);
    }
    expect(seen.size).toBe(1000);
  });
});
