/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { ALL_ENTITY_TYPES } from './relationship-constants';
import relationships from './relationships';
import { contrastRatio, ENTITY_COLORS, getInkColor } from './colors';

describe('ENTITY_COLORS', () => {
  it('has a colour for every entity type', () => {
    ALL_ENTITY_TYPES.forEach((type) => {
      expect(ENTITY_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it.each(relationships.map((rel) => [rel.root, rel.children] as const))(
    'children of %s have pairwise different colours',
    (_root, children) => {
      const colors = children.map((type) => ENTITY_COLORS[type]);
      expect(new Set(colors).size).toBe(children.length);
    }
  );

  it('reaches 4.5:1 for the ink colour on every fill', () => {
    Object.values(ENTITY_COLORS).forEach((fill) => {
      expect(contrastRatio(getInkColor(fill), fill)).toBeGreaterThanOrEqual(
        4.5
      );
    });
  });
});

describe('getInkColor', () => {
  it('picks white on dark and near-black on light fills', () => {
    expect(getInkColor('#4a3aa7')).toBe('#ffffff');
    expect(getInkColor('#eda100')).toBe('#000000');
  });
});
