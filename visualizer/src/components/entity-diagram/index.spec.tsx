/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { useEffect, type ReactElement } from 'react';
import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';
import {
  act,
  screen,
  waitFor,
  mapResourceAccessToAppliedPermissions,
  renderAppWithRedux,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { createApolloClient } from '@commercetools-frontend/application-shell';
import { NimbusProvider } from '@commercetools/nimbus';
import { cleanup } from '@testing-library/react';
import EntityDiagram from './index';
import { ChangeProvider, useChange } from './providers/changes';
import type { ChangeEvent } from './hooks/types';
import { entryPointUriPath, PERMISSIONS } from '../../constants';

jest.setTimeout(20000);

// React Flow measures with these; jsdom has neither.
class MockDOMMatrixReadOnly {
  m22: number;
  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([1-9.]+)\)/)?.[1];
    this.m22 = scale ? Number(scale) : 1;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).DOMMatrixReadOnly ??= MockDOMMatrixReadOnly;

const mockDispatch = jest.fn();
jest.mock('@commercetools-frontend/sdk', () => ({
  ...jest.requireActual('@commercetools-frontend/sdk'),
  useAsyncDispatch: () => mockDispatch,
}));

const mockServer = setupServer();
let mutations: Array<{ key: string; value: string }> = [];

afterEach(async () => {
  mockServer.resetHandlers();
  mockDispatch.mockReset();
  mutations = [];
  jest.useRealTimers();
  await cleanup();
});
beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
  mockServer.close();
});

const page = (results: unknown[]) => ({
  limit: 200,
  offset: 0,
  count: results.length,
  total: results.length,
  results,
});

const shoe = {
  id: 'pt-1',
  name: 'Shoe',
  key: 'shoe',
  attributes: [{ name: 'size' }, { name: 'color' }],
};
const orderExtra = {
  id: 't-1',
  name: 'Order extra',
  key: 'order-extra',
  fieldDefinitions: [{ name: 'note' }],
  resourceTypeIds: ['order'],
};
const brand = {
  __typename: 'CustomObject',
  id: 'co-1',
  container: 'mc-custom-object-schema',
  key: 'brand',
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastModifiedAt: '2024-01-01T00:00:00.000Z',
  value: {
    attributes: [
      { name: 'id', type: 'string', required: true, set: false },
      { name: 'title', type: 'string', required: false, set: false },
    ],
  },
};

const customObject = (key: string, value: unknown) => ({
  __typename: 'CustomObject',
  id: `id-${key}`,
  container: 'mc-link-data',
  key,
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastModifiedAt: '2024-01-01T00:00:00.000Z',
  value,
});

type Fixture = {
  schemas?: unknown[];
  productTypes?: unknown[];
  types?: unknown[];
  links?: unknown[] | null;
  locations?: unknown[] | null;
};

const arrange = ({
  schemas = [brand],
  productTypes = [shoe],
  types = [orderExtra],
  links = null,
  locations = null,
}: Fixture = {}) => {
  mockDispatch.mockImplementation(async (action) => {
    const uri: string = action.payload.uri;
    if (uri.includes('/product-types')) return page(productTypes);
    if (uri.includes('/types')) return page(types);
    throw new Error(`unexpected uri ${uri}`);
  });
  mockServer.use(
    graphql.query('GetCustomObjects', (_req, res, ctx) =>
      res(
        ctx.data({
          customObjects: {
            __typename: 'CustomObjectQueryResult',
            count: schemas.length,
            total: schemas.length,
            offset: 0,
            exists: schemas.length > 0,
            results: schemas,
          },
        })
      )
    ),
    graphql.query('GetCustomObject', (req, res, ctx) => {
      const { key } = req.variables;
      const list = key === 'linkDataList' ? links : locations;
      return res(
        ctx.data({
          customObject: list === null ? null : customObject(key, list),
        })
      );
    }),
    graphql.mutation('CreateOrUpdateCustomObject', (req, res, ctx) => {
      mutations.push(req.variables.draft);
      return res(
        ctx.data({
          createOrUpdateCustomObject: customObject(
            req.variables.draft.key,
            JSON.parse(req.variables.draft.value)
          ),
        })
      );
    })
  );
};

const render = (ui: ReactElement, permission = PERMISSIONS.Manage) =>
  renderAppWithRedux(
    <Route path={`/:projectKey/${entryPointUriPath}/entity-diagram`}>
      <NimbusProvider locale="en" loadFonts={false}>
        {ui}
      </NimbusProvider>
    </Route>,
    {
      route: `/my-project/${entryPointUriPath}/entity-diagram`,
      environment: { entryPointUriPath },
      apolloClient: createApolloClient(),
      project: {
        allAppliedPermissions: mapResourceAccessToAppliedPermissions([
          permission,
        ]),
      },
    } as Partial<TRenderAppWithReduxOptions>
  );

