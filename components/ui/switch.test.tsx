import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from './switch';
import '@testing-library/jest-dom';

const handleChange = jest.fn();

describe('Switch', () => {
  it('renders switch', () => {
    render(<Switch checked={false} onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('calls onCheckedChange when toggled', () => {
    render(<Switch checked={false} onCheckedChange={handleChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalled();
  });
});
