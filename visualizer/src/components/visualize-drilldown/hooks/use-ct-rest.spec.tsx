/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { waitFor } from '@testing-library/react';
import { PROXY_BASE } from '../../../test-utils/models/drilldown';
import { renderDrilldown } from '../test-utils';
import { useCtRest } from './use-ct-rest';

const mockServer = setupServer();
const seen: URL[] = [];
beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  mockServer.resetHandlers();
  seen.length = 0;
});
afterAll(() => mockServer.close());

const Probe = ({ onReady }: { onReady: (get: unknown) => void }) => {
  const { get } = useCtRest();
  onReady(get);
  return null;
};

const getter = async () => {
  let current: ReturnType<typeof useCtRest>['get'] | undefined;
  renderDrilldown(
    <Probe
      onReady={(get) => {
        current = get as typeof current;
      }}
    />
  );
  await waitFor(() => expect(current).toBeDefined());
  return current!;
};

describe('useCtRest', () => {
  it('sends a GET to the MC proxy of the project with an encoded query', async () => {
    mockServer.use(
      rest.get(`${PROXY_BASE}/stores`, (req, res, ctx) => {
        seen.push(req.url);
        return res(ctx.json({ results: [], total: 0 }));
      })
    );
    const get = await getter();
    await expect(
      get('/stores', { limit: '20', where: 'key in ("a b")' })
    ).resolves.toEqual({ results: [], total: 0 });
    expect(seen[0].pathname).toMatch(/\/proxy\/ctp\/[^/]+\/stores$/);
    expect(seen[0].search).toBe('?limit=20&where=key%20in%20(%22a%20b%22)');
  });

  it('rejects with the HTTP status on 403', async () => {
    mockServer.use(
      rest.get(`${PROXY_BASE}/stores`, (_req, res, ctx) =>
        res(ctx.status(403), ctx.json({ statusCode: 403, message: 'no' }))
      )
    );
    const get = await getter();
    await expect(get('/stores')).rejects.toMatchObject({ statusCode: 403 });
  });
});
