/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { extractName } from './extract-name';

describe('extractName', () => {
  it('returns a string name', () => {
    expect(extractName({ id: '1', name: 'Berlin' })).toBe('Berlin');
  });

  it('prefers the data locale of a localized name', () => {
    const entity = { id: '1', name: { de: 'Berlin', en: 'Berlin EN' } };
    expect(extractName(entity, { dataLocale: 'de' })).toBe('Berlin');
    expect(extractName(entity, { dataLocale: 'en' })).toBe('Berlin EN');
  });

  it('falls back to the project languages in order', () => {
    const entity = { id: '1', name: { fr: 'Berlin FR', en: 'Berlin EN' } };
    expect(
      extractName(entity, { dataLocale: 'de', projectLanguages: ['de', 'en'] })
    ).toBe('Berlin EN');
  });

  it('falls back to the first available value', () => {
    expect(extractName({ id: '1', name: { fr: 'Berlin FR' } })).toBe(
      'Berlin FR'
    );
  });

  it('formats JPY without fraction digits', () => {
    const text = extractName(
      { id: '1', name: { currencyCode: 'JPY', centAmount: 1500 } },
      { locale: 'en' }
    );
    expect(text).toContain('1,500');
    expect(text).not.toContain('15.00');
  });

  it('formats KWD with three fraction digits', () => {
    const text = extractName(
      { id: '1', name: { currencyCode: 'KWD', centAmount: 1500 } },
      { locale: 'en' }
    );
    expect(text).toContain('1.500');
  });

  it('formats EUR with two fraction digits', () => {
    const text = extractName(
      { id: '1', name: { currencyCode: 'EUR', centAmount: 1500 } },
      { locale: 'en' }
    );
    expect(text).toContain('15.00');
  });

  it('falls back to key, then id', () => {
    expect(extractName({ id: '1', key: 'k' })).toBe('k');
    expect(extractName({ id: '1' })).toBe('1');
    expect(extractName(undefined)).toBe('');
  });
});
