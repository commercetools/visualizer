import type { EntityType } from '../types';

/**
 * Categorical colours of the 11 entity types (8 slots of the dataviz palette,
 * light mode). Types that never appear together at one level share a slot.
 *
 * Palette validator (`validate_palette.js --mode light`) result:
 * lightness band PASS, chroma floor PASS, CVD separation PASS (worst adjacent
 * pair dE 9.1), normal-vision floor PASS (worst 19.6), contrast vs surface WARN
 * for aqua / yellow / magenta (below 3:1). Relief: every tile has visible text,
 * an accessible name and a tooltip, and the legend names each type.
 */
export const ENTITY_COLORS: Record<EntityType, string> = {
  'business-unit': '#2a78d6',
  'standalone-price': '#2a78d6',
  store: '#eb6834',
  'customer-group': '#eb6834',
  product: '#1baf7a',
  channel: '#eda100',
  'product-selection': '#e87ba4',
  category: '#008300',
  customer: '#4a3aa7',
  associate: '#4a3aa7',
  'cart-discount': '#e34948',
};

export const LOAD_MORE_FILL_TOKEN = 'neutral.3';
export const LOAD_MORE_BORDER_TOKEN = 'neutral.8';

const INK_DARK = '#000000';
const INK_LIGHT = '#ffffff';

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG 2.x contrast ratio between two `#rrggbb` colours. */
export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** Text colour (near-black or white) with the higher contrast on `fill`. */
export const getInkColor = (fill: string): string =>
  contrastRatio(INK_DARK, fill) >= contrastRatio(INK_LIGHT, fill)
    ? INK_DARK
    : INK_LIGHT;
