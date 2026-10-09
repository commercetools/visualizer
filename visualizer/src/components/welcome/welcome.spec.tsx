/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { Route } from 'react-router-dom';
import {
  screen,
  fireEvent,
  mapResourceAccessToAppliedPermissions,
  renderAppWithRedux,
} from '@commercetools-frontend/application-shell/test-utils';
import { createApolloClient } from '@commercetools-frontend/application-shell';
import { NimbusProvider } from '@commercetools/nimbus';
import { entryPointUriPath, PERMISSIONS } from '../../constants';
import Welcome from './welcome';
import messages from './messages';

const renderWelcome = () =>
  renderAppWithRedux(
    <Route path={`/:projectKey/${entryPointUriPath}`}>
      <NimbusProvider locale="en" loadFonts={false}>
        <Welcome />
      </NimbusProvider>
    </Route>,
    {
      route: `/my-project/${entryPointUriPath}`,
      environment: { entryPointUriPath },
      apolloClient: createApolloClient(),
      project: {
        allAppliedPermissions: mapResourceAccessToAppliedPermissions([
          PERMISSIONS.View,
        ]),
      },
    }
  );

describe('Welcome', () => {
  it('renders seven cards in the specified order', async () => {
    renderWelcome();
    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'Types',
      'Subscriptions',
      'States',
      'API Extensions',
      'Custom Objects',
      'Visualize Drilldown',
      'Entity Diagram',
    ]);
  });

  it('has no card for the legacy "Visualize" route', async () => {
    renderWelcome();
    await screen.findAllByRole('heading', { level: 2 });
    expect(
      screen.queryByRole('heading', { name: /^Visualize$/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^View Visualize$/ })
    ).not.toBeInTheDocument();
  });

  it('uses a distinct description for every card', async () => {
    renderWelcome();
    await screen.findAllByRole('heading', { level: 2 });
    const contents = [
      messages.typesContent,
      messages.subscriptionsContent,
      messages.statesContent,
      messages.extensionsContent,
      messages.customObjectsContent,
      messages.visualizeDrilldownContent,
      messages.entityDiagramContent,
    ].map((m) => m.defaultMessage as string);
    expect(new Set(contents).size).toBe(7);
    // each description is actually rendered (exactly once)
    contents.forEach((text) => {
      expect(screen.getAllByText(text)).toHaveLength(1);
    });
  });

  it('navigates to the Entity Diagram route', async () => {
    const { history } = renderWelcome();
    fireEvent.click(
      await screen.findByRole('button', { name: /View Entity Diagram/ })
    );
    expect(history.location.pathname).toBe(
      `/my-project/${entryPointUriPath}/entity-diagram`
    );
  });

  it('navigates to the Visualize Drilldown route', async () => {
    const { history } = renderWelcome();
    fireEvent.click(
      await screen.findByRole('button', { name: /View Visualize Drilldown/ })
    );
    expect(history.location.pathname).toBe(
      `/my-project/${entryPointUriPath}/visualize-drilldown`
    );
  });
});
