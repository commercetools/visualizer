import type { FC } from 'react';
import { useIntl } from 'react-intl';
import { Button, Heading, Stack, Text } from '@commercetools/nimbus';
import messages from '../messages';
import { useEntityLabels } from '../hooks/use-entity-labels';
import type { EntityType } from '../types';
import { relationshipManager } from '../utils/relationship-utils';

interface EntitySelectorProps {
  selectedEntityType: EntityType | null;
  onEntityTypeSelect: (entityType: EntityType) => void;
  loading?: boolean;
}

export const EntitySelector: FC<EntitySelectorProps> = ({
  selectedEntityType,
  onEntityTypeSelect,
  loading = false,
}) => {
  const intl = useIntl();
  const { plural } = useEntityLabels();
  const rootEntityTypes = relationshipManager.getRootEntityTypes();

  return (
    <Stack direction="column" gap="200">
      <Heading as="h2" size="md">
        {intl.formatMessage(messages.selectEntityTypeTitle)}
      </Heading>
      <Text>{intl.formatMessage(messages.selectEntityTypeDescription)}</Text>
      <Stack direction="row" gap="200" flexWrap="wrap">
        {rootEntityTypes.map((entityType) => {
          const isSelected = selectedEntityType === entityType;
          return (
            <Button
              key={entityType}
              variant={isSelected ? 'solid' : 'outline'}
              colorPalette="primary"
              aria-pressed={isSelected}
              isDisabled={loading}
              onPress={() => onEntityTypeSelect(entityType)}
              data-testid={`drilldown-entity-type-${entityType}`}
            >
              {plural(entityType)}
            </Button>
          );
        })}
      </Stack>
    </Stack>
  );
};
