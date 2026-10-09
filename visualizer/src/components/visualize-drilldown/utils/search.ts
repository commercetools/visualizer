import type { EntityType } from '../types';
import { quote } from './where-predicate';

/** Exact-match search predicates per entity type (the user text is escaped). */
const SEARCH_MAPPINGS: Partial<
  Record<EntityType, (text: string, locale: string) => string>
> = {
  'business-unit': (text) => `name=${quote(text)}`,
  store: (text, locale) => `name(${locale}=${quote(text)})`,
  channel: (text, locale) => `name(${locale}=${quote(text)})`,
  product: (text) =>
    `masterData(current(masterVariant(sku=${quote(
      text
    )}))) or masterData(current(masterVariant(key=${quote(text)})))`,
  category: (text, locale) => `name(${locale}=${quote(text)})`,
  'product-selection': (text) => `key=${quote(text)}`,
  'cart-discount': (text, locale) => `name(${locale}=${quote(text)})`,
  'customer-group': (text) => `name=${quote(text)}`,
  customer: (text) => `email=${quote(text)}`,
};

export const hasSearch = (entityType: EntityType): boolean =>
  entityType in SEARCH_MAPPINGS;

/** `where` predicate for the search box, or `null` when there is no search. */
export const buildSearchWhere = (
  entityType: EntityType,
  text: string,
  dataLocale?: string | null
): string | null => {
  const mapping = SEARCH_MAPPINGS[entityType];
  if (!mapping || !text) {
    return null;
  }
  return mapping(text, dataLocale || 'en-US');
};

export { ENTITY_SORTABLE_FIELDS as SORTABLE_FIELDS } from './relationship-constants';
export { SEARCH_FIELD_KEYS } from './relationship-constants';
