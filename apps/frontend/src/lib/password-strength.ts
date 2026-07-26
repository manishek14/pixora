// Lightweight password strength evaluator.
// Returns a score 0-4 plus a key for i18n label and a hex color.
// No external deps — just regex checks. Used by the register page meter.

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: PasswordStrengthLevel; // 0 = empty/invalid, 4 = strong
  labelKey: 'password.veryWeak' | 'password.weak' | 'password.medium' | 'password.strong' | 'password.veryStrong';
  color: string; // hex color for the meter bar
  passed: { length: boolean; lower: boolean; upper: boolean; digit: boolean; special: boolean };
  isAcceptable: boolean; // true when score >= 3 (meets backend requirements)
}

export function evaluatePassword(pw: string): PasswordStrength {
  const passed = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };

  // Count how many of the 5 checks passed (length counts as 1, each category as 1)
  const passedCount =
    Number(passed.length) +
    Number(passed.lower) +
    Number(passed.upper) +
    Number(passed.digit) +
    Number(passed.special);

  let score: PasswordStrengthLevel;
  if (pw.length === 0) score = 0;
  else if (passedCount <= 2) score = 1;
  else if (passedCount === 3) score = 2;
  else if (passedCount === 4) score = 3;
  else score = 4; // all 5 checks pass

  // Backend requires all 4 character classes + 8 char minimum, so "acceptable" needs score 4
  // (length + all 4 categories) OR score 3 if length is 8+ but missing only one weak category.
  // To keep it simple and aligned with the backend regex, require ALL 5 checks.
  const isAcceptable =
    passed.length && passed.lower && passed.upper && passed.digit && passed.special;

  const labelMap = {
    0: 'password.veryWeak',
    1: 'password.veryWeak',
    2: 'password.weak',
    3: 'password.medium',
    4: 'password.strong',
  } as const;

  const colorMap = {
    0: '#6b7280', // gray-500
    1: '#ef4444', // red-500
    2: '#f59e0b', // amber-500
    3: '#eab308', // yellow-500
    4: '#22c55e', // green-500
  } as const;

  return {
    score,
    labelKey: labelMap[score],
    color: colorMap[score],
    passed,
    isAcceptable,
  };
}
