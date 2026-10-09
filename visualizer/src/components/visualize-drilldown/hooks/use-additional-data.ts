import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import type { BaseEntity, EntityType, SummaryLine } from '../types';
import { runWithConcurrency } from '../utils/concurrency';
import {
  buildSummaryRequest,
  ENTITY_SUMMARIES,
} from '../utils/entity-summaries';
import { useCtRest } from './use-ct-rest';

export const SUMMARY_CONCURRENCY = 4;

export interface SummaryItem {
  entityType: EntityType;
  entity: BaseEntity;
}

interface ApiResponse {
  total?: number;
}

/**
 * Extra lines per tile ("has 3 stores"). Counts already present in the entity
 * are computed locally; the others are requested with `limit=1` through a
 * queue of at most 4 requests, once per entity and level, and merged into a
 * cache. Results of an abandoned level are ignored. A failing request only
 * omits its own line.
 */
export const useAdditionalData = (levelKey: string, items: SummaryItem[]) => {
  const { get } = useCtRest();
  const { locale } = useIntl();
  const [remote, setRemote] = useState<Map<string, SummaryLine | null>>(
    new Map()
  );
  const [pending, setPending] = useState(0);
  const generationRef = useRef(0);
  const requestedRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // New level: forget everything and ignore results still in flight.
  useEffect(() => {
    generationRef.current += 1;
    requestedRef.current = new Set();
    setRemote(new Map());
    setPending(0);
  }, [levelKey]);

  useEffect(() => {
    const generation = generationRef.current;
    const tasks: Array<() => Promise<SummaryLine | null>> = [];
    const taskKeys: string[] = [];

    items.forEach(({ entityType, entity }) => {
      (ENTITY_SUMMARIES[entityType] ?? []).forEach((definition) => {
        if (!definition.relation || !definition.fromTotal) {
          return;
        }
        const key = `${entity.id}|${definition.key}`;
        if (requestedRef.current.has(key)) {
          return;
        }
        requestedRef.current.add(key);
        const request = buildSummaryRequest(definition.relation, entity);
        if (!request) {
          return;
        }
        taskKeys.push(key);
        tasks.push(async () => {
          const response = await get<ApiResponse>(
            request.endpoint,
            request.params
          );
          return definition.fromTotal!(response?.total ?? 0);
        });
      });
    });

    if (tasks.length === 0) {
      return;
    }
    const isCancelled = () =>
      !isMountedRef.current || generationRef.current !== generation;
    setPending((count) => count + tasks.length);
    const done = (count: number) => {
      if (!isCancelled()) {
        setPending((value) => Math.max(0, value - count));
      }
    };
    // Settled tasks (also failed ones) leave the pending count.
    const wrapped = tasks.map((task) => async () => {
      try {
        return await task();
      } finally {
        done(1);
      }
    });
    runWithConcurrency(wrapped, SUMMARY_CONCURRENCY, isCancelled, (i, line) => {
      setRemote((prev) => new Map(prev).set(taskKeys[i], line));
    });
  }, [items, get]);

  const summaries = useMemo(() => {
    const map = new Map<string, SummaryLine[]>();
    items.forEach(({ entityType, entity }) => {
      const lines: SummaryLine[] = [];
      (ENTITY_SUMMARIES[entityType] ?? []).forEach((definition) => {
        const line = definition.local
          ? definition.local(entity, { locale })
          : remote.get(`${entity.id}|${definition.key}`);
        if (line) {
          lines.push(line);
        }
      });
      if (lines.length > 0) {
        map.set(entity.id, lines);
      }
    });
    return map;
  }, [items, remote, locale]);

  return { summaries, loading: pending > 0 };
};
