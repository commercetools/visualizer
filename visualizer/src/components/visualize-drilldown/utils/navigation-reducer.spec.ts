import {
  initialNavigationState,
  navigationReducer,
  type NavigationAction,
  type NavigationState,
  type SelectedEntity,
} from './navigation-reducer';

const entity = (id: string): SelectedEntity => ({
  id,
  name: `Name ${id}`,
  entityType: 'store',
  data: { id, version: 1, createdAt: '', lastModifiedAt: '' },
});

const run = (actions: NavigationAction[], from = initialNavigationState) =>
  actions.reduce<NavigationState>(navigationReducer, from);

describe('navigationReducer', () => {
  it('selectType clears breadcrumbs, search, sort and selection', () => {
    const state = run([
      { type: 'selectType', entityType: 'business-unit' },
      { type: 'setSearch', search: 'x' },
      { type: 'setSort', field: 'key', direction: 'asc' },
      { type: 'drillInto', entity: entity('a') },
      { type: 'selectType', entityType: 'category' },
    ]);
    expect(state).toEqual({
      ...initialNavigationState,
      selectedType: 'category',
    });
  });

  it('drillInto appends a breadcrumb at level + 1 and clears search and sort', () => {
    const state = run([
      { type: 'selectType', entityType: 'business-unit' },
      { type: 'setSearch', search: 'x' },
      { type: 'setSort', field: 'key', direction: 'desc' },
      { type: 'drillInto', entity: entity('a') },
      { type: 'drillInto', entity: entity('b') },
    ]);
    expect(state.levelIndex).toBe(2);
    expect(state.breadcrumbs.map((b) => [b.entityId, b.level])).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
    expect(state.search).toBe('');
    expect(state.sort).toBeNull();
    expect(state.selectedEntity?.id).toBe('b');
  });

  it('goToLevel keeps only breadcrumbs up to that level', () => {
    const state = run([
      { type: 'selectType', entityType: 'business-unit' },
      { type: 'drillInto', entity: entity('a') },
      { type: 'drillInto', entity: entity('b') },
      { type: 'drillInto', entity: entity('c') },
      { type: 'goToLevel', level: 1 },
    ]);
    expect(state.levelIndex).toBe(1);
    expect(state.breadcrumbs.map((b) => b.entityId)).toEqual(['a']);
  });

  it('goToLevel(0) and goToRoot empty the trail', () => {
    const base = run([
      { type: 'selectType', entityType: 'business-unit' },
      { type: 'drillInto', entity: entity('a') },
    ]);
    [{ type: 'goToLevel', level: 0 }, { type: 'goToRoot' }].forEach(
      (action) => {
        const state = navigationReducer(base, action as NavigationAction);
        expect(state.breadcrumbs).toEqual([]);
        expect(state.levelIndex).toBe(0);
        expect(state.selectedType).toBe('business-unit');
      }
    );
  });

  it('setSort with none removes the sort', () => {
    const state = run([
      { type: 'setSort', field: 'key', direction: 'asc' },
      { type: 'setSort', field: 'key', direction: 'none' },
    ]);
    expect(state.sort).toBeNull();
  });

  it('toggleType / hideAll / showAll', () => {
    let state = run([{ type: 'toggleType', entityType: 'store' }]);
    expect(state.hiddenTypes).toEqual(['store']);
    state = navigationReducer(state, {
      type: 'toggleType',
      entityType: 'store',
    });
    expect(state.hiddenTypes).toEqual([]);
    state = navigationReducer(state, { type: 'hideAll' });
    expect(state.hiddenTypes).toContain('channel');
    state = navigationReducer(state, { type: 'showAll' });
    expect(state.hiddenTypes).toEqual([]);
  });
});
