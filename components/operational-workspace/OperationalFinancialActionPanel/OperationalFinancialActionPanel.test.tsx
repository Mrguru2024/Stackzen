import { render, screen, waitFor } from '@testing-library/react';
import OperationalFinancialActionPanel from '@/components/operational-workspace/OperationalFinancialActionPanel';

describe('OperationalFinancialActionPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ proposals: [] }),
    } as Response);
  });

  it('renders empty state after load', async () => {
    render(<OperationalFinancialActionPanel />);
    await waitFor(() => {
      expect(screen.getByText(/No pending operational actions/i)).toBeInTheDocument();
    });
  });
});
