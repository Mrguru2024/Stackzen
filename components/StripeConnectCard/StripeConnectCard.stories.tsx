import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StripeConnectCard, type StripeConnectStatus } from './index';

const NOT_CONNECTED: StripeConnectStatus = {
  connected: false,
  accountId: null,
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  status: 'not_connected',
  pendingRequirements: [],
};

const ONBOARDING: StripeConnectStatus = {
  connected: true,
  accountId: 'acct_demo',
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: false,
  status: 'onboarding',
  pendingRequirements: ['external_account', 'individual.id_number', 'business_profile.url'],
};

const RESTRICTED: StripeConnectStatus = {
  connected: true,
  accountId: 'acct_demo',
  chargesEnabled: false,
  payoutsEnabled: false,
  detailsSubmitted: true,
  status: 'restricted',
  disabledReason: 'requirements.past_due',
  pendingRequirements: ['individual.dob.day'],
};

const ACTIVE: StripeConnectStatus = {
  connected: true,
  accountId: 'acct_demo',
  chargesEnabled: true,
  payoutsEnabled: true,
  detailsSubmitted: true,
  status: 'active',
  pendingRequirements: [],
};

const meta: Meta<typeof StripeConnectCard> = {
  title: 'Billing/StripeConnectCard',
  component: StripeConnectCard,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof StripeConnectCard>;

export const NotConnected: Story = {
  render: () => <StripeConnectCard initialStatus={NOT_CONNECTED} />,
};

export const Onboarding: Story = {
  render: () => <StripeConnectCard initialStatus={ONBOARDING} />,
};

export const Restricted: Story = {
  render: () => <StripeConnectCard initialStatus={RESTRICTED} />,
};

export const Active: Story = {
  render: () => <StripeConnectCard initialStatus={ACTIVE} />,
};

export const CompactInline: Story = {
  render: () => <StripeConnectCard initialStatus={NOT_CONNECTED} compact />,
};
