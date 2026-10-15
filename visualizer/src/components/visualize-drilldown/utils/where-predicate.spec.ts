import { escapeString, inList, quote } from './where-predicate';

describe('escapeString', () => {
  it('escapes the backslash first, then the double quote', () => {
    expect(escapeString('a"b\\c')).toBe('a\\"b\\\\c');
  });
});

describe('quote', () => {
  it('wraps in double quotes', () => {
    expect(quote('x')).toBe('"x"');
  });
  it('escapes the content', () => {
    expect(quote('a"b')).toBe('"a\\"b"');
  });
});

describe('inList', () => {
  it('joins quoted values', () => {
    expect(inList(['a', 'b'])).toEqual({
      predicate: '("a","b")',
      truncated: false,
    });
  });

  it('caps at 100 values and reports truncation', () => {
    const values = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    const result = inList(values)!;
    expect(result.truncated).toBe(true);
    expect(result.predicate.split(',')).toHaveLength(100);
  });

  it('is not truncated at exactly the limit', () => {
    const values = Array.from({ length: 100 }, (_, i) => `id-${i}`);
    expect(inList(values)!.truncated).toBe(false);
  });

  it('returns null for an empty list or only empty values', () => {
    expect(inList([])).toBeNull();
    expect(inList([undefined, ''])).toBeNull();
  });
});
