export type PasswordStrength = {
  score: number;
  feedback: string[];
  isValid: boolean;
};

const MIN_LENGTH = 12;
const MAX_LENGTH = 128;
const COMMON_PASSWORDS = new Set([
  'password123',
  'qwerty123',
  'admin123',
  'welcome123',
  'letmein123',
  '12345678',
  'password1',
  'qwerty123',
  'admin123',
  'welcome123',
]);

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < MIN_LENGTH) {
    feedback.push(`Password must be at least ${MIN_LENGTH} characters long`);
  } else {
    score += Math.min(password.length / 4, 3); // Up to 3 points for length
    if (password.length >= 16) score += 1;
    if (password.length >= 24) score += 1;
  }

  if (password.length > MAX_LENGTH) {
    feedback.push(`Password must not exceed ${MAX_LENGTH} characters`);
  }

  // Character type checks
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasEmoji = /[\p{Emoji}]/u.test(password);

  if (!hasUpperCase) feedback.push('Include at least one uppercase letter');
  if (!hasLowerCase) feedback.push('Include at least one lowercase letter');
  if (!hasNumbers) feedback.push('Include at least one number');
  if (!hasSpecialChars) feedback.push('Include at least one special character');

  if (hasUpperCase) score += 1;
  if (hasLowerCase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  if (hasEmoji) {
    score += 1;
    feedback.push('Emoji usage detected - this may cause compatibility issues');
  }

  // Complexity checks
  const hasRepeatingChars = /(.)\1{2,}/.test(password);
  const hasSequentialChars =
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(
      password
    );
  const hasCommonPatterns = /(password|admin|welcome|qwerty|123456)/i.test(password);
  const hasPersonalInfo = /(name|email|phone|address|birthday|date)/i.test(password);

  if (hasRepeatingChars) {
    feedback.push('Avoid repeating characters (e.g., "aaa")');
    score -= 1;
  }
  if (hasSequentialChars) {
    feedback.push('Avoid sequential characters (e.g., "abc", "123")');
    score -= 1;
  }
  if (hasCommonPatterns) {
    feedback.push('Avoid common patterns and words');
    score -= 2;
  }
  if (hasPersonalInfo) {
    feedback.push('Avoid using personal information');
    score -= 2;
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    feedback.push('This is a commonly used password');
    score = 0;
  }

  // Entropy check
  const uniqueChars = new Set(password.split('')).size;
  const entropy = uniqueChars / password.length;
  if (entropy < 0.5) {
    feedback.push('Use more unique characters');
    score -= 1;
  }

  // Final validation
  const isValid =
    score >= 5 &&
    password.length >= MIN_LENGTH &&
    password.length <= MAX_LENGTH &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChars &&
    !hasRepeatingChars &&
    !hasSequentialChars &&
    !hasCommonPatterns &&
    !hasPersonalInfo &&
    !COMMON_PASSWORDS.has(password.toLowerCase());

  return {
    score: Math.max(0, Math.min(10, score)),
    feedback,
    isValid,
  };
}
