import test from 'node:test';
import assert from 'node:assert/strict';
import { getRegexValidationState } from './regexHelpers.js';

test('returns no validation state when no pattern or sample is provided', () => {
  assert.equal(getRegexValidationState('', ''), null);
});

test('returns invalid state for malformed regex', () => {
  assert.equal(getRegexValidationState('(', 'abc').status, 'invalid');
});

test('returns valid state for a matching regex', () => {
  assert.deepEqual(getRegexValidationState('^PROJ-\\d{4}$', 'PROJ-1234'), {
    status: 'valid',
    message: '✓ Matches the sample text.',
  });
});

test('returns mismatch state for a non-matching regex', () => {
  assert.deepEqual(getRegexValidationState('^PROJ-\\d{4}$', 'EMP-4821'), {
    status: 'mismatch',
    message: '✕ This pattern does not match the sample text.',
  });
});
