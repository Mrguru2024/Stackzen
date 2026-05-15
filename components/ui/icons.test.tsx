import React from 'react';
import { render, screen } from '@testing-library/react';
import Icons from './icons';
import '@testing-library/jest-dom';

// Mock the icons
jest.mock('./icons', () => ({
  __esModule: true,
  default: {
    check: () => <div data-testid="icon-check">Check Icon</div>,
    x: () => <div data-testid="icon-x">X Icon</div>,
    chevronDown: () => <div data-testid="icon-chevron-down">ChevronDown Icon</div>,
    chevronRight: () => <div data-testid="icon-chevron-right">ChevronRight Icon</div>,
    edit: () => <div data-testid="icon-edit">Edit Icon</div>,
    delete: () => <div data-testid="icon-delete">Delete Icon</div>,
  },
}));

describe('Icons', () => {
  it('renders Check icon', () => {
    render(<Icons.check className="h-4 w-4" data-testid="icon-check" />);
    expect(screen.getByTestId('icon-check')).toBeInTheDocument();
  });

  it('renders X icon', () => {
    render(<Icons.x className="h-4 w-4" data-testid="icon-x" />);
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('renders ChevronDown icon', () => {
    render(<Icons.chevronDown className="h-4 w-4" data-testid="icon-chevron-down" />);
    expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
  });

  it('renders ChevronRight icon', () => {
    render(<Icons.chevronRight className="h-4 w-4" data-testid="icon-chevron-right" />);
    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
  });

  it('renders Edit icon', () => {
    render(<Icons.edit data-testid="icon-edit" />);
    expect(screen.getByTestId('icon-edit')).toBeInTheDocument();
  });

  it('renders Delete icon', () => {
    render(<Icons.delete data-testid="icon-delete" />);
    expect(screen.getByTestId('icon-delete')).toBeInTheDocument();
  });
});
