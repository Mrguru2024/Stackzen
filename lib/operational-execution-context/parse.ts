import type {
  CommandCenterCtaLadderStep,
  OperationalExecutionSource,
  OperationalHandoffBand,
  OperationalHandoffSubsystem,
  ParsedOperationalHandoff,
} from '@/lib/operational-execution-context/types';

const SRC: OperationalExecutionSource[] = ['command_center'];
const SUB: OperationalHandoffSubsystem[] = ['reserve', 'timing', 'contractor', 'workflow'];
const BAND: OperationalHandoffBand[] = ['escalating', 'coordination', 'stabilizing'];

function parseStep(raw: string | null): CommandCenterCtaLadderStep | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (n >= 1 && n <= 6) return n as CommandCenterCtaLadderStep;
  return undefined;
}

export function parseOperationalHandoffFromSearchParams(
  params: URLSearchParams | { get: (k: string) => string | null }
): ParsedOperationalHandoff | null {
  const src = params.get('op_src');
  if (!src || !SRC.includes(src as OperationalExecutionSource)) return null;

  const out: ParsedOperationalHandoff = { source: src as OperationalExecutionSource };

  const sub = params.get('op_sub');
  if (sub && SUB.includes(sub as OperationalHandoffSubsystem)) {
    out.subsystem = sub as OperationalHandoffSubsystem;
  }

  const band = params.get('op_band');
  if (band && BAND.includes(band as OperationalHandoffBand)) {
    out.band = band as OperationalHandoffBand;
  }

  const step = parseStep(params.get('op_step'));
  if (step) out.ctaLadderStep = step;

  return out;
}
