/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { buildSearchWhere, hasSearch } from './search';

describe('buildSearchWhere', () => {
  it('uses the data locale for stores', () => {
    expect(buildSearchWhere('store', 'Berlin', 'de')).toBe('name(de="Berlin")');
  });

  it('falls back to en-US', () => {
    expect(buildSearchWhere('store', 'Berlin')).toBe('name(en-US="Berlin")');
  });

  it('escapes quotes and backslashes', () => {
    expect(buildSearchWhere('business-unit', 'a"b\\c')).toBe(
      'name="a\\"b\\\\c"'
    );
  });

  it('uses key for product selections', () => {
    expect(buildSearchWhere('product-selection', 'x')).toBe('key="x"');
  });

  it('returns null for a type without mapping or empty text', () => {
    expect(buildSearchWhere('associate', 'x')).toBeNull();
    expect(buildSearchWhere('store', '')).toBeNull();
    expect(hasSearch('associate')).toBe(false);
    expect(hasSearch('category')).toBe(true);
  });
});
