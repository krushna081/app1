import { SUPABASE_URL, SUPABASE_ANON_KEY, RESEND_API_KEY } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const ENV = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  RESEND_API_KEY: RESEND_API_KEY || '',
} as const;
