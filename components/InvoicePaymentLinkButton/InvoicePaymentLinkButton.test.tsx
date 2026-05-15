import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InvoicePaymentLinkButton } from './index';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

function makeFetcher(payload: unknown, ok = true): typeof fetch {
  return jest.fn(async () =>
    new Response(JSON.stringify(payload), { status: ok ? 200 : 400 })
  ) as unknown as typeof fetch;
}

describe('InvoicePaymentLinkButton', () => {
  it('disables the button with a tooltip when Stripe is not ready', () => {
    render(<InvoicePaymentLinkButton invoiceId="inv_1" stripeReady={false} />);
    expect(screen.getByTestId('invoice-payment-link-disabled')).toBeDisabled();
  });

  it('mints a Stripe payment link on first click', async () => {
    const fetcher = makeFetcher({ hostedInvoiceUrl: 'https://invoice.stripe.com/i/abc' });
    const onGenerated = jest.fn();

    render(
      <InvoicePaymentLinkButton
        invoiceId="inv_1"
        stripeReady
        fetcher={fetcher}
        onGenerated={onGenerated}
      />
    );

    fireEvent.click(screen.getByTestId('invoice-payment-link-generate'));

    await waitFor(() => {
      expect(onGenerated).toHaveBeenCalledWith('https://invoice.stripe.com/i/abc');
      expect(screen.getByTestId('invoice-payment-link-open')).toBeInTheDocument();
      expect(screen.getByTestId('invoice-payment-link-copy')).toBeInTheDocument();
    });
  });

  it('renders directly in the "open + copy" state when a URL is preloaded', () => {
    render(
      <InvoicePaymentLinkButton
        invoiceId="inv_1"
        stripeReady
        initialPaymentUrl="https://invoice.stripe.com/i/abc"
      />
    );
    expect(screen.getByTestId('invoice-payment-link-open')).toHaveAttribute(
      'href',
      'https://invoice.stripe.com/i/abc'
    );
  });
});
