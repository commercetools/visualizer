/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import type { FC } from 'react';
import { useIntl } from 'react-intl';
import { Box, Button, Stack, Text, ToggleButton } from '@commercetools/nimbus';
import messages from '../messages';
import type { EntityType } from '../types';

export interface LegendItem {
  entityType: EntityType;
  label: string;
  count: number;
  total?: number;
  color: string;
}

interface InteractiveLegendProps {
  legend: LegendItem[];
  hiddenTypes: EntityType[];
  onToggleEntityType: (entityType: EntityType) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export const InteractiveLegend: FC<InteractiveLegendProps> = ({
  legend,
  hiddenTypes,
  onToggleEntityType,
  onShowAll,
  onHideAll,
}) => {
  const intl = useIntl();
  if (legend.length === 0) {
    return null;
  }
  const allHidden = legend.every((item) =>
    hiddenTypes.includes(item.entityType)
  );

  return (
    <Stack
      direction="row"
      gap="200"
      alignItems="center"
      flexWrap="wrap"
      data-testid="drilldown-legend"
    >
      <Text fontSize="sm" color="neutral.11">
        {intl.formatMessage(messages.legend)}
      </Text>
      <Button
        variant="ghost"
        size="xs"
        colorPalette="primary"
        onPress={allHidden ? onShowAll : onHideAll}
      >
        {intl.formatMessage(allHidden ? messages.showAll : messages.hideAll)}
      </Button>
      {legend.map(({ entityType, label, count, total, color }) => {
        const isVisible = !hiddenTypes.includes(entityType);
        const text =
          total && total > count
            ? intl.formatMessage(messages.legendCountOfTotal, {
                label,
                count,
                total,
              })
            : intl.formatMessage(messages.legendCount, { label, count });
        return (
          <ToggleButton
            key={entityType}
            size="xs"
            isSelected={isVisible}
            onChange={() => onToggleEntityType(entityType)}
            data-testid={`drilldown-legend-${entityType}`}
          >
            <Box
              as="span"
              display="inline-block"
              width="12px"
              height="12px"
              borderRadius="100"
              marginRight="100"
              style={{ backgroundColor: isVisible ? color : '#ccc' }}
              aria-hidden="true"
            />
            {text}
          </ToggleButton>
        );
      })}
    </Stack>
  );
};
