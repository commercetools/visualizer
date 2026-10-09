/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { ApolloError } from '@apollo/client';
import { useIntl } from 'react-intl';
import {
  Alert,
  DefaultPage,
  Flex,
  LoadingSpinner,
  Stack,
  Text,
} from '@commercetools/nimbus';
import { getErrorMessage } from '../../hooks';
import Canvas from './canvas';
import messages from './messages';
import { ChangeProvider, useChange } from './providers/changes';

const describeError = (error: unknown) =>
  error instanceof ApolloError
    ? getErrorMessage(error)
    : (error as { message?: string })?.message ?? String(error);

const Gate = () => {
  const intl = useIntl();
  const { status, error, nodeData, canManage } = useChange();

  if (status === 'loading') {
    return (
      <Flex justifyContent="center" padding="600">
        <LoadingSpinner
          data-testid="entity-diagram-loading"
          aria-label={intl.formatMessage(messages.loading)}
        />
      </Flex>
    );
  }

  if (status === 'error') {
    return (
      <Alert.Root colorPalette="critical" data-testid="entity-diagram-error">
        <Alert.Title>{intl.formatMessage(messages.loadError)}</Alert.Title>
        <Alert.Description>{describeError(error)}</Alert.Description>
      </Alert.Root>
    );
  }

  if (nodeData.length === 0) {
    return (
      <Text data-testid="entity-diagram-empty">
        {intl.formatMessage(messages.empty)}
      </Text>
    );
  }

  return (
    <Stack direction="column" gap="400">
      {!canManage && (
        <Alert.Root colorPalette="info" data-testid="entity-diagram-readonly">
          <Alert.Description>
            {intl.formatMessage(messages.readOnly)}
          </Alert.Description>
        </Alert.Root>
      )}
      <Canvas />
    </Stack>
  );
};

const EntityDiagram = () => {
  const intl = useIntl();
  return (
    <DefaultPage.Root>
      <DefaultPage.Header>
        <DefaultPage.Title>
          {intl.formatMessage(messages.title)}
        </DefaultPage.Title>
      </DefaultPage.Header>
      <DefaultPage.Content>
        <ChangeProvider>
          <Gate />
        </ChangeProvider>
      </DefaultPage.Content>
    </DefaultPage.Root>
  );
};

export default EntityDiagram;
