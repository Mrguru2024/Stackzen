import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InvoicePaymentLinkButton } from './index';

const meta: Meta<typeof InvoicePaymentLinkButton> = {
  title: 'Billing/InvoicePaymentLinkButton',
  component: InvoicePaymentLinkButton,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof InvoicePaymentLinkButton>;

export const StripeNotReady: Story = {
  render: () => <InvoicePaymentLinkButton invoiceId="inv_demo" stripeReady={false} />,
};

export const ReadyToGenerate: Story = {
  render: () => <InvoicePaymentLinkButton invoiceId="inv_demo" stripeReady />,
};

export const AlreadyGenerated: Story = {
  render: () => (
    <InvoicePaymentLinkButton
      invoiceId="inv_demo"
      stripeReady
      initialPaymentUrl="https://invoice.stripe.com/i/abc"
    />
  ),
};
