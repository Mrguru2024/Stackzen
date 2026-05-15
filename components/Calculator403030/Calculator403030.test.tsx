import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calculator403030 from './index.tsx';

describe('Calculator403030', () => {
  it('renders calculator form', () => {
    render(<Calculator403030 />);
    expect(screen.getByText('40/30/30 Income Split Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText('Monthly Income ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Needs (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Wants (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Savings (%)')).toBeInTheDocument();
  });

  it('updates income and allocation values correctly', () => {
    render(<Calculator403030 />);
    const incomeInput = screen.getByLabelText('Monthly Income ($)');
    const needsInput = screen.getByLabelText('Needs (%)');
    const wantsInput = screen.getByLabelText('Wants (%)');
    const savingsInput = screen.getByLabelText('Savings (%)');

    fireEvent.change(incomeInput, { target: { value: '6000' } });
    fireEvent.change(needsInput, { target: { value: '50' } });
    fireEvent.change(wantsInput, { target: { value: '30' } });
    fireEvent.change(savingsInput, { target: { value: '20' } });

    expect(incomeInput).toHaveValue(6000);
    expect(needsInput).toHaveValue(50);
    expect(wantsInput).toHaveValue(30);
    expect(savingsInput).toHaveValue(20);
  });
});
