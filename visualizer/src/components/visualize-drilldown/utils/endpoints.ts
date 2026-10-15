import type { EntityType, QueryEntityType } from '../types';
import {
  ENDPOINTS_WITH_EXPAND,
  ENTITY_ENDPOINTS,
  QUERY_ENTITY_ENDPOINTS,
} from './relationship-constants';

/** Resolves the REST endpoint (e.g. `/stores`) of an entity or query type. */
export const getEndpoint = (
  entityType: EntityType | QueryEntityType,
  queryArgs?: { id?: string } | null
): string => {
  if (entityType in ENTITY_ENDPOINTS) {
    return ENTITY_ENDPOINTS[entityType as EntityType];
  }
  const endpoint = QUERY_ENTITY_ENDPOINTS[entityType as QueryEntityType];
  if (!endpoint) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return endpoint.replace('{id}', encodeURIComponent(queryArgs?.id || ''));
};

/** `expand` parameter of sub-resource endpoints (undefined for others). */
export const getExpand = (
  entityType: EntityType | QueryEntityType
): string | undefined => ENDPOINTS_WITH_EXPAND[entityType as QueryEntityType];
