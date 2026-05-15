import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardsComponent from '.';

describe('CardsComponent', () => {
  it('renders the cards page header', () => {
    render(<CardsComponent />);
    expect(screen.getByText(/Cards/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage your credit and debit cards/i)).toBeInTheDocument();
  });

  it('shows the Add Card dialog when button is clicked', () => {
    render(<CardsComponent />);
    const addButton = screen.getByRole('button', { name: /Add Card/i });
    fireEvent.click(addButton);
    expect(screen.getByText(/Add New Card/i)).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(<CardsComponent />);
    fireEvent.click(screen.getByRole('tab', { name: /Credit Cards/i }));
    expect(screen.getAllByText(/Credit Card/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('tab', { name: /Debit Cards/i }));
    expect(screen.getAllByText(/Debit Card/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('tab', { name: /Transactions/i }));
    expect(
      screen.getByText(/No transactions found/i) || screen.getByText(/Amazon/i)
    ).toBeInTheDocument();
  });
});
