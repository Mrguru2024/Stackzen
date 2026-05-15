import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './index.tsx';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('handles disabled state', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('calls onChange when clicked', () => {
    const _handleChange = jest.fn();
    render(<Checkbox onCheckedChange={_handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(_handleChange).toHaveBeenCalledWith(true);
  });

  it('handles default checked state', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('handles required state', () => {
    render(<Checkbox required />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeRequired();
  });

  it('handles name attribute', () => {
    render(<Checkbox name="test-checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('name', 'test-checkbox');
  });

  it('handles aria-label', () => {
    render(<Checkbox aria-label="Test Checkbox" />);
    const checkbox = screen.getByLabelText('Test Checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles controlled state changes', () => {
    const { rerender } = render(<Checkbox checked={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    rerender(<Checkbox checked={true} />);
    expect(checkbox).toBeChecked();
  });

  it('handles keyboard interactions', () => {
    const _handleChange = jest.fn();
    render(<Checkbox onCheckedChange={_handleChange} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.keyDown(checkbox, { key: ' ' });
    expect(_handleChange).toHaveBeenCalledWith(true);

    fireEvent.keyDown(checkbox, { key: 'Enter' });
    expect(_handleChange).toHaveBeenCalledWith(false);
  });
});
