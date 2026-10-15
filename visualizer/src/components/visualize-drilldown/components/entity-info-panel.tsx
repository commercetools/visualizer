import type { FC } from 'react';
import { useIntl } from 'react-intl';
import { NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';
import { Box, Drawer, Heading, Stack, Text } from '@commercetools/nimbus';
import messages from '../messages';
import { useEntityLabels } from '../hooks/use-entity-labels';
import type { EntityInfo } from '../types';

interface EntityInfoPanelProps {
  entityInfo: EntityInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

const Field: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Text fontSize="sm" color="neutral.11">
      {label}
    </Text>
    <Text>{value}</Text>
  </Box>
);

export const EntityInfoPanel: FC<EntityInfoPanelProps> = ({
  entityInfo,
  isOpen,
  onClose,
}) => {
  const intl = useIntl();
  const { singular } = useEntityLabels();

  if (!entityInfo) {
    return null;
  }

  const formatDate = (value?: string): string => {
    if (!value) {
      return NO_VALUE_FALLBACK;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? NO_VALUE_FALLBACK
      : intl.formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <Drawer.Root
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      placement="right"
      aria-label={intl.formatMessage(messages.entityInfoTitle)}
    >
      <Drawer.Content data-testid="drilldown-drawer">
        <Drawer.Header>
          <Drawer.Title>
            {intl.formatMessage(messages.entityInfoTitle)}
          </Drawer.Title>
          <Drawer.CloseTrigger />
        </Drawer.Header>
        <Drawer.Body>
          <Stack direction="column" gap="400">
            <Heading as="h3" size="md">
              {entityInfo.name}
            </Heading>
            <Stack direction="column" gap="200">
              <Field
                label={intl.formatMessage(messages.entityType)}
                value={singular(entityInfo.entityType)}
              />
              <Field
                label={intl.formatMessage(messages.entityId)}
                value={entityInfo.id}
              />
              {entityInfo.data.key && (
                <Field
                  label={intl.formatMessage(messages.entityKey)}
                  value={entityInfo.data.key}
                />
              )}
              <Field
                label={intl.formatMessage(messages.entityVersion)}
                value={String(entityInfo.data.version ?? NO_VALUE_FALLBACK)}
              />
              <Field
                label={intl.formatMessage(messages.entityCreatedAt)}
                value={formatDate(entityInfo.data.createdAt)}
              />
              <Field
                label={intl.formatMessage(messages.entityLastModified)}
                value={formatDate(entityInfo.data.lastModifiedAt)}
              />
            </Stack>
            <Box>
              <Text fontSize="sm" color="neutral.11">
                {intl.formatMessage(messages.rawData)}
              </Text>
              <Box
                as="pre"
                fontSize="sm"
                fontFamily="mono"
                maxHeight="400px"
                overflow="auto"
                bg="neutral.3"
                padding="300"
                borderRadius="200"
                margin="0"
              >
                {JSON.stringify(entityInfo.data, null, 2)}
              </Box>
            </Box>
          </Stack>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
};
