/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useLayoutEffect, useRef, useState } from 'react';

// The canvas fills the viewport below its own top offset. Measured once at
// layout time and kept in sync on window resize.
const DEFAULT_HEIGHT = 400;
const MIN_HEIGHT = 200;

export const useAvailableHeight = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const { top } = containerRef.current.getBoundingClientRect();
        setHeight(Math.max(window.innerHeight - top, MIN_HEIGHT));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return { containerRef, height };
};
