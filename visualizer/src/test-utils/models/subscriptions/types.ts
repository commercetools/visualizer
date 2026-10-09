/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import type { Subscription } from '@commercetools/platform-sdk';
import type { TBuilder } from '@commercetools-test-data/core';

//Subscription
export type TSubscription = Subscription;
export type TSubscriptionBuilder = TBuilder<TSubscription>;
export type TCreateSubscriptionBuilder = () => TSubscriptionBuilder;
export type TSubscriptionGraphql = TSubscription & {
  __typename: 'CommercetoolsSubscription';
};
