import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { ForecastSummaryDto } from '@/lib/operational-actions/types';

export function summarizeForecast(forecast: CashFlowForecastResponseDto): ForecastSummaryDto {
  const w30 = forecast.windows.find(w => w.windowDays === 30) ?? forecast.windows[forecast.windows.length - 1];
  return {
    generatedAt: forecast.generatedAt,
    riskCodes: forecast.risks.map(r => r.code),
    lowestProjectedBalance30d: w30 ? w30.lowestProjectedBalance : null,
    lowestProjectedBalanceDate30d: w30?.lowestProjectedBalanceDate ?? null,
    projectedEndingBalance30d: w30 ? w30.projectedEndingBalance : null,
  };
}
