import { Route } from 'react-router-dom';
import {
  screen,
  mapResourceAccessToAppliedPermissions,
  renderAppWithRedux,
} from '@commercetools-frontend/application-shell/test-utils';
import { createApolloClient } from '@commercetools-frontend/application-shell';
import { NimbusProvider } from '@commercetools/nimbus';
import { entryPointUriPath, PERMISSIONS } from './constants';
import ApplicationRoutes from './routes';

// The pages are replaced by stubs so these tests only check the wiring,
// not the internals (or network mocks) of the pages.
jest.mock('./components/entity-diagram', () => ({
  __esModule: true,
  default: () => <div>entity-diagram-stub</div>,
}));
jest.mock('./components/visualize-drilldown', () => ({
  __esModule: true,
  default: () => <div>visualize-drilldown-stub</div>,
}));

// Pulls in `vanilla-jsoneditor` (ESM only), which Jest cannot load and which is
// irrelevant for the wiring checked here.
jest.mock('./components/custom-objects/custom-objects-list', () => ({
  __esModule: true,
  default: () => <div>custom-objects-stub</div>,
}));

const WELCOME_TITLE =
  'A visualizer for all non out-of-the-box types in Merchant Center';

const renderRoutes = (path: string) =>
  renderAppWithRedux(
    <Route path={`/:projectKey/${entryPointUriPath}`}>
      <NimbusProvider locale="en" loadFonts={false}>
        <ApplicationRoutes />
      </NimbusProvider>
    </Route>,
    {
      route: `/my-project/${entryPointUriPath}${path}`,
      environment: { entryPointUriPath },
      apolloClient: createApolloClient(),
      project: {
        allAppliedPermissions: mapResourceAccessToAppliedPermissions([
          PERMISSIONS.View,
        ]),
      },
    }
  );

describe('ApplicationRoutes', () => {
  it('renders the Entity Diagram at /entity-diagram', async () => {
    renderRoutes('/entity-diagram');
    expect(await screen.findByText('entity-diagram-stub')).toBeInTheDocument();
    expect(screen.queryByText(WELCOME_TITLE)).not.toBeInTheDocument();
  });

  it('renders Visualize Drilldown at /visualize-drilldown', async () => {
    renderRoutes('/visualize-drilldown');
    expect(
      await screen.findByText('visualize-drilldown-stub')
    ).toBeInTheDocument();
    expect(screen.queryByText(WELCOME_TITLE)).not.toBeInTheDocument();
  });

  it('falls back to Welcome for the legacy /visualize path', async () => {
    renderRoutes('/visualize');
    expect(await screen.findByText(WELCOME_TITLE)).toBeInTheDocument();
    expect(screen.queryByText('entity-diagram-stub')).not.toBeInTheDocument();
  });

  it('renders Welcome at the application root', async () => {
    renderRoutes('');
    expect(await screen.findByText(WELCOME_TITLE)).toBeInTheDocument();
  });
});
