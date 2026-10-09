/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import type {
  BaseEntity,
  DrilldownData,
  EntityType,
  PaginationInfo,
  QueryEntityType,
  RelationFailure,
  RelationshipQueryArgs,
} from '../types';
import { getErrorStatus } from '../utils/ct-rest';
import { getEndpoint, getExpand } from '../utils/endpoints';
import type { SortDirection } from '../utils/navigation-reducer';
import {
  ENTITY_NAME_FIELDS,
  QUERY_ENTITY_NAME_FIELDS,
  RELATIONSHIP_QUERIES,
} from '../utils/relationship-constants';
import { relationshipManager } from '../utils/relationship-utils';
import { buildSearchWhere } from '../utils/search';
import { MissingProjectError, useCtRest } from './use-ct-rest';

export const PAGE_SIZE = 20;
/** No type loads more than this many entities (treemap size bound). */
export const MAX_TILES = 200;

export interface SearchSort {
  search?: string;
  sort?: { field: string; direction: SortDirection } | null;
}

export interface DrilldownError {
  message: string;
  statusCode?: number;
  missingProject?: boolean;
  entityType?: EntityType | QueryEntityType;
  endpoint?: string;
}

interface ApiResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: Array<Record<string, any>>;
  total?: number;
  count?: number;
}

/** Maps a raw REST result to the shape used by the page. */
export const transformEntity = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>,
  entityType: EntityType | QueryEntityType
): BaseEntity => {
  const expand = getExpand(entityType);
  let entity = raw;
  let nameField = ENTITY_NAME_FIELDS[entityType as EntityType];
  if (expand && raw[expand]) {
    // Use the expanded object; keep the reference (id only) when it is missing.
    entity = raw[expand].obj ?? raw[expand];
    nameField = QUERY_ENTITY_NAME_FIELDS[entityType as QueryEntityType];
  }
  const productName = entity.masterData?.current?.name;
  const name = entity[nameField] ?? productName ?? entity.key ?? entity.id;
  return { ...entity, name } as BaseEntity;
};

