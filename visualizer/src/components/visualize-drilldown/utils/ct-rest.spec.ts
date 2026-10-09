/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { buildQuery, getErrorStatus, isForbiddenError } from './ct-rest';

describe('buildQuery', () => {
  it('encodes spaces as %20 and quotes as %22', () => {
    expect(buildQuery({ where: 'key in ("a b")' })).toBe(
      'where=key%20in%20(%22a%20b%22)'
    );
  });

  it('skips undefined and empty values', () => {
    expect(buildQuery({ limit: '20', where: undefined, sort: '' })).toBe(
      'limit=20'
    );
  });

  it('uses a stable key order regardless of insertion order', () => {
    expect(
      buildQuery({
        sort: 'key asc',
        where: 'key in ("a")',
        offset: '0',
        limit: '20',
      })
    ).toBe('limit=20&offset=0&where=key%20in%20(%22a%22)&sort=key%20asc');
  });

  it('puts expand last', () => {
    expect(buildQuery({ expand: 'product', limit: '20' })).toBe(
      'limit=20&expand=product'
    );
  });
});

describe('isForbiddenError', () => {
  it('reads statusCode (shape of the sdk rejection)', () => {
    expect(isForbiddenError({ statusCode: 403, status: 403 })).toBe(true);
  });
  it('falls back to status', () => {
    expect(isForbiddenError({ status: 403 })).toBe(true);
  });
  it('is false for other errors and non-objects', () => {
    expect(isForbiddenError({ statusCode: 500 })).toBe(false);
    expect(isForbiddenError(new Error('x'))).toBe(false);
    expect(isForbiddenError(null)).toBe(false);
  });
  it('exposes the status', () => {
    expect(getErrorStatus({ statusCode: 404 })).toBe(404);
    expect(getErrorStatus(undefined)).toBeUndefined();
  });
});
