-- Operational financial guidance engine audit events
ALTER TYPE "FinancialEventType" ADD VALUE 'GUIDANCE_ENGINE_SYNCED';
ALTER TYPE "FinancialEventSource" ADD VALUE 'API_GUIDANCE';
