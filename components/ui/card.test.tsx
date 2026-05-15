import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from './card';
import '@testing-library/jest-dom';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(
      <Card className="test-class">
        <div>Test</div>
      </Card>
    );
    expect(screen.getByText('Test').parentElement).toHaveClass('test-class');
  });
});
