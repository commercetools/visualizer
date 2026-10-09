/**
 * Fixtures for the Visualize Drilldown tests: plain objects in the shape of
 * the commercetools REST API.
 */

/** msw pattern of every request the page makes (see design: Tests). */
export const PROXY_BASE = '*/proxy/ctp/:projectKey';

const base = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  version: 1,
  createdAt: '2024-01-01T10:00:00.000Z',
  lastModifiedAt: '2024-02-01T10:00:00.000Z',
  ...extra,
});

export const aStore = (i: number, extra: Record<string, unknown> = {}) =>
  base(`store-${i}`, {
    key: `store-key-${i}`,
    name: { en: `Store ${i}`, de: `Laden ${i}` },
    ...extra,
  });

export const aChannel = (i: number, extra: Record<string, unknown> = {}) =>
  base(`channel-${i}`, {
    key: `channel-key-${i}`,
    name: { en: `Channel ${i}` },
    ...extra,
  });

export const aBusinessUnit = (
  i: number,
  {
    stores = [],
    associates = [],
    ...extra
  }: {
    stores?: Array<{ key: string }>;
    associates?: Array<{ customer: { id: string } }>;
    [key: string]: unknown;
  } = {}
) =>
  base(`bu-${i}`, {
    key: `bu-key-${i}`,
    name: `Business Unit ${i}`,
    stores: stores.map((s) => ({ typeId: 'store', ...s })),
    associates,
    inheritedAssociates: [],
    ...extra,
  });

export const aCategory = (i: number, extra: Record<string, unknown> = {}) =>
  base(`category-${i}`, {
    key: `category-key-${i}`,
    name: { en: `Category ${i}` },
    orderHint: '0.1',
    ...extra,
  });

export const aProductSelection = (
  i: number,
  extra: Record<string, unknown> = {}
) =>
  base(`selection-${i}`, {
    key: `selection-key-${i}`,
    name: { en: `Selection ${i}` },
    ...extra,
  });

export const aCustomerGroup = (
  i: number,
  extra: Record<string, unknown> = {}
) =>
  base(`group-${i}`, {
    key: `group-key-${i}`,
    name: `Group ${i}`,
    ...extra,
  });

export const aCustomer = (i: number, extra: Record<string, unknown> = {}) =>
  base(`customer-${i}`, { email: `customer${i}@example.com`, ...extra });

export const aProduct = (i: number, extra: Record<string, unknown> = {}) =>
  base(`product-${i}`, {
    key: `product-key-${i}`,
    masterData: {
      current: {
        name: { en: `Product ${i}` },
        masterVariant: { sku: `sku-${i}-0` },
        variants: [{ sku: `sku-${i}-1` }],
        categories: [],
      },
    },
    ...extra,
  });

export const aStandalonePrice = (
  i: number,
  extra: Record<string, unknown> = {}
) =>
  base(`price-${i}`, {
    sku: `sku-${i}`,
    value: { currencyCode: 'JPY', centAmount: 1500 },
    ...extra,
  });

/** A REST list response. */
export const restList = (
  results: unknown[],
  total: number = results.length,
  offset = 0
) => ({
  limit: 20,
  offset,
  count: results.length,
  total,
  results,
});

export const range = <T>(n: number, build: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => build(i + 1));
