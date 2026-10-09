/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { fetchAllPages, MAX_PAGES } from './pagination';
import type { PagedQueryResponse } from './types';

const makePager =
  (total: number, limit = 200) =>
  async (page: number): Promise<PagedQueryResponse<number>> => {
    const offset = (page - 1) * limit;
    const count = Math.max(0, Math.min(limit, total - offset));
    return {
      limit,
      offset,
      count,
      total,
      results: Array.from({ length: count }, (_, i) => offset + i),
    };
  };

describe('fetchAllPages', () => {
  it('reads 450 items in 3 pages', async () => {
    const pager = jest.fn(makePager(450));
    const out = await fetchAllPages(pager);
    expect(out.results).toHaveLength(450);
    expect(out.results[449]).toBe(449);
    expect(pager).toHaveBeenCalledTimes(3);
    expect(pager.mock.calls.map(([page]) => page)).toEqual([1, 2, 3]);
  });

  it('returns an empty result for an empty first page', async () => {
    const pager = jest.fn(makePager(0));
    const out = await fetchAllPages(pager);
    expect(out.results).toEqual([]);
    expect(pager).toHaveBeenCalledTimes(1);
  });

  it('needs a single call for exactly one full page', async () => {
    const pager = jest.fn(makePager(200));
    const out = await fetchAllPages(pager);
    expect(out.results).toHaveLength(200);
    expect(pager).toHaveBeenCalledTimes(1);
  });

  it('stops at the page cap and warns', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const pager = jest.fn(makePager(1e9));
    const out = await fetchAllPages(pager);
    expect(pager).toHaveBeenCalledTimes(MAX_PAGES);
    expect(out.results).toHaveLength(MAX_PAGES * 200);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
