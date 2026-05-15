import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID ?? '';
const PLAID_SECRET = process.env.PLAID_SECRET ?? '';
const PLAID_ENV = (process.env.PLAID_ENV || 'sandbox') as keyof typeof PlaidEnvironments;

const plaidBasePath = PlaidEnvironments[PLAID_ENV] ?? PlaidEnvironments.sandbox;

const config = new Configuration({
  basePath: plaidBasePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(config);

export async function createLinkToken(userId: string) {
  return plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'StackZen',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
}

export async function exchangePublicToken(publicToken: string) {
  return plaidClient.itemPublicTokenExchange({ public_token: publicToken });
}

export async function fetchTransactions(accessToken: string, startDate: string, endDate: string) {
  return plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: { count: 100, offset: 0 },
  });
}

export async function fetchPlaidAccounts(accessToken: string) {
  return plaidClient.accountsGet({ access_token: accessToken });
}

export async function fetchPlaidItem(accessToken: string) {
  return plaidClient.itemGet({ access_token: accessToken });
}

export async function syncPlaidTransactions(accessToken: string, cursor?: string) {
  return plaidClient.transactionsSync({
    access_token: accessToken,
    cursor,
    options: { include_personal_finance_category: true },
  });
}
