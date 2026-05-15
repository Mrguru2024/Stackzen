import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SpendingGuardrails from './SpendingGuardrails.tsx';

const mockGuardrails = [
  {
    id: '1',
    userId: 'user1',
    category: 'food',
    limit: 500,
    current: 300,
    period: 'monthly',
    notifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    category: 'entertainment',
    limit: 200,
    current: 180,
    period: 'monthly',
    notifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('SpendingGuardrails', () => {
  const mockHandlers = {
    onAddGuardrail: jest.fn(),
    onUpdateGuardrail: jest.fn(),
    onDeleteGuardrail: jest.fn(),
    onToggleGuardrail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with tabs', () => {
    render(<SpendingGuardrails guardrails={mockGuardrails} {...mockHandlers} />);

    expect(screen.getByText('Spending Guardrails')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Limits')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders guardrails in dashboard view', () => {
    render(<SpendingGuardrails guardrails={mockGuardrails} {...mockHandlers} />);

    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('entertainment')).toBeInTheDocument();
    expect(screen.getByText('monthly limit: $500.00')).toBeInTheDocument();
    expect(screen.getByText('monthly limit: $200.00')).toBeInTheDocument();
  });

  it('shows empty state when no guardrails exist', () => {
    render(<SpendingGuardrails guardrails={[]} {...mockHandlers} />);

    expect(screen.getByText('No Spending Limits Set')).toBeInTheDocument();
    expect(screen.getByText('Add First Limit')).toBeInTheDocument();
  });

  it('calls onAddGuardrail when adding a new limit', () => {
    render(<SpendingGuardrails guardrails={[]} {...mockHandlers} />);

    fireEvent.click(screen.getByText('Add First Limit'));
    expect(mockHandlers.onAddGuardrail).toHaveBeenCalled();
  });

  it('calls onUpdateGuardrail when editing a limit', () => {
    render(<SpendingGuardrails guardrails={mockGuardrails} {...mockHandlers} />);

    // Switch to manage view
    fireEvent.click(screen.getByText('Manage Limits'));

    // Click edit button for first guardrail
    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(mockHandlers.onUpdateGuardrail).toHaveBeenCalledWith(mockGuardrails[0]);
  });

  it('calls onDeleteGuardrail when deleting a limit', () => {
    render(<SpendingGuardrails guardrails={mockGuardrails} {...mockHandlers} />);

    // Switch to manage view
    fireEvent.click(screen.getByText('Manage Limits'));

    // Click delete button for first guardrail
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(mockHandlers.onDeleteGuardrail).toHaveBeenCalledWith(mockGuardrails[0].id);
  });

  it('calls onToggleGuardrail when toggling notifications', () => {
    render(<SpendingGuardrails guardrails={mockGuardrails} {...mockHandlers} />);

    // Switch to manage view
    fireEvent.click(screen.getByText('Manage Limits'));

    // Click toggle button for first guardrail
    fireEvent.click(screen.getAllByText('Disable')[0]);
    expect(mockHandlers.onToggleGuardrail).toHaveBeenCalledWith(mockGuardrails[0].id);
  });

  it('shows correct status icons based on spending', () => {
    const guardrailsWithHighSpending = [
      {
        ...mockGuardrails[0],
        current: 450, // 90% of limit
      },
      {
        ...mockGuardrails[1],
        current: 210, // Over limit
      },
    ];

    render(<SpendingGuardrails guardrails={guardrailsWithHighSpending} {...mockHandlers} />);

    // Should show alert icon for 90% spending
    expect(screen.getByTestId('alert-circle')).toBeInTheDocument();

    // Should show x icon for over limit
    expect(screen.getByTestId('x-circle')).toBeInTheDocument();
  });
});
