import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authErrors';

describe('getAuthErrorMessage', () => {
  it('maps invalid credentials without leaking provider wording', () => {
    expect(getAuthErrorMessage(new Error('Invalid login credentials'))).toBe(
      'Invalid email or password.',
    );
  });

  it('maps expired OTP errors', () => {
    expect(getAuthErrorMessage(new Error('Token has expired or is invalid'))).toBe(
      'The verification code is invalid or has expired. Request a new code.',
    );
  });

  it('maps rate limits', () => {
    expect(getAuthErrorMessage(new Error('Too many requests'))).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
  });

  it('maps disabled signups without echoing the provider message', () => {
    expect(getAuthErrorMessage(new Error('Signups not allowed for otp'))).toBe(
      'Could not send a code to that email. Check the address or contact your society administrator.',
    );
  });

  it('keeps an unexpected message for diagnostics', () => {
    expect(getAuthErrorMessage(new Error('Custom failure'))).toBe('Custom failure');
  });

  it('has a fallback for empty errors', () => {
    expect(getAuthErrorMessage(null)).toBe('Something went wrong. Please try again.');
  });
});
