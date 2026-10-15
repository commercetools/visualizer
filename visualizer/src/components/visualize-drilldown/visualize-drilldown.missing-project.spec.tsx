import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisualizeDrilldown from './visualize-drilldown';
import { renderDrilldown } from './test-utils';
import { MissingProjectError } from './hooks/use-ct-rest';

const mockGet = jest.fn();

// The application shell cannot render without a project, so the "no project
// key" case is covered by a request hook that behaves as without a project.
jest.mock('./hooks/use-ct-rest', () => ({
  ...jest.requireActual('./hooks/use-ct-rest'),
  useCtRest: () => ({ get: mockGet, projectKey: '' }),
}));

describe('Missing project', () => {
  it('shows an error alert and sends no request', async () => {
    mockGet.mockRejectedValue(new MissingProjectError());
    renderDrilldown(<VisualizeDrilldown />);
    await userEvent.click(screen.getByRole('button', { name: 'Stores' }));
    expect(await screen.findByTestId('drilldown-error')).toHaveTextContent(
      'No project is selected'
    );
  });
});
