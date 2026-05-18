const BLOCKED_RESPONSE_PATTERNS: RegExp[] = [
  /\byou\s+should\s+invest\s+in\b/i,
  /\byou\s+need\s+to\s+(?:invest|buy|sell|take)\b/i,
  /\bguaranteed\b/i,
  /\btake\s+this\s+loan\b/i,
  /\bbuy\s+this\s+stock\b/i,
  /\bsell\s+all\s+your\b/i,
  /\byou\s+must\s+(?:invest|buy|sell)\b/i,
  /\brecommend\s+(?:buying|selling)\b/i,
  /\b(?:definitely|certainly)\s+(?:will|going to)\s+(?:make|earn)\b/i,
];

const SAFE_REPLACEMENT =
  'One option to consider is reviewing your goals with a licensed financial professional. Would you like to explore general educational resources on this topic?';

export type ResponsePolicyResult = {
  text: string;
  policyApplied: boolean;
  violations: string[];
};

export function applyResponsePolicy(text: string): ResponsePolicyResult {
  const violations: string[] = [];

  for (const pattern of BLOCKED_RESPONSE_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(pattern.source);
    }
  }

  if (violations.length === 0) {
    return { text, policyApplied: false, violations };
  }

  return {
    text: SAFE_REPLACEMENT,
    policyApplied: true,
    violations,
  };
}

export function softenDirectivePhrases(text: string): string {
  return text
    .replace(/\bYou should\b/g, 'You may want to')
    .replace(/\bYou need to\b/g, 'You might consider')
    .replace(/\bYou must\b/g, 'It can be helpful to')
    .replace(/\bguaranteed\b/gi, 'potential');
}
