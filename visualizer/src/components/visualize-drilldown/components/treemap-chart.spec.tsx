import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderDrilldown } from '../test-utils';
import { toTreemapData, TreemapChart, type ChartNode } from './treemap-chart';

const node = (
  id: string,
  extra: Partial<ChartNode<string>> = {}
): ChartNode<string> => ({
  id,
  entityType: 'store',
  name: `Name ${id}`,
  typeLabel: 'Store',
  lines: [],
  value: 1,
  ariaLabel: `Name ${id}, Store`,
  payload: id,
  ...extra,
});

const rectOf = (el: HTMLElement) => ({
  left: parseFloat(el.style.left),
  top: parseFloat(el.style.top),
  width: parseFloat(el.style.width),
  height: parseFloat(el.style.height),
});

const render = (
  nodes: Array<ChartNode<string>>,
  size: [number, number] = [400, 300],
  onNodeClick = jest.fn()
) =>
  renderDrilldown(
    <TreemapChart
      nodes={nodes}
      width={size[0]}
      height={size[1]}
      onNodeClick={onNodeClick}
    />
  );

describe('toTreemapData', () => {
  it('keeps id and weight only', () => {
    expect(toTreemapData([{ id: 'a', value: 0.5 }])).toEqual([
      { id: 'a', value: 0.5 },
    ]);
  });
});

describe('TreemapChart', () => {
  it('renders one button per node with the entity-type data attribute', () => {
    render([node('a'), node('b'), node('c')]);
    const tiles = screen.getAllByRole('button');
    expect(tiles).toHaveLength(3);
    expect(screen.getByTestId('drilldown-tile-a')).toHaveAttribute(
      'data-entity-type',
      'store'
    );
    expect(screen.getByTestId('drilldown-treemap')).toBeInTheDocument();
  });

  it('lays tiles out inside the box without overlap, weight 0.5 smaller', () => {
    render([
      node('a'),
      node('b'),
      node('c'),
      node('d'),
      node('more', { value: 0.5, isLoadMore: true }),
    ]);
    const rects = ['a', 'b', 'c', 'd'].map((id) =>
      rectOf(screen.getByTestId(`drilldown-tile-${id}`))
    );
    const more = rectOf(screen.getByTestId('drilldown-load-more-store'));
    const all = [...rects, more];
    all.forEach((r) => {
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.top).toBeGreaterThanOrEqual(0);
      expect(r.left + r.width).toBeLessThanOrEqual(400);
      expect(r.top + r.height).toBeLessThanOrEqual(300);
    });
    all.forEach((a, i) =>
      all.slice(i + 1).forEach((b) => {
        const overlaps =
          a.left < b.left + b.width &&
          b.left < a.left + a.width &&
          a.top < b.top + b.height &&
          b.top < a.top + a.height;
        expect(overlaps).toBe(false);
      })
    );
    expect(more.width * more.height).toBeLessThan(
      rects[0].width * rects[0].height
    );
  });

  it('calls onNodeClick when a focused tile is activated with Enter', async () => {
    const onClick = jest.fn();
    render([node('a'), node('b')], [400, 300], onClick);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('gives each tile the accessible name from the node', () => {
    render([node('a', { ariaLabel: 'Berlin, Store, has 3 customers' })]);
    expect(screen.getByTestId('drilldown-tile-a')).toHaveAccessibleName(
      'Berlin, Store, has 3 customers'
    );
  });

  it('shows the name and extra lines as a tooltip on keyboard focus', async () => {
    render([node('a', { lines: ['has 3 customers'] })]);
    await userEvent.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Name a');
    expect(tooltip).toHaveTextContent('Store');
    expect(tooltip).toHaveTextContent('has 3 customers');
  });

  it('draws no visible text in small tiles but keeps the accessible name', () => {
    const nodes = Array.from({ length: 50 }, (_, i) => node(`n${i}`));
    render(nodes, [60, 30]);
    const tile = screen.getByTestId('drilldown-tile-n0');
    expect(tile).toHaveAccessibleName('Name n0, Store');
    expect(tile).toHaveTextContent('');
  });

  it('draws text in large tiles', () => {
    render([node('a')], [400, 300]);
    expect(screen.getByTestId('drilldown-tile-a')).toHaveTextContent('Name a');
  });

  it('names the load-more tile and keeps it neutral, not entity coloured', () => {
    render([
      node('a'),
      node('more', {
        value: 0.5,
        isLoadMore: true,
        ariaLabel: 'Load more Stores',
      }),
    ]);
    const more = screen.getByTestId('drilldown-load-more-store');
    expect(more).toHaveAccessibleName('Load more Stores');
    expect(more.style.backgroundColor).toBe('');
  });
});
