import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessMetRepairsCommandCenter } from '@/lib/integrations/met-repairs/access';
import { isMetRepairsConfigured } from '@/lib/integrations/met-repairs/config';
import {
  getMetRepairCommandCenterSnapshot,
  MetRepairsApiError,
} from '@/lib/integrations/met-repairs/client';
import { CommandCenterHeader } from '@/components/met-repairs-command-center/command-center-header';
import { BusinessHealthCards } from '@/components/met-repairs-command-center/business-health-cards';
import { FinancialAlertsPanel } from '@/components/met-repairs-command-center/financial-alerts-panel';
import { LeadSourceRoiTable } from '@/components/met-repairs-command-center/lead-source-roi-table';
import { JobProfitabilityTable } from '@/components/met-repairs-command-center/job-profitability-table';
import { ContractorPayoutSummary } from '@/components/met-repairs-command-center/contractor-payout-summary';
import { UnpaidInvoicesPanel } from '@/components/met-repairs-command-center/unpaid-invoices-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function MetRepairsCommandCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=%2Fdashboard%2Fmet-repairs');
  }

  if (!canAccessMetRepairsCommandCenter(session.user.role)) {
    redirect('/dashboard');
  }

  if (!isMetRepairsConfigured()) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <CommandCenterHeader />
        <Card>
          <CardHeader>
            <CardTitle>Integration not configured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Add server-only environment variables to connect StackZen to MET Repairs OS (read-only
              API):
            </p>
            <ul className="list-inside list-disc space-y-1 font-mono text-xs text-foreground">
              <li>MET_REPAIRS_API_URL=https://metrepairs.com</li>
              <li>MET_REPAIRS_API_KEY (same as STACKZEN_API_KEY on MET Repairs)</li>
            </ul>
            <p className="pt-2">
              <a href="/settings/integrations/met-repairs" className="text-primary underline">
                Generate or rotate integration key
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    const snapshot = await getMetRepairCommandCenterSnapshot();

    return (
      <div className="mx-auto max-w-7xl space-y-8 py-4">
        <CommandCenterHeader />
        <p className="text-xs text-muted-foreground">
          Last synced {new Date(snapshot.fetchedAt).toLocaleString()} · read-only consumer view
        </p>
        <BusinessHealthCards summary={snapshot.summary} />
        <FinancialAlertsPanel alerts={snapshot.alerts} />
        <LeadSourceRoiTable rows={snapshot.leadSourceRoi} />
        <JobProfitabilityTable rows={snapshot.jobProfitability} />
        <ContractorPayoutSummary rows={snapshot.contractorPayouts} />
        <UnpaidInvoicesPanel invoices={snapshot.unpaidInvoices} />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof MetRepairsApiError
        ? error.message
        : 'Unable to load MET Repairs financial data.';

    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <CommandCenterHeader />
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Could not load MET Repairs data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{message}</p>
            <p className="mt-2">
              Verify MET Repairs OS is running, the API key is valid, and the financial endpoints are
              available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
