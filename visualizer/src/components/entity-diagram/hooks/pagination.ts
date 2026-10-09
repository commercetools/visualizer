import type { PagedQueryResponse } from './types';

export const PAGE_SIZE = 200;
export const MAX_PAGES = 50;

/**
 * Reads every page of a paged query response (page numbers start at 1) and
 * returns one merged response. Stops when all `total` results were read, when
 * a page is empty, or after MAX_PAGES pages (safety net against an API that
 * keeps reporting more results).
 */
export const fetchAllPages = async <T>(
  fetchPage: (page: number) => Promise<PagedQueryResponse<T>>
): Promise<PagedQueryResponse<T>> => {
  const results: T[] = [];
  let first: PagedQueryResponse<T> | undefined;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetchPage(page);
    first ??= response;
    const pageResults = response.results ?? [];
    results.push(...pageResults);

    const count = response.count ?? pageResults.length;
    const offset = response.offset ?? (page - 1) * PAGE_SIZE;
    const total = response.total ?? offset + count;
    if (count === 0 || offset + count >= total) {
      break;
    }
    if (page === MAX_PAGES) {
      console.warn(
        `Entity Diagram: stopped after ${MAX_PAGES} pages, the result is incomplete.`
      );
    }
  }

  return {
    limit: first?.limit ?? PAGE_SIZE,
    offset: 0,
    count: results.length,
    total: results.length,
    results,
  };
};
