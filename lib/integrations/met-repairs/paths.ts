/** Production MET Repairs OS origin (StackZen consumer). */
export const MET_REPAIRS_PRODUCTION_URL = 'https://metrepairs.com';

/** MET Repairs OS StackZen consumer routes (see Metrepairsvercel `/api/integrations/stackzen/*`). */
export const MET_REPAIRS_STACKZEN_API_PREFIX = '/api/integrations/stackzen';

export const MET_REPAIRS_API_PATHS = {
  jobs: `${MET_REPAIRS_STACKZEN_API_PREFIX}/jobs`,
  invoices: `${MET_REPAIRS_STACKZEN_API_PREFIX}/invoices`,
  payments: `${MET_REPAIRS_STACKZEN_API_PREFIX}/payments`,
  expenses: `${MET_REPAIRS_STACKZEN_API_PREFIX}/expenses`,
  contractors: `${MET_REPAIRS_STACKZEN_API_PREFIX}/contractors`,
  summary: `${MET_REPAIRS_STACKZEN_API_PREFIX}/summary`,
} as const;
