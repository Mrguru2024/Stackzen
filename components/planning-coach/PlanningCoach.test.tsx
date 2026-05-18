import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlanningCoach from './index';

jest.mock('@/lib/ai/client-generate', () => ({
  requestAiGenerate: jest.fn(() =>
    Promise.resolve({
      response:
        'Some people find it helpful to review cash reserves and essential expenses before taking time off.',
      provider: 'educational',
    })
  ),
}));

describe('PlanningCoach', () => {
  it('renders and calls guarded AI API', async () => {
    render(<PlanningCoach income={5000} expenses={3000} timeOffDays={5} />);
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    await waitFor(() => {
      expect(screen.getByText(/cash reserves/i)).toBeInTheDocument();
    });
  });
});
