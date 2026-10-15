import { runWithConcurrency } from './concurrency';

const makeTasks = (n: number, state: { running: number; max: number }) =>
  Array.from({ length: n }, (_, i) => async () => {
    state.running += 1;
    state.max = Math.max(state.max, state.running);
    await new Promise((resolve) => setTimeout(resolve, 10));
    state.running -= 1;
    return i;
  });

describe('runWithConcurrency', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('never runs more than the limit at once and delivers all results', async () => {
    const state = { running: 0, max: 0 };
    const results: number[] = [];
    const promise = runWithConcurrency(
      makeTasks(10, state),
      4,
      () => false,
      (_i, value) => results.push(value)
    );
    await jest.runAllTimersAsync();
    await promise;
    expect(state.max).toBe(4);
    expect(results.sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('starts no new task once cancelled and drops late results', async () => {
    const state = { running: 0, max: 0 };
    let cancelled = false;
    const results: number[] = [];
    const promise = runWithConcurrency(
      makeTasks(10, state),
      2,
      () => cancelled,
      (_i, value) => results.push(value)
    );
    cancelled = true;
    await jest.runAllTimersAsync();
    await promise;
    expect(results).toEqual([]);
    expect(state.running).toBe(0);
  });

  it('continues after a rejecting task', async () => {
    const results: number[] = [];
    const tasks = [
      () => Promise.reject(new Error('boom')),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ];
    await runWithConcurrency(
      tasks,
      1,
      () => false,
      (_i, value) => results.push(value)
    );
    expect(results).toEqual([2, 3]);
  });
});
