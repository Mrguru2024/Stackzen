import { render, screen, waitFor } from '@testing-library/react';
import UnifiedOperationalWorkspace from './index';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user_test' } }, status: 'authenticated' }),
}));

jest.mock('@/hooks/useOperationalAttentionRealtime', () => ({
  useOperationalAttentionRealtime: jest.fn(),
}));

describe('UnifiedOperationalWorkspace', () => {
  beforeEach(() => {
    global.fetch = jest.fn(url => {
      const u = String(url);
      if (u.includes('/api/operational-center/alerts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ alerts: [], grouped: {} }),
        });
      }
      if (u.includes('/api/income-profiles/activation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ profiles: ['PAYCHECK'], navKeys: [], features: [] }),
        });
      }
      if (u.includes('/api/operational-center/checkpoint')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ payload: { version: 1 } }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    }) as unknown as typeof fetch;
  });

  it('renders operations hub heading and workflow strip', async () => {
    render(<UnifiedOperationalWorkspace compactIntelligencePanels={false} />);
    expect(screen.getByRole('heading', { name: /operations hub/i })).toBeInTheDocument();
    expect(screen.getByText(/Workflow continuity/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/0 item\(s\) in your attention queue/i)).toBeInTheDocument());
  });
});
