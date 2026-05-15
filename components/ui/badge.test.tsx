import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';
import '@testing-library/jest-dom';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });
});