export const useDrilldownFetcher = () => {
  const { get } = useCtRest();
  const dataLocale = useApplicationContext((context) => context.dataLocale);
  const [levels, setLevels] = useState<DrilldownData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DrilldownError | null>(null);
  const [failures, setFailures] = useState<RelationFailure[]>([]);

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const levelsRef = useRef<DrilldownData[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyLevels = useCallback(
    (update: (prev: DrilldownData[]) => DrilldownData[]) => {
      levelsRef.current = update(levelsRef.current);
      setLevels(levelsRef.current);
    },
    []
  );

  const startRequest = useCallback(() => {
    requestIdRef.current += 1;
    const id = requestIdRef.current;
    setLoading(true);
    setError(null);
    return id;
  }, []);

  // A response is applied only while its id is current and the page is mounted.
  const isCurrent = useCallback(
    (id: number) => isMountedRef.current && requestIdRef.current === id,
    []
  );

  const fetchPage = useCallback(
    async (
      entityType: EntityType | QueryEntityType,
      queryArgs: RelationshipQueryArgs | null,
      offset: number,
      loadedBefore: number,
      searchSort?: SearchSort
    ): Promise<{
      entities: BaseEntity[];
      pagination: PaginationInfo;
      endpoint: string;
    }> => {
      const endpoint = getEndpoint(entityType, queryArgs);
      const searchWhere = searchSort?.search
        ? buildSearchWhere(
            entityType as EntityType,
            searchSort.search,
            dataLocale
          )
        : null;
      const wheres = [queryArgs?.where, searchWhere].filter(Boolean);
      const where: string | undefined =
        wheres.length > 1
          ? wheres.map((w) => `(${w})`).join(' and ')
          : wheres[0] ?? undefined;
      const sort = searchSort?.sort
        ? `${searchSort.sort.field} ${searchSort.sort.direction}`
        : undefined;

      const response = await get<ApiResponse>(endpoint, {
        limit: String(PAGE_SIZE),
        offset: String(offset),
        where,
        sort,
        expand: getExpand(entityType),
      });

      const results = response?.results ?? [];
      const entities = results.map((raw) => transformEntity(raw, entityType));
      const total = response?.total ?? offset + results.length;
      const loaded = loadedBefore + entities.length;
      return {
        entities,
        endpoint,
        pagination: {
          offset,
          limit: PAGE_SIZE,
          total,
          hasMore: offset + PAGE_SIZE < total && loaded < MAX_TILES,
        },
      };
    },
    [get, dataLocale]
  );

  const toError = useCallback(
    (
      err: unknown,
      entityType: EntityType | QueryEntityType,
      endpoint?: string
    ): DrilldownError => {
      if (err instanceof MissingProjectError) {
        return { message: err.message, missingProject: true };
      }
      return {
        message: (err as Error)?.message || 'Request failed',
        statusCode: getErrorStatus(err),
        entityType,
        endpoint: endpoint ?? getEndpoint(entityType, { id: '' }),
      };
    },
    []
  );

  const fetchRoot = useCallback(
    async (entityType: EntityType, searchSort?: SearchSort) => {
      const id = startRequest();
      setFailures([]);
      try {
        const { entities, pagination } = await fetchPage(
          entityType,
          null,
          0,
          0,
          searchSort
        );
        if (!isCurrent(id)) {
          return;
        }
        applyLevels(() => [{ level: 0, entityType, entities, pagination }]);
      } catch (err) {
        if (!isCurrent(id)) {
          return;
        }
        applyLevels(() => []);
        setError(toError(err, entityType));
      } finally {
        if (isCurrent(id)) {
          setLoading(false);
        }
      }
    },
    [applyLevels, fetchPage, isCurrent, startRequest, toError]
  );

  const fetchRelated = useCallback(
    async (
      parentEntity: BaseEntity,
      parentEntityType: EntityType,
      level: number
    ) => {
      const id = startRequest();
      setFailures([]);
      const childTypes =
        relationshipManager.getChildrenForEntityType(parentEntityType);

      const outcomes = await Promise.all(
        childTypes.map(async (childType) => {
          const config =
            RELATIONSHIP_QUERIES[`${parentEntityType}->${childType}`];
          const queryArgs =
            config?.parentEntitySelectorToQueryArgs?.(parentEntity) ?? null;
          if (!config || !queryArgs) {
            return { data: null, failure: null };
          }
          try {
            const { entities, pagination } = await fetchPage(
              config.childEntity,
              queryArgs,
              0,
              0
            );
            if (entities.length === 0) {
              return { data: null, failure: null };
            }
            const data: DrilldownData = {
              level,
              entityType: config.childEntity,
              parentEntityId: parentEntity.id,
              parentEntityType,
              entities,
              pagination,
              ...(queryArgs.truncated ? { truncated: true } : {}),
            };
            return { data, failure: null };
          } catch (err) {
            const failure: RelationFailure = {
              entityType: config.childEntity,
              statusCode: getErrorStatus(err),
            };
            const missingProject = err instanceof MissingProjectError;
            return { data: null, failure, missingProject };
          }
        })
      );

      if (!isCurrent(id)) {
        return;
      }
      const newLevels = outcomes
        .map((o) => o.data)
        .filter((d): d is DrilldownData => d !== null);
      const newFailures = outcomes
        .map((o) => o.failure)
        .filter((f): f is RelationFailure => f !== null);
      applyLevels((prev) => [
        ...prev.filter((data) => data.level < level),
        ...newLevels,
      ]);
      setFailures(newFailures);
      if (outcomes.some((o) => 'missingProject' in o && o.missingProject)) {
        setError({ message: 'Missing project key', missingProject: true });
      }
      setLoading(false);
    },
    [applyLevels, fetchPage, isCurrent, startRequest]
  );

  const loadMore = useCallback(
    async (
      level: number,
      entityType: EntityType | QueryEntityType,
      searchSort?: SearchSort
    ) => {
      const current = levelsRef.current.find(
        (data) => data.level === level && data.entityType === entityType
      );
      if (!current) {
        return;
      }
      const id = startRequest();
      const nextOffset = current.pagination.offset + current.pagination.limit;
      try {
        let queryArgs: RelationshipQueryArgs | null = null;
        if (level > 0) {
          const parent = levelsRef.current
            .find((data) => data.level === level - 1)
            ?.entities.find((e) => e.id === current.parentEntityId);
          const relation =
            RELATIONSHIP_QUERIES[`${current.parentEntityType}->${entityType}`];
          queryArgs =
            parent && relation?.parentEntitySelectorToQueryArgs
              ? relation.parentEntitySelectorToQueryArgs(parent)
              : null;
          if (!queryArgs) {
            throw new Error('Could not rebuild the relationship query');
          }
        }
        const result = await fetchPage(
          entityType,
          queryArgs,
          nextOffset,
          current.entities.length,
          level === 0 ? searchSort : undefined
        );
        if (!isCurrent(id)) {
          return;
        }
        applyLevels((prev) =>
          prev.map((data) => {
            if (data.level !== level || data.entityType !== entityType) {
              return data;
            }
            const known = new Set(data.entities.map((e) => e.id));
            return {
              ...data,
              entities: [
                ...data.entities,
                ...result.entities.filter((e) => !known.has(e.id)),
              ],
              pagination: result.pagination,
            };
          })
        );
      } catch (err) {
        if (isCurrent(id)) {
          setError(toError(err, entityType));
        }
      } finally {
        if (isCurrent(id)) {
          setLoading(false);
        }
      }
    },
    [applyLevels, fetchPage, isCurrent, startRequest, toError]
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    applyLevels(() => []);
    setError(null);
    setFailures([]);
    setLoading(false);
  }, [applyLevels]);

  return {
    levels,
    loading,
    error,
    failures,
    fetchRoot,
    fetchRelated,
    loadMore,
    reset,
  };
};
