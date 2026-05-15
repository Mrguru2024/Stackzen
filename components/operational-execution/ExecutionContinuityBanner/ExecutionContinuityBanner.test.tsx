import { render, screen } from '@testing-library/react';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (k: string) => mockGet(k),
  }),
}));

describe('ExecutionContinuityBoundary', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders nothing without op_src', () => {
    const { container } = render(<ExecutionContinuityBoundary />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders banner when op_src is command_center and step is present', () => {
    mockGet.mockImplementation((k: string) => {
      if (k === 'op_src') return 'command_center';
      if (k === 'op_step') return '3';
      if (k === 'op_sub') return 'reserve';
      if (k === 'op_band') return 'escalating';
      return null;
    });
    render(<ExecutionContinuityBoundary />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Operational continuation/i)).toBeInTheDocument();
  });
});
