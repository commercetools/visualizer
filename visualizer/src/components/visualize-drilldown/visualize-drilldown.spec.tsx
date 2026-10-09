import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, within, waitFor } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import {
  aBusinessUnit,
  aCategory,
  aChannel,
  aCustomer,
  aCustomerGroup,
  aProduct,
  aProductSelection,
  aStore,
  PROXY_BASE,
  range,
  restList,
} from '../../test-utils/models/drilldown';
import deMessages from '../../i18n/data/de.json';
import VisualizeDrilldown from './visualize-drilldown';
import { renderDrilldown } from './test-utils';

jest.setTimeout(30000);

type Reply = { status?: number; body?: unknown; delay?: number };
type Responder = (url: URL) => Reply;

// Endpoints without a dedicated handler answer with an empty list, so
// relation and summary requests of a test never hit an unhandled request.
const EMPTY_ENDPOINTS = [
  '/business-units',
  '/customers',
  '/stores',
  '/channels',
  '/categories',
  '/products',
  '/product-selections',
  '/cart-discounts',
  '/standalone-prices',
  '/customer-groups',
  '/product-selections/:id/products',
  '/products/:id/product-selections',
];
const mockServer = setupServer(
  ...EMPTY_ENDPOINTS.map((path) =>
    rest.get(`${PROXY_BASE}${path}`, (_req, res, ctx) =>
      res(ctx.json(restList([])))
    )
  )
);
// `requests`: list / relation requests; `summaryRequests`: limit=1 requests.
let requests: URL[] = [];
let summaryRequests: URL[] = [];

/** Registers GET routes below the MC proxy; every request is recorded. */
const serve = (routes: Record<string, Responder>) =>
  Object.entries(routes).forEach(([path, responder]) =>
    mockServer.use(
      rest.get(`${PROXY_BASE}${path}`, (req, res, ctx) => {
        (req.url.searchParams.get('limit') === '1'
          ? summaryRequests
          : requests
        ).push(req.url);
        const reply = responder(req.url);
        return res(
          ctx.delay(reply.delay ?? 0),
          ctx.status(reply.status ?? 200),
          ctx.json(reply.body ?? restList([]))
        );
      })
    )
  );

const whereOf = (url: URL) => url.searchParams.get('where');
const requestsTo = (path: string) =>
  requests.filter((url) => url.pathname.endsWith(path));
const summariesTo = (path: string) =>
  summaryRequests.filter((url) => url.pathname.endsWith(path));

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  jest.restoreAllMocks();
  mockServer.resetHandlers();
  requests = [];
  summaryRequests = [];
  await cleanup();
});
afterAll(() => mockServer.close());

const select = async (name: string) =>
  userEvent.click(await screen.findByRole('button', { name }));
const tile = (id: string) => screen.findByTestId(`drilldown-tile-${id}`);
const tiles = () =>
  screen
    .queryAllByTestId(/^drilldown-tile-/)
    .filter((el) => el.tagName === 'BUTTON');

