/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import type { BaseEntity } from '../types';
import { extractName } from '../utils/extract-name';

/** Returns a function that resolves the display name of an entity. */
export const useEntityName = () => {
  const { locale } = useIntl();
  const { dataLocale, languages } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale,
    languages: context.project?.languages,
  }));

  return useCallback(
    (entity: Pick<BaseEntity, 'id' | 'key' | 'name'> | undefined) =>
      extractName(entity, {
        dataLocale,
        projectLanguages: languages,
        locale,
      }),
    [dataLocale, languages, locale]
  );
};
