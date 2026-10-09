import type { BaseEntity, BreadcrumbItem, EntityType } from '../types';
import { ALL_ENTITY_TYPES } from './relationship-constants';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SelectedEntity {
  id: string;
  name: string;
  entityType: EntityType;
  data: BaseEntity;
}

export interface NavigationState {
  selectedType: EntityType | null;
  levelIndex: number;
  breadcrumbs: BreadcrumbItem[];
  search: string;
  sort: { field: string; direction: SortDirection } | null;
  selectedEntity: SelectedEntity | null;
  hiddenTypes: EntityType[];
}

export const initialNavigationState: NavigationState = {
  selectedType: null,
  levelIndex: 0,
  breadcrumbs: [],
  search: '',
  sort: null,
  selectedEntity: null,
  hiddenTypes: [],
};

export type NavigationAction =
  | { type: 'selectType'; entityType: EntityType }
  | { type: 'drillInto'; entity: SelectedEntity }
  | { type: 'selectEntity'; entity: SelectedEntity }
  | { type: 'goToLevel'; level: number }
  | { type: 'goToRoot' }
  | { type: 'setSearch'; search: string }
  | { type: 'setSort'; field: string; direction: SortDirection }
  | { type: 'toggleType'; entityType: EntityType }
  | { type: 'showAll' }
  | { type: 'hideAll' };

export const navigationReducer = (
  state: NavigationState,
  action: NavigationAction
): NavigationState => {
  switch (action.type) {
    case 'selectType':
      return {
        ...initialNavigationState,
        selectedType: action.entityType,
      };
    case 'selectEntity':
      return { ...state, selectedEntity: action.entity };
    case 'drillInto': {
      const level = state.levelIndex + 1;
      return {
        ...state,
        levelIndex: level,
        breadcrumbs: [
          ...state.breadcrumbs,
          {
            entityType: action.entity.entityType,
            entityId: action.entity.id,
            entityName: action.entity.name,
            level,
          },
        ],
        search: '',
        sort: null,
        selectedEntity: action.entity,
      };
    }
    case 'goToLevel': {
      if (action.level <= 0) {
        return navigationReducer(state, { type: 'goToRoot' });
      }
      const target = state.breadcrumbs.find((b) => b.level === action.level);
      if (!target) {
        return state;
      }
      return {
        ...state,
        levelIndex: action.level,
        breadcrumbs: state.breadcrumbs.filter((b) => b.level <= action.level),
        search: '',
        sort: null,
      };
    }
    case 'goToRoot':
      return {
        ...state,
        levelIndex: 0,
        breadcrumbs: [],
        search: '',
        sort: null,
        selectedEntity: null,
      };
    case 'setSearch':
      return { ...state, search: action.search };
    case 'setSort':
      return {
        ...state,
        sort:
          action.direction === 'none'
            ? null
            : { field: action.field, direction: action.direction },
      };
    case 'toggleType':
      return {
        ...state,
        hiddenTypes: state.hiddenTypes.includes(action.entityType)
          ? state.hiddenTypes.filter((t) => t !== action.entityType)
          : [...state.hiddenTypes, action.entityType],
      };
    case 'showAll':
      return { ...state, hiddenTypes: [] };
    case 'hideAll':
      return { ...state, hiddenTypes: [...ALL_ENTITY_TYPES] };
    default:
      return state;
  }
};
