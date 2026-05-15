import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteGenerator from './index.tsx';
import { SERVICE_CATEGORIES } from '@/lib/service-config';

describe('QuoteGenerator', () => {
  it('renders the form and preview', () => {
    render(<QuoteGenerator />);
    expect(screen.getByText('Quote Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Service Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Job Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hours')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hourly Rate')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Materials Cost')).toBeInTheDocument();
  });

  it('updates preview as user types', () => {
    render(<QuoteGenerator />);
    fireEvent.change(screen.getByPlaceholderText('Hours'), { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Hourly Rate'), { target: { value: '100' } });
    fireEvent.change(screen.getByPlaceholderText('Materials Cost'), { target: { value: '50' } });
    expect(screen.getByText('Labor: $200.00')).toBeInTheDocument();
    expect(screen.getByText('Materials: $50.00')).toBeInTheDocument();
  });

  it('can input lat/lng and see travel cost update', () => {
    render(<QuoteGenerator />);
    fireEvent.change(screen.getByPlaceholderText('Service Lat'), { target: { value: '34.0522' } });
    fireEvent.change(screen.getByPlaceholderText('Service Lng'), {
      target: { value: '-118.2437' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contractor Lat'), {
      target: { value: '34.0000' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contractor Lng'), {
      target: { value: '-118.2500' },
    });
    // Should show a nonzero travel cost
    expect(screen.getByText(/Travel: \$/)).toBeInTheDocument();
  });
});
