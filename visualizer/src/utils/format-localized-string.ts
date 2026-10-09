/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import {
  formatLocalizedString as l10nFormatLocalizedString,
  transformLocalizedFieldToLocalizedString,
} from '@commercetools-frontend/l10n';
import { LocalizedField } from '@commercetools-frontend/l10n/dist/declarations/src/types';
import { NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';

export const formatLocalizedString = (
  localizedField: Array<LocalizedField> | undefined | null,
  dataLocale: string,
  projectLanguages: Array<string>,
  fallback = NO_VALUE_FALLBACK
) => {
  return l10nFormatLocalizedString(
    {
      name: transformLocalizedFieldToLocalizedString(localizedField ?? []),
    },
    {
      key: 'name',
      locale: dataLocale,
      fallbackOrder: projectLanguages,
      fallback: fallback,
    }
  );
};
