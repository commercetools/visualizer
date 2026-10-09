/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

export type QueryParams = Record<string, string | undefined>;

const KEY_ORDER = ['limit', 'offset', 'where', 'sort', 'expand'];

/**
 * Builds a query string with `encodeURIComponent` (spaces become `%20`),
 * skipping empty values. Known keys come first in a stable order
 * (limit, offset, where, sort, expand), other keys follow alphabetically.
 */
export const buildQuery = (params: QueryParams): string => {
  const keys = Object.keys(params).filter(
    (key) => params[key] !== undefined && params[key] !== ''
  );
  const rank = (key: string) => {
    const index = KEY_ORDER.indexOf(key);
    return index === -1 ? KEY_ORDER.length : index;
  };
  keys.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return keys
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]!)}`
    )
    .join('&');
};

/**
 * The MC API proxy rejects with the commercetools HTTP error, which carries
 * the HTTP status as `statusCode` (some layers expose `status`).
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  const e = error as { statusCode?: number; status?: number } | null;
  return e?.statusCode ?? e?.status ?? undefined;
};

export const isForbiddenError = (error: unknown): boolean =>
  getErrorStatus(error) === 403;
