import type { LinkData, LocationData, NodeEntity } from '../hooks/types';
import {
  applyLinkChange,
  applyLocationChange,
  dedupeNodes,
} from './apply-change';

const freeze = <T>(list: T[]): T[] => {
  list.forEach((item) => Object.freeze(item));
  return Object.freeze(list) as T[];
};

const links = (): LinkData[] =>
  freeze([
    { key: 'l1', from: 'a', to: 'b', text: 'x', toText: 'y' },
    { key: 'l2', from: 'b', to: 'c' },
  ]);

describe('applyLinkChange', () => {
  it('adds a link without mutating the input', () => {
    const input = links();
    const out = applyLinkChange(input, {
      type: 'linkAdded',
      key: 'l3',
      fromNode: 'c',
      toNode: 'a',
      text: '',
      toText: '',
    });
    expect(out).toHaveLength(3);
    expect(out[2]).toEqual({
      key: 'l3',
      from: 'c',
      to: 'a',
      text: '',
      toText: '',
    });
    expect(input).toHaveLength(2);
  });

  it('returns the same reference for a duplicate add', () => {
    const input = links();
    const out = applyLinkChange(input, {
      type: 'linkAdded',
      key: 'l1',
      fromNode: 'z',
      toNode: 'z',
    });
    expect(out).toBe(input);
  });

  it('modifies an existing link', () => {
    const input = links();
    const out = applyLinkChange(input, {
      type: 'linkModified',
      key: 'l2',
      newFromNode: 'a',
      newToNode: 'c',
      text: 't',
      toText: 'tt',
    });
    expect(out[1]).toEqual({
      key: 'l2',
      from: 'a',
      to: 'c',
      text: 't',
      toText: 'tt',
    });
    expect(out[0]).toBe(input[0]);
  });

  it('returns the same reference when modifying an unknown link', () => {
    const input = links();
    expect(
      applyLinkChange(input, {
        type: 'linkModified',
        key: 'nope',
        newFromNode: 'a',
        newToNode: 'b',
      })
    ).toBe(input);
  });

  it('removes a link and is idempotent', () => {
    const input = links();
    const once = applyLinkChange(input, { type: 'linkRemoved', key: 'l1' });
    expect(once.map((l) => l.key)).toEqual(['l2']);
    const twice = applyLinkChange(once, { type: 'linkRemoved', key: 'l1' });
    expect(twice).toBe(once);
  });

  it('changes the from text', () => {
    const out = applyLinkChange(links(), {
      type: 'linkTextChanged',
      key: 'l1',
      oldText: 'x',
      newText: 'new',
      isFromText: true,
    });
    expect(out[0]).toMatchObject({ text: 'new', toText: 'y' });
  });

  it('changes the to text', () => {
    const out = applyLinkChange(links(), {
      type: 'linkTextChanged',
      key: 'l1',
      oldText: 'y',
      newText: 'new',
      isFromText: false,
    });
    expect(out[0]).toMatchObject({ text: 'x', toText: 'new' });
  });

  it('returns the same reference for a text change on an unknown link', () => {
    const input = links();
    expect(
      applyLinkChange(input, {
        type: 'linkTextChanged',
        key: 'nope',
        oldText: '',
        newText: 'a',
        isFromText: true,
      })
    ).toBe(input);
  });
});

describe('applyLocationChange', () => {
  const locations = (): LocationData[] => freeze([{ key: 'a', loc: '1 1' }]);

  it('updates an existing location', () => {
    const input = locations();
    const out = applyLocationChange(
      input,
      { type: 'nodePositionChanged', nodeKey: 'a', loc: '5 6' },
      ['a', 'b']
    );
    expect(out).toEqual([{ key: 'a', loc: '5 6' }]);
    expect(input[0].loc).toBe('1 1');
  });

  it('adds a location for a known node', () => {
    const out = applyLocationChange(
      locations(),
      { type: 'nodePositionChanged', nodeKey: 'b', loc: '2 2' },
      ['a', 'b']
    );
    expect(out).toEqual([
      { key: 'a', loc: '1 1' },
      { key: 'b', loc: '2 2' },
    ]);
  });

  it('ignores unknown nodes and unchanged positions (same reference)', () => {
    const input = locations();
    expect(
      applyLocationChange(
        input,
        { type: 'nodePositionChanged', nodeKey: 'zzz', loc: '2 2' },
        ['a']
      )
    ).toBe(input);
    expect(
      applyLocationChange(
        input,
        { type: 'nodePositionChanged', nodeKey: 'a', loc: '1 1' },
        ['a']
      )
    ).toBe(input);
  });

  it('ignores other change types', () => {
    const input = locations();
    expect(
      applyLocationChange(input, { type: 'linkRemoved', key: 'x' }, ['a'])
    ).toBe(input);
  });
});

describe('dedupeNodes', () => {
  const node = (key: string, marker: string): NodeEntity => ({
    key,
    items: [{ name: marker, iskey: false, figure: 'Rectangle', color: 'red' }],
  });

  it('keeps the first node per key and warns once per dropped key', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const out = dedupeNodes([
      node('a', 'first'),
      node('b', 'b'),
      node('a', 'second'),
      node('a', 'third'),
    ]);
    expect(out.map((n) => n.key)).toEqual(['a', 'b']);
    expect(out[0].items[0].name).toBe('first');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('does not warn without collisions', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    dedupeNodes([node('a', 'a'), node('b', 'b')]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
