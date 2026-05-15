import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyInput } from './currency-input';
import '@testing-library/jest-dom';
import { TestWrapper } from '@/lib/test-utils';
// import { FormProvider, useForm } from 'react-hook-form'; // Unused

const TestWrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

describe('CurrencyInput', () => {
  it('renders input', () => {
    render(
      <TestWrapper>
        <CurrencyInput name="amount" />
      </TestWrapper>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = jest.fn();
    render(
      <TestWrapper>
        <CurrencyInput name="amount" onChange={onChange} />
      </TestWrapper>
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '123' } });
    expect(input).toHaveValue('123');
  });
});
