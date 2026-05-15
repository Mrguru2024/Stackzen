const mockStripe = {
  accounts: {
    create: jest.fn().mockResolvedValue({
      id: 'acct_mock123',
      object: 'account',
      business_type: 'individual',
      charges_enabled: true,
      payouts_enabled: true,
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'acct_mock123',
      object: 'account',
      business_type: 'individual',
      charges_enabled: true,
      payouts_enabled: true,
    }),
  },
  accountLinks: {
    create: jest.fn().mockResolvedValue({
      object: 'account_link',
      url: 'https://connect.stripe.com/setup/s/mock123',
    }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_mock123',
      object: 'payment_intent',
      client_secret: 'pi_mock123_secret',
      status: 'requires_payment_method',
    }),
  },
};

export const stripe = mockStripe;
