export const COMMON_REGEX_SCENARIOS = [
  {
    id: 'email',
    label: 'Email address',
    pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
    example: 'name@example.com',
    note: 'Matches common email formats.',
  },
  {
    id: 'phone',
    label: 'Phone number',
    pattern: '\\+?\\d[\\d -]{7,14}',
    example: '+1 555-123-4567',
    note: 'Catches compact phone numbers.',
  },
  {
    id: 'digits',
    label: '4-digit code',
    pattern: '\\d{4}',
    example: '4821',
    note: 'Useful for PINs or verification codes.',
  },
  {
    id: 'letters',
    label: 'Uppercase ID',
    pattern: '^[A-Z]{2,6}$',
    example: 'ABCD12',
    note: 'Matches uppercase letter-only identifiers.',
  },
];

export function getRegexValidationState(pattern, sample) {
  if (!pattern?.trim() || !sample?.trim()) {
    return null;
  }

  try {
    const matcher = new RegExp(pattern);
    return matcher.test(sample)
      ? { status: 'valid', message: '✓ Matches the sample text.' }
      : { status: 'mismatch', message: '✕ This pattern does not match the sample text.' };
  } catch {
    return { status: 'invalid', message: '✕ Regex is invalid. Check the pattern syntax.' };
  }
}
