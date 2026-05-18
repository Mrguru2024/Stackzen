import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetRepairFinancialAlert } from '@/lib/integrations/met-repairs/types';

interface FinancialAlertsPanelProps {
  alerts: MetRepairFinancialAlert[];
}

function severityVariant(severity: MetRepairFinancialAlert['severity']) {
  if (severity === 'critical') return 'destructive' as const;
  if (severity === 'warning') return 'secondary' as const;
  return 'outline' as const;
}

export function FinancialAlertsPanel({ alerts }: FinancialAlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Financial alerts</CardTitle>
        <CardDescription>Risk signals from MET Repairs OS data (read-only).</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts right now. Metrics look within thresholds.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map(alert => (
              <li
                key={alert.id}
                className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={severityVariant(alert.severity)} className="uppercase">
                    {alert.severity}
                  </Badge>
                  <span className="font-medium text-foreground">{alert.title}</span>
                </div>
                <p className="text-muted-foreground">{alert.reason}</p>
                <p className="mt-2 text-foreground">
                  <span className="font-medium">Suggested next step: </span>
                  {alert.recommendedAction}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
