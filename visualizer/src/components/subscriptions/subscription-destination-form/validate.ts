/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

export const validateInput = (key: string) => {
  const hasKeyValue = Boolean(key);
  if (!hasKeyValue) {
    return JSON.stringify({ missing: true });
  }
  return undefined;
};
