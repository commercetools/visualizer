/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useMemo, type FC } from 'react';
import { useIntl } from 'react-intl';
import { Box, Button, Icon, Stack, Text } from '@commercetools/nimbus';
import { ChevronRight, Home } from '@commercetools/nimbus-icons';
import messages from '../messages';
import { useEntityLabels } from '../hooks/use-entity-labels';
import type { BreadcrumbItem } from '../types';

interface BreadcrumbNavigationProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigateToLevel: (level: number) => void;
  onNavigateToRoot: () => void;
}

const MAX_VISIBLE = 3;

export const BreadcrumbNavigation: FC<BreadcrumbNavigationProps> = ({
  breadcrumbs,
  onNavigateToLevel,
  onNavigateToRoot,
}) => {
  const intl = useIntl();
  const { singular } = useEntityLabels();
  const collapsed = breadcrumbs.length > MAX_VISIBLE;
  const visible = useMemo(
    () => (collapsed ? breadcrumbs.slice(-MAX_VISIBLE) : breadcrumbs),
    [breadcrumbs, collapsed]
  );

  if (breadcrumbs.length === 0) {
    return null;
  }

  const separator = (
    <Icon as={ChevronRight} size="xs" aria-hidden="true" color="neutral.11" />
  );

  return (
    <Stack direction="column" gap="100" data-testid="drilldown-breadcrumbs">
      <Text fontSize="sm" color="neutral.11">
        {intl.formatMessage(messages.navigationPath)}
      </Text>
      <Box
        as="nav"
        aria-label={intl.formatMessage(messages.breadcrumbAriaLabel)}
      >
        <Stack
          as="ol"
          direction="row"
          gap="100"
          alignItems="center"
          flexWrap="wrap"
          listStyleType="none"
          margin="0"
          padding="0"
        >
          <Box as="li">
            <Button variant="ghost" size="xs" onPress={onNavigateToRoot}>
              <Icon as={Home} size="xs" />
              {intl.formatMessage(messages.rootBreadcrumb)}
            </Button>
          </Box>
          {collapsed && (
            <Box as="li" display="flex" alignItems="center" gap="100">
              {separator}
              <Text aria-hidden="true">...</Text>
            </Box>
          )}
          {visible.map((breadcrumb) => {
            const isLast =
              breadcrumb.level === breadcrumbs[breadcrumbs.length - 1].level;
            return (
              <Box
                as="li"
                key={`${breadcrumb.level}-${breadcrumb.entityId}`}
                display="flex"
                alignItems="center"
                gap="100"
              >
                {separator}
                <Button
                  variant="ghost"
                  size="xs"
                  colorPalette={isLast ? 'primary' : 'neutral'}
                  aria-current={isLast ? 'page' : undefined}
                  onPress={() =>
                    isLast ? undefined : onNavigateToLevel(breadcrumb.level)
                  }
                >
                  {`${breadcrumb.entityName} (${singular(
                    breadcrumb.entityType
                  )})`}
                </Button>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};
