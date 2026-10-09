import { useEffect, useState, type FC } from 'react';
import { useIntl } from 'react-intl';
import { SearchInput, Stack, Text, ToggleButton } from '@commercetools/nimbus';
import messages from '../messages';
import { useEntityLabels } from '../hooks/use-entity-labels';
import type { EntityType } from '../types';
import type {
  NavigationState,
  SortDirection,
} from '../utils/navigation-reducer';
import { hasSearch, SEARCH_FIELD_KEYS, SORTABLE_FIELDS } from '../utils/search';

interface SearchAndSortControlsProps {
  entityType: EntityType;
  search: string;
  sort: NavigationState['sort'];
  onSearchChange: (search: string) => void;
  onSortChange: (field: string, direction: SortDirection) => void;
  onClearSearch: () => void;
}

const nextDirection = (current: SortDirection): SortDirection => {
  switch (current) {
    case 'none':
      return 'asc';
    case 'asc':
      return 'desc';
    default:
      return 'none';
  }
};

export const SearchAndSortControls: FC<SearchAndSortControlsProps> = ({
  entityType,
  search,
  sort,
  onSearchChange,
  onSortChange,
  onClearSearch,
}) => {
  const intl = useIntl();
  const { field: fieldLabel, plural } = useEntityLabels();
  // Typing only changes the draft; a request is sent on submit (Enter).
  const [draft, setDraft] = useState(search);
  useEffect(() => setDraft(search), [search]);

  const searchable = hasSearch(entityType);
  const sortableFields = SORTABLE_FIELDS[entityType] ?? [];
  if (!searchable && sortableFields.length === 0) {
    return null;
  }

  const searchField = fieldLabel(SEARCH_FIELD_KEYS[entityType]);

  return (
    <Stack
      direction="row"
      gap="400"
      flexWrap="wrap"
      justifyContent="space-between"
    >
      {searchable && (
        <Stack direction="column" gap="100">
          <Text fontWeight="medium">
            {intl.formatMessage(messages.searchTitle)}
          </Text>
          <SearchInput
            value={draft}
            onChange={setDraft}
            onSubmit={(value) => onSearchChange(value)}
            onClear={onClearSearch}
            placeholder={intl.formatMessage(messages.searchPlaceholder, {
              field: searchField,
            })}
            aria-label={intl.formatMessage(messages.searchAria, {
              entityType: plural(entityType),
              field: searchField,
            })}
            data-testid="drilldown-search"
          />
        </Stack>
      )}

      {sortableFields.length > 0 && (
        <Stack direction="column" gap="100" alignItems="flex-end">
          <Text fontWeight="medium">
            {intl.formatMessage(messages.sortByTitle)}
          </Text>
          <Stack direction="row" gap="100" flexWrap="wrap">
            {sortableFields.map((field) => {
              const direction: SortDirection =
                sort?.field === field ? sort.direction : 'none';
              const arrow =
                direction === 'asc' ? ' ↑' : direction === 'desc' ? ' ↓' : '';
              const label = fieldLabel(field);
              return (
                <ToggleButton
                  key={field}
                  size="xs"
                  isSelected={direction !== 'none'}
                  onChange={() => onSortChange(field, nextDirection(direction))}
                  aria-label={intl.formatMessage(messages.sortAria, {
                    field: label,
                    direction,
                  })}
                  data-testid={`drilldown-sort-${field}`}
                >
                  {`${label}${arrow}`}
                </ToggleButton>
              );
            })}
          </Stack>
          {sort && (
            <Text fontSize="sm" color="neutral.11">
              {intl.formatMessage(messages.currentlySortingBy, {
                field: fieldLabel(sort.field),
              })}
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  );
};
