export function getAuthErrorMessage(error: unknown): string {
  const rawMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const message = rawMessage.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (message.includes('email not confirmed')) {
    return 'This account has not been confirmed. Ask your society administrator.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (message.includes('signups not allowed') || message.includes('user not found')) {
    return 'Could not send a code to that email. Check the address or contact your society administrator.';
  }
  if (
    message.includes('otp') ||
    message.includes('token has expired') ||
    message.includes('invalid token')
  ) {
    return 'The verification code is invalid or has expired. Request a new code.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  return rawMessage || 'Something went wrong. Please try again.';
}
