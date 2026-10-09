/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Measures the width of the element behind `ref`. Falls back to
 * `defaultWidth` until measured (jsdom never measures). Updates are throttled
 * with `requestAnimationFrame` and ignore changes smaller than 2 px.
 */
export const useContainerWidth = (defaultWidth = 800) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (!next) {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setWidth((current) => (Math.abs(current - next) < 2 ? current : next));
      });
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return { ref, width };
};