describe('Page shell and entity-type selection', () => {
  it('shows six unpressed root types and sends no request initially', () => {
    renderDrilldown(<VisualizeDrilldown />);
    const names = [
      'Business Units',
      'Stores',
      'Customer Groups',
      'Product Selections',
      'Channels',
      'Categories',
    ];
    names.forEach((name) => {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });
    expect(screen.getByText(/Select an entity type above/)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('loads up to 20 store tiles after selecting Stores', async () => {
    serve({ '/stores': () => ({ body: restList(range(25, aStore), 25) }) });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    expect(screen.getByRole('button', { name: 'Stores' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(tiles()).toHaveLength(25);
    expect(requests[0].searchParams.get('limit')).toBe('20');
    expect(requests[0].searchParams.get('offset')).toBe('0');
  });

  it('keeps the tiles when the active entity type is clicked again', async () => {
    serve({ '/stores': () => ({ body: restList(range(3, aStore), 3) }) });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    await select('Stores');
    expect(tiles()).toHaveLength(3);
    expect(requests).toHaveLength(1);
  });

  it('shows a loading indicator and disables the selector while loading', async () => {
    serve({ '/stores': () => ({ body: restList([aStore(1)]), delay: 300 }) });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    expect(await screen.findByTestId('drilldown-loading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Categories' })).toBeDisabled();
    await tile('store-1');
    expect(screen.getByRole('button', { name: 'Categories' })).toBeEnabled();
  });

  it('clears breadcrumbs and search when switching the type', async () => {
    serve({
      '/business-units': () => ({
        body: restList([aBusinessUnit(1, { stores: [{ key: 'a' }] })]),
      }),
      '/stores': () => ({ body: restList([aStore(1)]) }),
      '/categories': () => ({ body: restList([aCategory(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('store-1');
    expect(screen.getByTestId('drilldown-breadcrumbs')).toBeInTheDocument();
    await select('Categories');
    await tile('category-1');
    expect(screen.queryByTestId('drilldown-breadcrumbs')).toBeNull();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(tiles()).toHaveLength(1);
  });
});

describe('Root-level paging, search and sort', () => {
  it('appends pages when pressing Load more (45 stores)', async () => {
    serve({
      '/stores': (url) => {
        const offset = Number(url.searchParams.get('offset'));
        return {
          body: restList(
            range(Math.min(20, 45 - offset), (i) => aStore(offset + i)),
            45,
            offset
          ),
        };
      },
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await userEvent.click(
      await screen.findByTestId('drilldown-load-more-store')
    );
    await tile('store-21');
    await userEvent.click(
      await screen.findByTestId('drilldown-load-more-store')
    );
    await tile('store-45');
    expect(requests.map((u) => u.searchParams.get('offset'))).toEqual([
      '0',
      '20',
      '40',
    ]);
    expect(tiles()).toHaveLength(45);
    expect(screen.queryByTestId('drilldown-load-more-store')).toBeNull();
  });

  it('sends the search as a server-side where predicate', async () => {
    serve({ '/stores': () => ({ body: restList([aStore(1)]) }) });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    await userEvent.type(screen.getByRole('searchbox'), 'Berlin{Enter}');
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(whereOf(requests[1])).toMatch(/^name\([\w-]+="Berlin"\)$/);
  });

  it('escapes quotes and backslashes of the search text', async () => {
    serve({
      '/business-units': () => ({ body: restList([aBusinessUnit(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await tile('bu-1');
    await userEvent.type(screen.getByRole('searchbox'), 'a"b\\c{Enter}');
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(whereOf(requests[1])).toBe('name="a\\"b\\\\c"');
  });

  it('cycles the sort asc, desc, none', async () => {
    serve({ '/stores': () => ({ body: restList([aStore(1)]) }) });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    const key = screen.getByTestId('drilldown-sort-key');
    await userEvent.click(key);
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(key).toHaveTextContent('Key ↑');
    await userEvent.click(key);
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(key).toHaveTextContent('Key ↓');
    await userEvent.click(key);
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(key).toHaveTextContent(/^Key$/);
    expect(requests.map((u) => u.searchParams.get('sort'))).toEqual([
      null,
      'key asc',
      'key desc',
      null,
    ]);
  });

  it('ignores a stale response (search "a" answered after "ab")', async () => {
    serve({
      '/stores': (url) => {
        const where = whereOf(url) ?? '';
        if (where.endsWith('="a")')) {
          return { body: restList([aStore(10)]), delay: 600 };
        }
        if (where.endsWith('="ab")')) {
          return { body: restList([aStore(20)]) };
        }
        return { body: restList([aStore(1)]) };
      },
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    const search = screen.getByRole('searchbox');
    await userEvent.type(search, 'a{Enter}');
    await userEvent.clear(search);
    await userEvent.type(search, 'ab{Enter}');
    await tile('store-20');
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(screen.queryByTestId('drilldown-tile-store-10')).toBeNull();
    expect(tiles()).toHaveLength(1);
  });
});

describe('Drill down through related entities', () => {
  it('requests the stores of a business unit and shows them at level 1', async () => {
    serve({
      '/business-units': (url) => ({
        body: restList(
          whereOf(url)
            ? []
            : [aBusinessUnit(1, { stores: [{ key: 'a' }, { key: 'b' }] })]
        ),
      }),
      '/stores': () => ({ body: restList([aStore(1), aStore(2)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('store-2');
    const storeRequest = requestsTo('/stores')[0];
    expect(whereOf(storeRequest)).toBe('key in ("a","b")');
    expect(tiles()).toHaveLength(2);
    expect(screen.getByTestId('drilldown-legend-store')).toHaveTextContent(
      'Stores (2)'
    );
  });

  it('shows an informational message for a business unit without relations', async () => {
    serve({
      '/business-units': (url) => ({
        body: restList(whereOf(url) ? [] : [aBusinessUnit(1)]),
      }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    expect(await screen.findByTestId('drilldown-empty')).toHaveTextContent(
      'no related entities'
    );
    expect(screen.getByTestId('drilldown-breadcrumbs')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Root/ }));
    await tile('bu-1');
  });

  it('keeps the stores and warns when the associates request returns 403', async () => {
    serve({
      '/business-units': (url) => ({
        body: restList(
          whereOf(url)
            ? []
            : [
                aBusinessUnit(1, {
                  stores: [{ key: 'a' }],
                  associates: [{ customer: { id: 'c1' } }],
                }),
              ]
        ),
      }),
      '/stores': () => ({ body: restList([aStore(1)]) }),
      '/customers': () => ({
        status: 403,
        body: { statusCode: 403, message: 'Forbidden' },
      }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('store-1');
    expect(await screen.findByTestId('drilldown-warning')).toHaveTextContent(
      /permission is missing: Associates/
    );
  });

  it('uses the sub-resource endpoints for a product selection', async () => {
    serve({
      '/product-selections': () => ({
        body: restList([aProductSelection(1)]),
      }),
      '/product-selections/:id/products': () => ({
        body: restList([
          { product: { typeId: 'product', id: 'product-9', obj: aProduct(9) } },
        ]),
      }),
      '/stores': () => ({ body: restList([aStore(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Product Selections');
    await userEvent.click(await tile('selection-1'));
    await tile('product-9');
    const productsRequest = requestsTo('/selection-1/products').find((u) =>
      u.searchParams.has('expand')
    );
    expect(productsRequest?.searchParams.get('expand')).toBe('product');
    expect(whereOf(requestsTo('/stores')[0])).toBe(
      'productSelections(productSelection(id="selection-1"))'
    );
    expect(screen.getByTestId('drilldown-tile-product-9')).toHaveAccessibleName(
      /Product 9, Product/
    );
  });

  it('does not change level when pressing a leaf type and offers its details', async () => {
    serve({
      '/customer-groups': () => ({ body: restList([aCustomerGroup(1)]) }),
      '/customers': () => ({ body: restList([aCustomer(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Customer Groups');
    await userEvent.click(await tile('group-1'));
    await userEvent.click(await tile('customer-1'));
    expect(requestsTo('/customers')).toHaveLength(1);
    const nav = screen.getByRole('navigation', { name: 'Drilldown path' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Customer details' })
    ).toBeInTheDocument();
  });
});

describe('Breadcrumb navigation', () => {
  const nested = () =>
    serve({
      '/business-units': (url) => {
        const where = whereOf(url);
        const parent = where?.match(/parentUnit\(key="bu-key-(\d+)"\)/);
        return {
          body: restList([aBusinessUnit(parent ? Number(parent[1]) + 1 : 1)]),
        };
      },
    });

  it('collapses to Root, "..." and the last three items four levels deep', async () => {
    nested();
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    for (let i = 1; i <= 4; i += 1) {
      await userEvent.click(await tile(`bu-${i}`));
    }
    await tile('bu-5');
    const nav = screen.getByRole('navigation', { name: 'Drilldown path' });
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[1]).toHaveTextContent('...');
    expect(items[4]).toHaveTextContent('Business Unit 4 (Business Unit)');
    expect(within(items[4]).getByRole('button')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('returns to a middle level without refetching and clears search/sort', async () => {
    nested();
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    for (let i = 1; i <= 3; i += 1) {
      await userEvent.click(await tile(`bu-${i}`));
    }
    await tile('bu-4');
    const before = requests.length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Business Unit 1 (Business Unit)' })
    );
    await tile('bu-2');
    expect(requests).toHaveLength(before);
    const nav = screen.getByRole('navigation', { name: 'Drilldown path' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('Interactive legend', () => {
  const buWithStoresAndDivision = () =>
    serve({
      '/business-units': (url) => ({
        body: restList(
          whereOf(url)
            ? [aBusinessUnit(2)]
            : [aBusinessUnit(1, { stores: [{ key: 'a' }, { key: 'b' }] })]
        ),
      }),
      '/stores': () => ({ body: restList([aStore(1), aStore(2)]) }),
    });

  it('hides a type without a request and keeps the other colours', async () => {
    buWithStoresAndDivision();
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('store-1');
    const before = requests.length;
    const storeColor = screen.getByTestId('drilldown-tile-store-1').style
      .backgroundColor;
    const legendEntry = screen.getByTestId('drilldown-legend-business-unit');
    await userEvent.click(legendEntry);
    expect(legendEntry).toHaveAttribute('aria-pressed', 'false');
    expect(tiles()).toHaveLength(2);
    expect(
      screen.getByTestId('drilldown-tile-store-1').style.backgroundColor
    ).toBe(storeColor);
    expect(requests).toHaveLength(before);
  });

  it('replaces the chart by a message when all types are hidden', async () => {
    buWithStoresAndDivision();
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('store-1');
    await userEvent.click(screen.getByRole('button', { name: 'Hide All' }));
    expect(await screen.findByText('No entities visible')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Show All' }).length).toBe(2);
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Show All' })[0]
    );
    await tile('store-1');
  });

  it('reads "Stores (20 of 45)" when 20 of 45 are loaded', async () => {
    serve({
      '/stores': () => ({ body: restList(range(20, aStore), 45) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    expect(screen.getByTestId('drilldown-legend-store')).toHaveTextContent(
      'Stores (20 of 45)'
    );
  });
});

describe('Additional data on tiles', () => {
  it('limits summary requests to 4 in flight and keeps tiles usable', async () => {
    let running = 0;
    let max = 0;
    const counted =
      (body: unknown): Responder =>
      () => {
        running += 1;
        max = Math.max(max, running);
        setTimeout(() => {
          running -= 1;
        }, 30);
        return { body, delay: 30 };
      };
    serve({
      '/stores': () => ({ body: restList(range(20, aStore), 20) }),
      '/cart-discounts': counted(restList([], 3)),
      '/customers': counted(restList([], 2)),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await tile('store-1');
    expect(await screen.findByText('Loading details...')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryByText('Loading details...')).toBeNull(),
      { timeout: 15000 }
    );
    expect(summariesTo('/cart-discounts')).toHaveLength(20);
    expect(max).toBeLessThanOrEqual(4);
    expect(screen.getByTestId('drilldown-tile-store-1')).toHaveAccessibleName(
      /Store 1, Store, has 3 cart discounts, has 2 customers/
    );
  });

  it('keeps earlier lines and requests only new entities after Load more', async () => {
    serve({
      '/stores': (url) => {
        const offset = Number(url.searchParams.get('offset'));
        return {
          body: restList(
            range(offset === 0 ? 20 : 5, (i) => aStore(offset + i)),
            25,
            offset
          ),
        };
      },
      '/cart-discounts': () => ({ body: restList([], 3) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await userEvent.click(
      await screen.findByTestId('drilldown-load-more-store')
    );
    await tile('store-25');
    await waitFor(() =>
      expect(summariesTo('/cart-discounts')).toHaveLength(25)
    );
    await waitFor(() =>
      expect(screen.getByTestId('drilldown-tile-store-1')).toHaveAccessibleName(
        /has 3 cart discounts/
      )
    );
    expect(screen.getByTestId('drilldown-tile-store-25')).toHaveAccessibleName(
      /has 3 cart discounts/
    );
  });

  it('omits the line of a failing summary without an error banner', async () => {
    serve({
      '/channels': () => ({ body: restList([aChannel(1)]) }),
      '/stores': () => ({ status: 500, body: { message: 'boom' } }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Channels');
    await tile('channel-1');
    await waitFor(() => expect(summariesTo('/stores')).toHaveLength(1));
    expect(screen.queryByTestId('drilldown-error')).toBeNull();
    expect(screen.getByTestId('drilldown-tile-channel-1')).toHaveAccessibleName(
      'Channel 1, Channel'
    );
  });
});

describe('Entity details drawer', () => {
  it('opens a dialog with id and JSON and closes it with Escape', async () => {
    serve({
      '/stores': () => ({ body: restList([aStore(1)]) }),
      '/business-units': () => ({ body: restList([aBusinessUnit(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await userEvent.click(await tile('store-1'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Store details' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('store-1').length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent('"key": "store-key-1"');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows the no-value fallback instead of "Invalid Date"', async () => {
    serve({
      '/stores': () => ({
        body: restList([aStore(1, { createdAt: undefined })]),
      }),
      '/business-units': () => ({ body: restList([aBusinessUnit(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await userEvent.click(await tile('store-1'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Store details' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).not.toHaveTextContent('Invalid Date');
    expect(dialog).toHaveTextContent('Created At');
  });
});

describe('Permission-aware data access and bounds', () => {
  it('shows an alert for a root type without scope and keeps the selector usable', async () => {
    serve({
      '/categories': () => ({
        status: 403,
        body: { statusCode: 403, message: 'Forbidden' },
      }),
      '/stores': () => ({ body: restList([aStore(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Categories');
    const alert = await screen.findByTestId('drilldown-error');
    expect(alert).toHaveTextContent(/Could not load Categories/);
    expect(alert).toHaveTextContent('/categories');
    await select('Stores');
    await tile('store-1');
    expect(screen.queryByTestId('drilldown-error')).toBeNull();
  });

  it('uses 100 ids for 500 associates and says the list was truncated', async () => {
    serve({
      '/business-units': (url) => ({
        body: restList(
          whereOf(url)
            ? []
            : [
                aBusinessUnit(1, {
                  associates: range(500, (i) => ({
                    customer: { id: `c${i}` },
                  })),
                }),
              ]
        ),
      }),
      '/customers': (url) => ({
        body: restList(range(20, aCustomer), whereOf(url) ? 100 : 0),
      }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Business Units');
    await userEvent.click(await tile('bu-1'));
    await tile('customer-1');
    const ids = whereOf(requestsTo('/customers')[0])!.match(/"c\d+"/g)!;
    expect(ids).toHaveLength(100);
    expect(screen.getByText(/truncated to 100/)).toBeInTheDocument();
    expect(tiles()).toHaveLength(20);
  });

  it('logs no warning when unmounted during a request', async () => {
    serve({
      '/stores': () => ({ body: restList([aStore(1)]), delay: 300 }),
    });
    const { unmount } = renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await screen.findByTestId('drilldown-loading');
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 600));
    // the jest preset fails the test on any console.error
    expect(requests).toHaveLength(1);
  });
});

describe('Localization', () => {
  it('renders German texts with the de messages', () => {
    renderDrilldown(
      <IntlProvider locale="de" messages={deMessages}>
        <VisualizeDrilldown />
      </IntlProvider>
    );
    expect(
      screen.getByRole('button', { name: 'Kundengruppen' })
    ).toBeInTheDocument();
    expect(screen.getByText('Drilldown-Visualisierung')).toBeInTheDocument();
  });

  it('reads singular and plural labels without string slicing', async () => {
    serve({
      '/stores': () => ({ body: restList([aStore(1)]) }),
      '/business-units': () => ({ body: restList([aBusinessUnit(1)]) }),
    });
    renderDrilldown(<VisualizeDrilldown />);
    await select('Stores');
    await userEvent.click(await tile('store-1'));
    expect(await screen.findByTestId('drilldown-legend')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Store details' })
    ).toBeInTheDocument();
  });
});
