import type { ReactElement } from 'react';
import {
  mapResourceAccessToAppliedPermissions,
  renderAppWithRedux,
  type TRenderAppWithReduxOptions,
} from '@commercetools-frontend/application-shell/test-utils';
import { createApolloClient } from '@commercetools-frontend/application-shell';
import { NimbusProvider } from '@commercetools/nimbus';
import { entryPointUriPath, PERMISSIONS } from '../../constants';

/** Renders `ui` inside the app shell test harness and the Nimbus provider. */
export const renderDrilldown = (
  ui: ReactElement,
  options: Partial<TRenderAppWithReduxOptions> = {}
) =>
  renderAppWithRedux(
    <NimbusProvider locale="en" loadFonts={false}>
      {ui}
    </NimbusProvider>,
    {
      environment: { entryPointUriPath },
      apolloClient: createApolloClient(),
      project: {
        allAppliedPermissions: mapResourceAccessToAppliedPermissions([
          PERMISSIONS.View,
        ]),
      },
      ...options,
    } as Partial<TRenderAppWithReduxOptions>
  );
