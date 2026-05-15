import { render, screen, waitFor } from '@testing-library/react';
import OperationalGoalsCenter from './index';

describe('OperationalGoalsCenter', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ goals: [] }),
      })
    ) as unknown as typeof fetch;
  });

  it('renders heading and create form labels', async () => {
    render(<OperationalGoalsCenter />);
    expect(screen.getByRole('heading', { name: /operational goals/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target amount/i)).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
