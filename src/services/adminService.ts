import { supabase } from '../lib/supabase';

export interface AdminStats {
  visitorsToday: number;
  guards: number;
}

type CreateAccountResponse = {
  error?: string;
  user?: {
    id: string;
    email?: string;
    role: string;
  };
};

async function readFunctionError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context;
    if (context && typeof context === 'object' && 'json' in context) {
      try {
        const body = (await (context as { json: () => Promise<unknown> }).json()) as {
          error?: string;
        };
        if (body.error) return body.error;
      } catch {
        // Fall through to the safe generic message.
      }
    }
  }

  return 'Could not create the account. Check the function logs and try again.';
}

export const adminService = {
  async createAccount(input: {
    fullName: string;
    email: string;
    password: string;
    role: 'guard' | 'resident';
    flatId: string | null;
  }): Promise<CreateAccountResponse> {
    const { data, error } = await supabase.functions.invoke<CreateAccountResponse>(
      'admin-create-user',
      { body: input },
    );

    if (error) throw new Error(await readFunctionError(error));
    if (!data) throw new Error('The server returned an empty response.');
    if (data.error) throw new Error(data.error);

    return data;
  },

  async getStats(): Promise<AdminStats> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [visitorsResult, guardsResult] = await Promise.all([
      supabase
        .from('visitors')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'guard'),
    ]);

    if (visitorsResult.error) throw visitorsResult.error;
    if (guardsResult.error) throw guardsResult.error;

    return {
      visitorsToday: visitorsResult.count ?? 0,
      guards: guardsResult.count ?? 0,
    };
  },
};
