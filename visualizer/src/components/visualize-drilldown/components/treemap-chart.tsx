/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useMemo } from 'react';
import { Treemap, hierarchy, treemapSquarify } from '@visx/hierarchy';
import { Box, Button, Stack, Text, Tooltip } from '@commercetools/nimbus';
import type { EntityType } from '../types';
import {
  ENTITY_COLORS,
  getInkColor,
  LOAD_MORE_BORDER_TOKEN,
  LOAD_MORE_FILL_TOKEN,
} from '../utils/colors';

/** A tile to draw. `payload` is handed back untouched on click. */
export interface ChartNode<T = unknown> {
  id: string;
  entityType: EntityType;
  /** Display name, resolved by the caller (localized). */
  name: string;
  /** Localized label of the entity type (tooltip and accessible name). */
  typeLabel: string;
  /** Extra lines such as "has 3 stores". */
  lines: string[];
  /** Layout weight: 1 for entities, 0.5 for "load more". */
  value: number;
  /** Accessible name of the tile. */
  ariaLabel: string;
  isLoadMore?: boolean;
  payload: T;
}

interface TreemapChartProps<T> {
  nodes: Array<ChartNode<T>>;
  width: number;
  height: number;
  onNodeClick: (node: ChartNode<T>) => void;
  'data-testid'?: string;
}

/** Hierarchy input of the layout: one weighted leaf per node. */
export const toTreemapData = (
  nodes: Array<Pick<ChartNode, 'id' | 'value'>>
): Array<{ id: string; value: number }> =>
  nodes.map(({ id, value }) => ({ id, value }));

interface LeafData {
  id: string;
  value?: number;
  children?: LeafData[];
}

const MIN_TEXT_WIDTH = 60;
const MIN_TEXT_HEIGHT = 30;
const MIN_DETAIL_HEIGHT = 50;

interface TileProps<T> {
  node: ChartNode<T>;
  rect: { left: number; top: number; width: number; height: number };
  onClick: () => void;
}

const Tile = <T,>({ node, rect, onClick }: TileProps<T>) => {
  const { isLoadMore } = node;
  const fill = ENTITY_COLORS[node.entityType];
  const showText = rect.width > MIN_TEXT_WIDTH && rect.height > MIN_TEXT_HEIGHT;
  const showLines = showText && rect.height > MIN_DETAIL_HEIGHT;
  const colorProps = isLoadMore
    ? {
        bg: LOAD_MORE_FILL_TOKEN,
        color: 'neutral.12',
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: LOAD_MORE_BORDER_TOKEN,
      }
    : { borderWidth: '0' };
  const style = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    ...(isLoadMore ? {} : { backgroundColor: fill, color: getInkColor(fill) }),
  };

  return (
    <Tooltip.Root>
      <Button
        unstyled
        position="absolute"
        borderRadius="100"
        cursor="pointer"
        overflow="hidden"
        padding="100"
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        _hover={{ filter: 'brightness(0.92)' }}
        _focusVisible={{
          outline: '3px solid',
          outlineColor: 'neutral.12',
          outlineOffset: '2px',
          zIndex: 1,
        }}
        {...colorProps}
        style={style}
        aria-label={node.ariaLabel}
        data-testid={
          isLoadMore
            ? `drilldown-load-more-${node.entityType}`
            : `drilldown-tile-${node.id}`
        }
        data-entity-type={node.entityType}
        onPress={onClick}
      >
        {isLoadMore
          ? rect.width > 30 &&
            rect.height > 30 && (
              <Text
                as="span"
                fontSize="lg"
                fontWeight="bold"
                aria-hidden="true"
              >
                ...
              </Text>
            )
          : showText && (
              <Stack direction="column" gap="0" width="100%" aria-hidden="true">
                <Text
                  as="span"
                  fontSize="xs"
                  fontWeight="bold"
                  color="inherit"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.name}
                </Text>
                {showLines &&
                  node.lines.map((line) => (
                    <Text
                      key={line}
                      as="span"
                      fontSize="xs"
                      color="inherit"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {line}
                    </Text>
                  ))}
              </Stack>
            )}
      </Button>
      <Tooltip.Content>
        <Stack direction="column" gap="0">
          <Text fontWeight="bold">{node.name}</Text>
          <Text fontSize="sm">{node.typeLabel}</Text>
          {node.lines.map((line) => (
            <Text key={line} fontSize="sm">
              {line}
            </Text>
          ))}
        </Stack>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};

export const TreemapChart = <T,>({
  nodes,
  width,
  height,
  onNodeClick,
  'data-testid': testId = 'drilldown-treemap',
}: TreemapChartProps<T>) => {
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );
  const root = useMemo(
    () =>
      hierarchy<LeafData>({ id: 'root', children: toTreemapData(nodes) })
        .sum((d) => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [nodes]
  );

  return (
    <Box
      position="relative"
      data-testid={testId}
      style={{ width, height, maxWidth: '100%' }}
    >
      <Treemap
        root={root}
        size={[width, height]}
        tile={treemapSquarify}
        paddingInner={2}
        round
      >
        {(layout) =>
          layout.leaves().map((leaf) => {
            const { x0, y0, x1, y1 } = leaf;
            const id = leaf.data.id;
            const node = byId.get(id);
            if (!node) {
              return null;
            }
            const w = x1 - x0;
            const h = y1 - y0;
            return (
              <Tile
                key={id}
                node={node}
                rect={{ left: x0, top: y0, width: w, height: h }}
                onClick={() => onNodeClick(node)}
              />
            );
          })
        }
      </Treemap>
    </Box>
  );
};