describe('Entity diagram page', () => {
  it('shows a spinner, then one node per entity', async () => {
    arrange();
    render(<EntityDiagram />);

    expect(screen.getByTestId('entity-diagram-loading')).toBeInTheDocument();
    expect(await screen.findByText('brand')).toBeInTheDocument();
    expect(screen.getByText('Shoe')).toBeInTheDocument();
    expect(screen.getByText('order-extra')).toBeInTheDocument();
    expect(screen.getByTestId('entity-diagram-canvas')).toBeInTheDocument();
    expect(screen.getByText('Entity Diagram')).toBeInTheDocument();
    expect(screen.getByText('size')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
    expect(
      screen.queryByTestId('entity-diagram-error')
    ).not.toBeInTheDocument();
  });

  it('renders on a first run without stored link and location objects', async () => {
    arrange({ links: null, locations: null });
    render(<EntityDiagram />);

    expect(await screen.findByText('Shoe')).toBeInTheDocument();
    expect(
      screen.queryByTestId('entity-diagram-error')
    ).not.toBeInTheDocument();
  });

  it('shows an error alert when the REST request fails', async () => {
    arrange();
    mockDispatch.mockReset();
    mockDispatch.mockRejectedValue(new Error('Forbidden'));
    render(<EntityDiagram />);

    expect(
      await screen.findByTestId('entity-diagram-error')
    ).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(
      screen.queryByTestId('entity-diagram-canvas')
    ).not.toBeInTheDocument();
  });

  it('shows the empty message when there are no entities', async () => {
    arrange({ schemas: [], productTypes: [], types: [] });
    render(<EntityDiagram />);

    expect(
      await screen.findByTestId('entity-diagram-empty')
    ).toBeInTheDocument();
  });

  it('shows the read-only alert to a user without Manage', async () => {
    arrange();
    render(<EntityDiagram />, PERMISSIONS.View);

    expect(
      await screen.findByTestId('entity-diagram-readonly')
    ).toBeInTheDocument();
  });

  it('does not show the read-only alert to a Manage user', async () => {
    arrange();
    render(<EntityDiagram />);

    await screen.findByText('Shoe');
    expect(
      screen.queryByTestId('entity-diagram-readonly')
    ).not.toBeInTheDocument();
  });

  it('ignores stored links to nodes that no longer exist', async () => {
    arrange({
      links: [{ key: 'orphan', from: 'Shoe', to: 'deleted-type', text: 'x' }],
    });
    render(<EntityDiagram />);

    expect(await screen.findByText('Shoe')).toBeInTheDocument();
  });
});

describe('persistence', () => {
  let changes: ReturnType<typeof useChange> | undefined;

  const Probe = () => {
    const value = useChange();
    useEffect(() => {
      changes = value;
    });
    return value.status === 'ready' ? <span>probe-ready</span> : null;
  };

  const move = (nodeKey: string, loc: string): ChangeEvent => ({
    type: 'nodePositionChanged',
    nodeKey,
    loc,
  });

  beforeEach(() => {
    changes = undefined;
  });

  it('sends no write for a view-only user', async () => {
    arrange();
    render(
      <ChangeProvider>
        <Probe />
      </ChangeProvider>,
      PERMISSIONS.View
    );
    await screen.findByText('probe-ready');

    jest.useFakeTimers();
    act(() => changes?.trackNodeChange(move('Shoe', '10 10')));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    jest.useRealTimers();

    expect(mutations).toHaveLength(0);
  });

  it('coalesces a burst of moves into one write after 1000 ms', async () => {
    arrange();
    render(
      <ChangeProvider>
        <Probe />
      </ChangeProvider>
    );
    await screen.findByText('probe-ready');

    jest.useFakeTimers();
    act(() => {
      changes?.trackNodeChange(move('Shoe', '10 10'));
      changes?.trackNodeChange(move('Shoe', '20 20'));
      changes?.trackNodeChange(move('Shoe', '30 30'));
    });
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    jest.useRealTimers();

    await waitFor(() => expect(mutations).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mutations).toHaveLength(1);
    expect(mutations[0].key).toBe('locationDataList');
    expect(JSON.parse(mutations[0].value)).toEqual([
      { key: 'Shoe', loc: '30 30' },
    ]);
  });

  it('flushes a pending write when unmounted before the debounce elapsed', async () => {
    arrange();
    const { unmount } = render(
      <ChangeProvider>
        <Probe />
      </ChangeProvider>
    );
    await screen.findByText('probe-ready');

    act(() => changes?.trackNodeChange(move('Shoe', '7 8')));
    expect(mutations).toHaveLength(0);
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(mutations).toHaveLength(1);
    expect(JSON.parse(mutations[0].value)).toEqual([
      { key: 'Shoe', loc: '7 8' },
    ]);
  });
});
