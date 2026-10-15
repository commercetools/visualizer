import type { Money } from '../types';

export interface NameContext {
  /** Data locale of the Merchant Center user (e.g. `de`). */
  dataLocale?: string | null;
  /** Languages of the project, tried in order after the data locale. */
  projectLanguages?: string[];
  /** UI locale, used to format money. */
  locale?: string;
}

interface NameBearer {
  id?: string;
  key?: string;
  name?: string | Record<string, string> | Money;
}

const isMoney = (value: unknown): value is Money =>
  typeof value === 'object' &&
  value !== null &&
  'currencyCode' in value &&
  'centAmount' in value;

/**
 * Formats a Money value with the currency's own number of fraction digits
 * (JPY 0, EUR 2, KWD 3), not always 2.
 */
export const formatMoney = (money: Money, locale = 'en'): string => {
  const options = { style: 'currency', currency: money.currencyCode } as const;
  const digits = new Intl.NumberFormat(locale, options).resolvedOptions()
    .maximumFractionDigits;
  const fractionDigits = money.fractionDigits ?? digits;
  const digitsToUse = fractionDigits ?? 2;
  return new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: digitsToUse,
    maximumFractionDigits: digitsToUse,
  }).format(money.centAmount / 10 ** digitsToUse);
};

const fromLocalizedString = (
  map: Record<string, string>,
  { dataLocale, projectLanguages = [] }: NameContext
): string | undefined => {
  const candidates = [dataLocale, ...projectLanguages];
  for (const locale of candidates) {
    if (locale && map[locale]) {
      return map[locale];
    }
  }
  return Object.values(map).find((value) => Boolean(value));
};

/**
 * Display name of an entity: string name, LocalizedString (data locale, then
 * project languages, then the first value), Money, then key, then id.
 */
export const extractName = (
  entity: NameBearer | undefined,
  context: NameContext = {}
): string => {
  const name = entity?.name;
  if (typeof name === 'string' && name) {
    return name;
  }
  if (isMoney(name)) {
    return formatMoney(name, context.locale);
  }
  if (name && typeof name === 'object') {
    const localized = fromLocalizedString(name, context);
    if (localized) {
      return localized;
    }
  }
  return entity?.key || entity?.id || '';
};
