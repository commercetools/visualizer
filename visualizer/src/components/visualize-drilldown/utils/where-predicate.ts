/** Largest number of values placed in one `in (...)` predicate. */
export const MAX_IN_LIST = 100;

/** Escapes a value for use inside a double-quoted predicate string. */
export const escapeString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** Wraps a value in double quotes after escaping it. */
export const quote = (value: string): string => `"${escapeString(value)}"`;

export interface InList {
  predicate: string;
  truncated: boolean;
}

/**
 * Builds `("a","b")` from a list of values. At most `max` values are used
 * (`truncated` tells the caller). Returns `null` for an empty list so the
 * caller can skip the request.
 */
export const inList = (
  values: Array<string | undefined | null>,
  max: number = MAX_IN_LIST
): InList | null => {
  const clean = values.filter(
    (value): value is string => typeof value === 'string' && value !== ''
  );
  if (clean.length === 0) {
    return null;
  }
  const used = clean.slice(0, max);
  return {
    predicate: `(${used.map(quote).join(',')})`,
    truncated: clean.length > max,
  };
};
