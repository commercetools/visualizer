/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
 * Freely available, AS IS and UNSUPPORTED. See LICENSE.
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderDrilldown } from '../test-utils';
import type { BreadcrumbItem } from '../types';
import { BreadcrumbNavigation } from './breadcrumb-navigation';
import { EntityInfoPanel } from './entity-info-panel';
import { EntitySelector } from './entity-selector';
import { InteractiveLegend } from './interactive-legend';
import { SearchAndSortControls } from './search-and-sort-controls';

describe('EntitySelector', () => {
  it('shows six unpressed buttons, calls the handler, and disables while loading', async () => {
    const onSelect = jest.fn();
    renderDrilldown(
      <EntitySelector selectedEntityType={null} onEntityTypeSelect={onSelect} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(6);
    screen
      .getAllByRole('button')
      .forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(screen.getByRole('button', { name: 'Stores' }));
    expect(onSelect).toHaveBeenCalledWith('store');
  });

  it('disables every button when loading', () => {
    renderDrilldown(
      <EntitySelector
        selectedEntityType="store"
        onEntityTypeSelect={jest.fn()}
        loading
      />
    );
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Stores' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('SearchAndSortControls', () => {
  const setup = (sort: { field: string; direction: 'asc' | 'desc' } | null) => {
    const handlers = {
      onSearchChange: jest.fn(),
      onSortChange: jest.fn(),
      onClearSearch: jest.fn(),
    };
    renderDrilldown(
      <SearchAndSortControls
        entityType="store"
        search=""
        sort={sort}
        {...handlers}
      />
    );
    return handlers;
  };

  it('submits the search on Enter only', async () => {
    const h = setup(null);
    await userEvent.type(screen.getByRole('searchbox'), 'Berlin');
    expect(h.onSearchChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(h.onSearchChange).toHaveBeenCalledWith('Berlin');
  });

  it('emits the next sort direction and shows arrows', async () => {
    const h = setup(null);
    await userEvent.click(screen.getByTestId('drilldown-sort-key'));
    expect(h.onSortChange).toHaveBeenCalledWith('key', 'asc');
  });

  it('cycles an active sort to desc and then none', async () => {
    const asc = setup({ field: 'key', direction: 'asc' });
    expect(screen.getByTestId('drilldown-sort-key')).toHaveTextContent('Key ↑');
    await userEvent.click(screen.getByTestId('drilldown-sort-key'));
    expect(asc.onSortChange).toHaveBeenCalledWith('key', 'desc');
  });
});

describe('BreadcrumbNavigation', () => {
  const crumbs = (n: number): BreadcrumbItem[] =>
    Array.from({ length: n }, (_, i) => ({
      entityType: 'store',
      entityId: `s${i + 1}`,
      entityName: `Store ${i + 1}`,
      level: i + 1,
    }));

  it('renders nothing for an empty trail', () => {
    renderDrilldown(
      <BreadcrumbNavigation
        breadcrumbs={[]}
        onNavigateToLevel={jest.fn()}
        onNavigateToRoot={jest.fn()}
      />
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows Root, "...", and the last three of four, and navigates', async () => {
    const toLevel = jest.fn();
    const toRoot = jest.fn();
    renderDrilldown(
      <BreadcrumbNavigation
        breadcrumbs={crumbs(4)}
        onNavigateToLevel={toLevel}
        onNavigateToRoot={toRoot}
      />
    );
    const items = within(screen.getByRole('navigation')).getAllByRole(
      'listitem'
    );
    expect(items).toHaveLength(5);
    expect(items[1]).toHaveTextContent('...');
    await userEvent.click(
      screen.getByRole('button', { name: 'Store 2 (Store)' })
    );
    expect(toLevel).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: /Root/ }));
    expect(toRoot).toHaveBeenCalled();
  });
});

describe('InteractiveLegend', () => {
  const legend = [
    {
      entityType: 'store' as const,
      label: 'Stores',
      count: 3,
      total: 3,
      color: '#eb6834',
    },
    {
      entityType: 'channel' as const,
      label: 'Channels',
      count: 2,
      total: 2,
      color: '#eda100',
    },
  ];

  it('reflects visibility in aria-pressed and toggles by type', async () => {
    const toggle = jest.fn();
    renderDrilldown(
      <InteractiveLegend
        legend={legend}
        hiddenTypes={['channel']}
        onToggleEntityType={toggle}
        onShowAll={jest.fn()}
        onHideAll={jest.fn()}
      />
    );
    expect(screen.getByTestId('drilldown-legend-store')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByTestId('drilldown-legend-channel')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await userEvent.click(screen.getByTestId('drilldown-legend-channel'));
    expect(toggle).toHaveBeenCalledWith('channel');
  });

  it('offers "Show All" when everything is hidden', () => {
    renderDrilldown(
      <InteractiveLegend
        legend={legend}
        hiddenTypes={['store', 'channel']}
        onToggleEntityType={jest.fn()}
        onShowAll={jest.fn()}
        onHideAll={jest.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Show All' })
    ).toBeInTheDocument();
  });
});

describe('EntityInfoPanel', () => {
  const info = {
    id: 'store-1',
    name: 'Berlin',
    entityType: 'store' as const,
    data: {
      id: 'store-1',
      key: 'berlin',
      version: 4,
      createdAt: '2024-01-01T10:00:00.000Z',
      lastModifiedAt: '',
    },
  };

  it('renders no dialog when closed', () => {
    renderDrilldown(
      <EntityInfoPanel entityInfo={info} isOpen={false} onClose={jest.fn()} />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows id, key, version and JSON, and closes with Escape', async () => {
    const onClose = jest.fn();
    renderDrilldown(
      <EntityInfoPanel entityInfo={info} isOpen onClose={onClose} />
    );
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('drilldown-drawer')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('store-1');
    expect(dialog).toHaveTextContent('berlin');
    expect(dialog).toHaveTextContent('4');
    expect(dialog).toHaveTextContent('"version": 4');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('never shows "Invalid Date" for missing timestamps', async () => {
    renderDrilldown(
      <EntityInfoPanel entityInfo={info} isOpen onClose={jest.fn()} />
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).not.toHaveTextContent('Invalid Date');
  });
});
