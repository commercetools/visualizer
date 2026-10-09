/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { lazy } from 'react';

const Welcome = lazy(
  () => import('./welcome' /* webpackChunkName: "welcome" */)
);

export default Welcome;
