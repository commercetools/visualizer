/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useCallback, useEffect, useReducer, useState, type FC } from 'react';
import { useIntl } from 'react-intl';
import {
  Alert,
  DefaultPage,
  LoadingSpinner,
  Stack,
  Text,
} from '@commercetools/nimbus';
import messages from './messages';
import { BreadcrumbNavigation } from './components/breadcrumb-navigation';
import { EntityInfoPanel } from './components/entity-info-panel';
import { EntitySelector } from './components/entity-selector';
import { MultiLevelTreemap } from './components/multi-level-treemap';
import { SearchAndSortControls } from './components/search-and-sort-controls';
import { useDrilldownFetcher } from './hooks/use-drilldown-fetcher';
import { useEntityLabels } from './hooks/use-entity-labels';
import { useEntityName } from './hooks/use-entity-name';
import type { EntityType, QueryEntityType, TreemapNode } from './types';
import {
  initialNavigationState,
  navigationReducer,
  type SortDirection,
} from './utils/navigation-reducer';
import { relationshipManager } from './utils/relationship-utils';

const VisualizeDrilldown: FC = () => {
  const intl = useIntl();
  const { plural } = useEntityLabels();
  const entityName = useEntityName();
  const [nav, dispatch] = useReducer(navigationReducer, initialNavigationState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    levels,
    loading,
    error,
    failures,
    fetchRoot,
    fetchRelated,
    loadMore,
    reset,
  } = useDrilldownFetcher();

  const { selectedType, levelIndex, search, sort } = nav;
  const isAtRoot = levelIndex === 0;

  // Root list: (re)load when the type, the root level, search or sort change.
  useEffect(() => {
    if (selectedType && isAtRoot) {
      fetchRoot(selectedType, { search, sort });
    }
  }, [selectedType, isAtRoot, search, sort, fetchRoot]);

  const handleEntityTypeSelect = useCallback(
    (entityType: EntityType) => {
      // Re-clicking the active type at the root would clear the data without
      // changing any effect dependency, so nothing would refetch it.
      if (entityType === selectedType && isAtRoot) return;
      reset();
      setIsDrawerOpen(false);
      dispatch({ type: 'selectType', entityType });
    },
    [reset, selectedType, isAtRoot]
  );

  const handleNodeClick = useCallback(
    (node: TreemapNode, currentLevel: number) => {
      const selected = {
        id: node.id,
        name: entityName(node.entity),
        entityType: node.entityType,
        data: node.entity,
      };
      const hasChildren =
        relationshipManager.getChildrenForEntityType(node.entityType).length >
        0;
      if (hasChildren) {
        dispatch({ type: 'drillInto', entity: selected });
        fetchRelated(node.entity, node.entityType, currentLevel + 1);
      } else {
        dispatch({ type: 'selectEntity', entity: selected });
      }
    },
    [entityName, fetchRelated]
  );

  const handleLoadMore = useCallback(
    (level: number, entityType: EntityType | QueryEntityType) => {
      loadMore(level, entityType, level === 0 ? { search, sort } : undefined);
    },
    [loadMore, search, sort]
  );

  const handleSortChange = useCallback(
    (field: string, direction: SortDirection) =>
      dispatch({ type: 'setSort', field, direction }),
    []
  );

  const visibleData = levels.filter((data) => data.level === levelIndex);
  const forbiddenFailure = failures.some((f) => f.statusCode === 403);

  return (
    <DefaultPage.Root>
      <DefaultPage.Header>
        <DefaultPage.Title>
          {intl.formatMessage(messages.title)}
        </DefaultPage.Title>
      </DefaultPage.Header>
      <DefaultPage.Content>
        <Stack direction="column" gap="600">
          <Text>{intl.formatMessage(messages.description)}</Text>

          <EntitySelector
            selectedEntityType={selectedType}
            onEntityTypeSelect={handleEntityTypeSelect}
            loading={loading}
          />

          {!selectedType && (
            <Text color="neutral.11">
              {intl.formatMessage(messages.selectPrompt)}
            </Text>
          )}

          {selectedType && isAtRoot && (
            <SearchAndSortControls
              entityType={selectedType}
              search={search}
              sort={sort}
              onSearchChange={(value) =>
                dispatch({ type: 'setSearch', search: value })
              }
              onSortChange={handleSortChange}
              onClearSearch={() => dispatch({ type: 'setSearch', search: '' })}
            />
          )}

          {!isAtRoot && (
            <BreadcrumbNavigation
              breadcrumbs={nav.breadcrumbs}
              onNavigateToLevel={(level) =>
                dispatch({ type: 'goToLevel', level })
              }
              onNavigateToRoot={() => dispatch({ type: 'goToRoot' })}
            />
          )}

          {error && (
            <Alert.Root colorPalette="critical" data-testid="drilldown-error">
              <Alert.Description>
                {error.missingProject
                  ? intl.formatMessage(messages.missingProject)
                  : error.statusCode === 403 && error.entityType
                  ? intl.formatMessage(messages.forbiddenRoot, {
                      entityType: plural(error.entityType),
                      endpoint: error.endpoint ?? '',
                    })
                  : intl.formatMessage(messages.errorLoadingEntities, {
                      error: error.message,
                    })}
              </Alert.Description>
            </Alert.Root>
          )}

          {!loading && failures.length > 0 && (
            <Alert.Root colorPalette="warning" data-testid="drilldown-warning">
              <Alert.Description>
                {intl.formatMessage(
                  forbiddenFailure
                    ? messages.forbiddenRelation
                    : messages.failedRelation,
                  {
                    entityTypes: failures
                      .map((f) => plural(f.entityType))
                      .join(', '),
                  }
                )}
              </Alert.Description>
            </Alert.Root>
          )}

          {loading && (
            <Stack
              direction="column"
              alignItems="center"
              gap="200"
              data-testid="drilldown-loading"
            >
              <LoadingSpinner
                aria-label={intl.formatMessage(messages.loadingRelatedEntities)}
              />
              <Text>
                {isAtRoot && selectedType
                  ? intl.formatMessage(messages.loadingEntities, {
                      entityType: plural(selectedType),
                    })
                  : intl.formatMessage(messages.loadingRelatedEntities)}
              </Text>
            </Stack>
          )}

          {/* Stays mounted while loading more, so tile summaries are kept. */}
          {!error && visibleData.length > 0 && (
            <MultiLevelTreemap
              drilldownData={visibleData}
              hiddenTypes={nav.hiddenTypes}
              onNodeClick={handleNodeClick}
              onLoadMore={handleLoadMore}
              onToggleEntityType={(entityType) =>
                dispatch({ type: 'toggleType', entityType })
              }
              onShowAll={() => dispatch({ type: 'showAll' })}
              onHideAll={() => dispatch({ type: 'hideAll' })}
              onOpenEntityInfoPanel={() => setIsDrawerOpen(true)}
              isEntityInfoPanelOpen={isDrawerOpen}
              selectedEntityInfo={nav.selectedEntity}
            />
          )}

          {!loading &&
            !error &&
            selectedType &&
            visibleData.length === 0 &&
            (isAtRoot || failures.length === 0) && (
              <Alert.Root colorPalette="info" data-testid="drilldown-empty">
                <Alert.Description>
                  {isAtRoot
                    ? intl.formatMessage(messages.noDataFound, {
                        entityType: plural(selectedType),
                      })
                    : intl.formatMessage(messages.emptyRelated)}
                </Alert.Description>
              </Alert.Root>
            )}
        </Stack>
      </DefaultPage.Content>

      <EntityInfoPanel
        isOpen={isDrawerOpen}
        entityInfo={nav.selectedEntity}
        onClose={() => setIsDrawerOpen(false)}
      />
    </DefaultPage.Root>
  );
};

VisualizeDrilldown.displayName = 'VisualizeDrilldown';

export default VisualizeDrilldown;
