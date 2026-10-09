/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useMemo, type FC } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Heading,
  Icon,
  Stack,
  Text,
} from '@commercetools/nimbus';
import { ChevronRight } from '@commercetools/nimbus-icons';
import messages from '../messages';
import { useAdditionalData } from '../hooks/use-additional-data';
import { useContainerWidth } from '../hooks/use-container-width';
import { MAX_TILES } from '../hooks/use-drilldown-fetcher';
import { useEntityLabels } from '../hooks/use-entity-labels';
import { useEntityName } from '../hooks/use-entity-name';
import type {
  DrilldownData,
  EntityInfo,
  EntityType,
  QueryEntityType,
  SummaryLine,
  TreemapNode,
} from '../types';
import { ENTITY_COLORS } from '../utils/colors';
import { convertToEntityType } from '../utils/relationship-constants';
import { InteractiveLegend, type LegendItem } from './interactive-legend';
import { TreemapChart, type ChartNode } from './treemap-chart';

interface MultiLevelTreemapProps {
  /** Data of the current level only (one entry per child entity type). */
  drilldownData: DrilldownData[];
  hiddenTypes: EntityType[];
  onNodeClick: (node: TreemapNode, level: number) => void;
  onLoadMore: (level: number, entityType: EntityType | QueryEntityType) => void;
  onToggleEntityType: (entityType: EntityType) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onOpenEntityInfoPanel: () => void;
  isEntityInfoPanelOpen: boolean;
  selectedEntityInfo: EntityInfo | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const MultiLevelTreemap: FC<MultiLevelTreemapProps> = ({
  drilldownData,
  hiddenTypes,
  onNodeClick,
  onLoadMore,
  onToggleEntityType,
  onShowAll,
  onHideAll,
  onOpenEntityInfoPanel,
  isEntityInfoPanelOpen,
  selectedEntityInfo,
}) => {
  const intl = useIntl();
  const { singular, plural } = useEntityLabels();
  const entityName = useEntityName();
  const { ref, width } = useContainerWidth(800);

  const currentLevel = drilldownData[0]?.level ?? 0;
  const levelKey = `${currentLevel}:${drilldownData
    .map((d) => `${d.parentEntityId ?? ''}/${d.entityType}`)
    .join(',')}`;

  // Entities of the level, capped so the layout stays instant.
  const { items, capped, totalLoaded } = useMemo(() => {
    const all = drilldownData.flatMap((data) =>
      data.entities.map((entity) => ({
        entityType: convertToEntityType(data.entityType),
        entity,
      }))
    );
    return {
      items: all.slice(0, MAX_TILES),
      capped: all.length > MAX_TILES,
      totalLoaded: all.length,
    };
  }, [drilldownData]);

  const { summaries, loading: detailsLoading } = useAdditionalData(
    levelKey,
    items
  );

  const formatLine = (line: SummaryLine) => {
    const key = `summary${line.id[0].toUpperCase()}${line.id.slice(1)}`;
    const descriptor = messages[key as keyof typeof messages];
    return descriptor ? intl.formatMessage(descriptor, line.values) : '';
  };

  const nodes = useMemo(() => {
    const result: Array<ChartNode<TreemapNode>> = [];
    drilldownData.forEach((data) => {
      const type = convertToEntityType(data.entityType);
      if (hiddenTypes.includes(type)) {
        return;
      }
      data.entities.slice(0, MAX_TILES).forEach((entity) => {
        const name = entityName(entity);
        const lines = (summaries.get(entity.id) ?? []).map(formatLine);
        const typeLabel = singular(type);
        result.push({
          id: entity.id,
          entityType: type,
          name,
          typeLabel,
          lines,
          value: 1,
          ariaLabel: lines.length
            ? intl.formatMessage(messages.tileAriaWithDetails, {
                name,
                entityType: typeLabel,
                details: lines.join(', '),
              })
            : intl.formatMessage(messages.tileAria, {
                name,
                entityType: typeLabel,
              }),
          payload: { id: entity.id, name, value: 1, entityType: type, entity },
        });
      });
      if (data.pagination.hasMore) {
        const id = `load-more-${data.entityType}-${data.level}`;
        const label = intl.formatMessage(messages.loadMore);
        result.push({
          id,
          entityType: type,
          name: label,
          typeLabel: plural(type),
          lines: [],
          value: 0.5,
          isLoadMore: true,
          ariaLabel: intl.formatMessage(messages.loadMoreAria, {
            entityType: plural(type),
          }),
          payload: {
            id,
            name: label,
            value: 0.5,
            entityType: type,
            entity: { id, version: 0, createdAt: '', lastModifiedAt: '' },
            loadMore: { level: data.level, entityType: data.entityType },
          },
        });
      }
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldownData, hiddenTypes, summaries, intl, entityName]);

  if (drilldownData.length === 0) {
    return null;
  }

  const legend: LegendItem[] = drilldownData.map((data) => {
    const type = convertToEntityType(data.entityType);
    return {
      entityType: type,
      label: plural(type),
      count: data.entities.length,
      total: data.pagination.total,
      color: ENTITY_COLORS[type],
    };
  });
  const truncated = drilldownData.some((data) => data.truncated);
  const height = clamp(nodes.length * 30, 360, 700);

  const handleClick = (node: ChartNode<TreemapNode>) => {
    const { loadMore } = node.payload;
    if (loadMore) {
      onLoadMore(loadMore.level, loadMore.entityType);
    } else {
      onNodeClick(node.payload, currentLevel);
    }
  };

  return (
    <Card.Root>
      <Card.Body>
        <Stack direction="column" gap="400">
          <Stack
            direction="row"
            gap="400"
            alignItems="flex-start"
            justifyContent="space-between"
            flexWrap="wrap"
          >
            <InteractiveLegend
              legend={legend}
              hiddenTypes={hiddenTypes}
              onToggleEntityType={onToggleEntityType}
              onShowAll={onShowAll}
              onHideAll={onHideAll}
            />
            {selectedEntityInfo && (
              <Button
                variant="outline"
                size="xs"
                onPress={onOpenEntityInfoPanel}
                data-testid="drilldown-details-button"
              >
                {isEntityInfoPanelOpen
                  ? intl.formatMessage(messages.close)
                  : intl.formatMessage(messages.entityDetails, {
                      entityType: singular(selectedEntityInfo.entityType),
                    })}
                <Icon as={ChevronRight} size="xs" />
              </Button>
            )}
          </Stack>

          <div ref={ref} style={{ width: '100%' }}>
            {nodes.length > 0 ? (
              <Stack direction="column" gap="200" alignItems="center">
                {detailsLoading && (
                  <Text fontSize="sm" color="neutral.11">
                    {intl.formatMessage(messages.loadingDetails)}
                  </Text>
                )}
                <TreemapChart
                  nodes={nodes}
                  width={width}
                  height={height}
                  onNodeClick={handleClick}
                />
              </Stack>
            ) : (
              <Stack direction="column" gap="200">
                <Heading as="h3" size="sm">
                  {intl.formatMessage(messages.noEntitiesVisible)}
                </Heading>
                <Text color="neutral.11">
                  {intl.formatMessage(messages.allEntityTypesHidden)}
                </Text>
                <div>
                  <Button variant="outline" size="xs" onPress={onShowAll}>
                    {intl.formatMessage(messages.showAll)}
                  </Button>
                </div>
              </Stack>
            )}
          </div>

          {capped && (
            <Text fontSize="sm" color="neutral.11">
              {intl.formatMessage(messages.showingFirst, {
                shown: MAX_TILES,
                total: totalLoaded,
              })}
            </Text>
          )}
          {truncated && (
            <Text fontSize="sm" color="neutral.11">
              {intl.formatMessage(messages.truncatedNote, { max: 100 })}
            </Text>
          )}
          <Text fontSize="sm" color="neutral.11">
            {intl.formatMessage(
              currentLevel === 0
                ? messages.clickToExploreRoot
                : messages.clickToExploreDrilldown
            )}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};
