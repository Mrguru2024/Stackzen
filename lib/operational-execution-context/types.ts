/** Whitelisted operational execution handoff — URL hints for UX continuity only (non-authoritative). */

export type OperationalExecutionSource = 'command_center';

export type OperationalHandoffSubsystem = 'reserve' | 'timing' | 'contractor' | 'workflow';

export type OperationalHandoffBand = 'escalating' | 'coordination' | 'stabilizing';

/** Matches command center CTA ladder (architecture §3). */
export type CommandCenterCtaLadderStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface OperationalExecutionHandoffDto {
  source: OperationalExecutionSource;
  ctaLadderStep: CommandCenterCtaLadderStep;
  focusSubsystem?: OperationalHandoffSubsystem;
  focusBand?: OperationalHandoffBand;
}

export interface ParsedOperationalHandoff {
  source: OperationalExecutionSource;
  subsystem?: OperationalHandoffSubsystem;
  band?: OperationalHandoffBand;
  ctaLadderStep?: CommandCenterCtaLadderStep;
}

export interface ExecutionContinuityExplain {
  title: string;
  bodyLines: string[];
}
