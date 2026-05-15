import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button.tsx';
import '@testing-library/jest-dom';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const _handleClick = jest.fn();
    render(<Button onClick={_handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(_handleClick).toHaveBeenCalled();
  });
});
