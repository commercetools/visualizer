/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { NodeEntity, LinkData } from './hooks/types';
import { CustomEdgeData } from './custom-edge';
import { CustomNodeType } from './custom-node';

const parseCoordinate = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const nodeMapper = (node: NodeEntity): CustomNodeType => {
  const [x, y] = node.loc ? node.loc.split(' ') : [];
  return {
    id: node.key,
    position: { x: parseCoordinate(x), y: parseCoordinate(y) },
    data: {
      label: node.key,
      items: node.items,
      inheritedItems: node.inheritedItems,
    },
    type: 'custom',
  };
};

export const edgeMapper = (link: LinkData): CustomEdgeData => ({
  id: link.key,
  source: link.from,
  target: link.to,
  // @ts-ignore
  data: {
    label: link.text,
    toLabel: link.toText,
  },
  type: 'custom',
});

export const generateUUID = () => {
  const now = new Date();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (now.getTime() + Math.random() * 16) % 16 | 0;
    now.setMilliseconds(now.getMilliseconds() + 1);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

export const buildUrlWithParams = (
  baseUrl: string,
  options: Record<string, string | string[]>
) => {
  const queryParams = new URLSearchParams();
  if (!options) {
    return baseUrl;
  }

  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, item));
    } else {
      queryParams.append(key, value);
    }
  }

  return `${baseUrl}?${queryParams}`;
};
