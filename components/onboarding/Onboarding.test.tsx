import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Onboarding from './index.tsx';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('Onboarding', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders the welcome step initially', () => {
    render(<Onboarding />);
    expect(screen.getByText('Welcome to Stackzen')).toBeInTheDocument();
  });

  it('navigates to the next step when clicking Next', () => {
    render(<Onboarding />);
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
  });

  it('navigates back when clicking Back', () => {
    render(<Onboarding />);
    // Go to second step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    // Go back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    expect(screen.getByText('Welcome to Stackzen')).toBeInTheDocument();
  });

  it('shows progress indicators', () => {
    render(<Onboarding />);
    const progressBars = screen.getAllByRole('presentation');
    expect(progressBars).toHaveLength(5); // 5 steps now
  });

  it('redirects to dashboard after completing all steps', async () => {
    render(<Onboarding />);

    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    }

    // Click complete
    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  describe('Profile Form Validation', () => {
    it('shows error for invalid name', async () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Try to submit with invalid name
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { value: 'A' } });

      const nextButtonOnProfile = screen.getByText('Next');
      fireEvent.click(nextButtonOnProfile);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email', async () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Try to submit with invalid email
      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const nextButtonOnProfile = screen.getByText('Next');
      fireEvent.click(nextButtonOnProfile);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('shows error for invalid age', async () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Try to submit with invalid age
      const ageInput = screen.getByPlaceholderText('Enter your age');
      fireEvent.change(ageInput, { target: { value: '17' } });

      const nextButtonOnProfile = screen.getByText('Next');
      fireEvent.click(nextButtonOnProfile);

      await waitFor(() => {
        expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
      });
    });

    it('accepts valid profile data', async () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Enter valid profile data
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const ageInput = screen.getByPlaceholderText('Enter your age');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      const nextButtonOnProfile = screen.getByText('Next');
      fireEvent.click(nextButtonOnProfile);

      await waitFor(() => {
        expect(screen.getByText('Set Up Your Income')).toBeInTheDocument();
      });
    });
  });

  describe('Income Form Validation', () => {
    it('shows error for invalid income amount', async () => {
      render(<Onboarding />);

      // Navigate to income step
      for (let i = 0; i < 2; i++) {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      }

      // Try to submit with invalid income
      const incomeInput = screen.getByPlaceholderText('Enter your monthly income');
      fireEvent.change(incomeInput, { target: { value: '0' } });

      const nextButtonOnIncome = screen.getByText('Next');
      fireEvent.click(nextButtonOnIncome);

      await waitFor(() => {
        expect(screen.getByText('Income must be greater than 0')).toBeInTheDocument();
      });
    });

    it('accepts valid income data', async () => {
      render(<Onboarding />);

      // Navigate to income step
      for (let i = 0; i < 2; i++) {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      }

      // Enter valid income data
      const incomeInput = screen.getByPlaceholderText('Enter your monthly income');
      const frequencySelect = screen.getByLabelText('Payment Frequency');
      const currencySelect = screen.getByLabelText('Currency');

      fireEvent.change(incomeInput, { target: { value: '5000' } });
      fireEvent.change(frequencySelect, { target: { value: 'monthly' } });
      fireEvent.change(currencySelect, { target: { value: 'USD' } });

      const nextButtonOnIncome = screen.getByText('Next');
      fireEvent.click(nextButtonOnIncome);

      await waitFor(() => {
        expect(screen.getByText('Income Split')).toBeInTheDocument();
      });
    });
  });

  describe('Goals Form Validation', () => {
    it('shows error for invalid target amount', async () => {
      render(<Onboarding />);

      // Navigate to goals step
      for (let i = 0; i < 4; i++) {
        const nextButton = screen.getByRole('button', { name: i === 3 ? 'Complete' : 'Next' });
        fireEvent.click(nextButton);
      }

      // Try to submit with invalid amount
      const amountInput = screen.getByPlaceholderText('Enter your target amount');
      fireEvent.change(amountInput, { target: { value: '0' } });

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Target amount must be greater than 0')).toBeInTheDocument();
      });
    });

    it('shows error for invalid timeline', async () => {
      render(<Onboarding />);

      // Navigate to goals step
      for (let i = 0; i < 4; i++) {
        const nextButton = screen.getByRole('button', { name: i === 3 ? 'Complete' : 'Next' });
        fireEvent.click(nextButton);
      }

      // Try to submit with invalid timeline
      const timelineInput = screen.getByPlaceholderText('Enter your target timeline in months');
      fireEvent.change(timelineInput, { target: { value: '0' } });

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Timeline must be at least 1 month')).toBeInTheDocument();
      });
    });

    it('accepts valid goal data', async () => {
      render(<Onboarding />);

      // Navigate to goals step
      for (let i = 0; i < 4; i++) {
        const nextButton = screen.getByRole('button', { name: i === 3 ? 'Complete' : 'Next' });
        fireEvent.click(nextButton);
      }

      // Enter valid goal data
      const goalSelect = screen.getByLabelText('Primary Goal');
      const amountInput = screen.getByPlaceholderText('Enter your target amount');
      const timelineInput = screen.getByPlaceholderText('Enter your target timeline in months');

      fireEvent.change(goalSelect, { target: { value: 'house' } });
      fireEvent.change(amountInput, { target: { value: '10000' } });
      fireEvent.change(timelineInput, { target: { value: '12' } });

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Form State Management', () => {
    it('maintains form data between steps', async () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Enter profile data
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const ageInput = screen.getByPlaceholderText('Enter your age');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(ageInput, { target: { value: '25' } });

      // Navigate to income step
      const nextButtonOnProfile = screen.getByText('Next');
      fireEvent.click(nextButtonOnProfile);

      // Enter income data
      const incomeInput = screen.getByPlaceholderText('Enter your monthly income');
      fireEvent.change(incomeInput, { target: { value: '5000' } });

      // Navigate to goals step
      for (let i = 0; i < 2; i++) {
        const nextButton = screen.getByRole('button', { name: i === 1 ? 'Complete' : 'Next' });
        fireEvent.click(nextButton);
      }

      // Enter goal data
      const amountInput = screen.getByPlaceholderText('Enter your target amount');
      const timelineInput = screen.getByPlaceholderText('Enter your target timeline in months');

      fireEvent.change(amountInput, { target: { value: '10000' } });
      fireEvent.change(timelineInput, { target: { value: '12' } });

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      render(<Onboarding />);

      // Navigate to profile step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      const nameInput = screen.getByPlaceholderText('Enter your full name');
      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      const { rerender } = render(<Onboarding />);

      // Test mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      rerender(<Onboarding />);

      // Test tablet view
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      rerender(<Onboarding />);

      // Test desktop view
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));
      rerender(<Onboarding />);
    });
  });
});
