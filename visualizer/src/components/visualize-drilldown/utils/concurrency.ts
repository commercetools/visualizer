/**
 * Runs `tasks` with at most `limit` in flight. `onResult(index, value)` is
 * called for each fulfilled task; a rejected task is skipped (the others keep
 * running). When `isCancelled()` turns true no further task is started and
 * results of running tasks are dropped.
 */
export const runWithConcurrency = async <T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  isCancelled: () => boolean,
  onResult: (index: number, value: T) => void
): Promise<void> => {
  let next = 0;
  const worker = async () => {
    while (!isCancelled()) {
      const index = next;
      next += 1;
      if (index >= tasks.length) {
        return;
      }
      try {
        const value = await tasks[index]();
        if (!isCancelled()) {
          onResult(index, value);
        }
      } catch {
        // a failing task only omits its own result
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
};
