export type EntityType =
  | 'business-unit'
  | 'associate'
  | 'customer'
  | 'store'
  | 'channel'
  | 'product'
  | 'cart-discount'
  | 'product-selection'
  | 'standalone-price'
  | 'customer-group'
  | 'category';

export type QueryEntityType =
  | 'query-product-selections'
  | 'query-products-in-product-selection';
export interface EntityRelationship {
  root: EntityType;
  children: EntityType[];
}

export interface Money {
  currencyCode: string;
  centAmount: number;
  fractionDigits?: number;
}

export interface BaseEntity {
  id: string;
  // A plain string, a LocalizedString map, or a Money value (standalone prices).
  name?: string | Record<string, string> | Money;
  key?: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface TreemapNode {
  id: string;
  name: string;
  value: number;
  entityType: EntityType;
  entity: BaseEntity;
  children?: TreemapNode[];
  // Set on "load more" tiles: the (level, entity type) they load.
  loadMore?: { level: number; entityType: EntityType | QueryEntityType };
}

/** Why one relation could not be loaded (HTTP status when known). */
export interface RelationFailure {
  entityType: EntityType | QueryEntityType;
  statusCode?: number;
}

/** Message descriptor produced by entity-summaries; formatted by the UI. */
export interface SummaryLine {
  id: string;
  values: Record<string, string | number>;
}

export interface BreadcrumbItem {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  level: number;
}

export interface DrilldownState {
  currentLevel: number;
  currentEntityType: EntityType;
  currentEntityId?: string;
  breadcrumbs: BreadcrumbItem[];
  isAtRoot: boolean;
}

export interface EntityInfo {
  id: string;
  name: string;
  entityType: EntityType;
  data: BaseEntity;
}

export interface PaginationInfo {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface DrilldownData {
  level: number;
  entityType: EntityType | QueryEntityType;
  parentEntityId?: string;
  parentEntityType?: EntityType;
  entities: BaseEntity[];
  pagination: PaginationInfo;
  // True when a relation id list was capped (see where-predicate `inList`).
  truncated?: boolean;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface SearchAndSortState {
  searchQuery: string;
  sortStates: Record<string, SortDirection>; // field -> direction mapping
}

/** Query arguments produced for one relationship request. */
export interface RelationshipQueryArgs {
  where?: string;
  /** Id of the parent for sub-resource endpoints (`/products/{id}/...`). */
  id?: string;
  /** True when an id list was capped at 100 entries. */
  truncated?: boolean;
}

export interface RelationshipQuery {
  childEntity: EntityType | QueryEntityType;
  /** Returns `null` when there is nothing to request (no ids, no key, ...). */
  parentEntitySelectorToQueryArgs?: (
    parentEntity: BaseEntity
  ) => RelationshipQueryArgs | null;
}
