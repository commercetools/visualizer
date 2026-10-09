/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { Builder } from '@commercetools-test-data/core';
import generator from './generator';
import transformers from './transformers';
import type { TCreateSubscriptionBuilder, TSubscription } from './types';

const Model: TCreateSubscriptionBuilder = () =>
  Builder<TSubscription>({
    generator,
    transformers,
  });

export default Model;
