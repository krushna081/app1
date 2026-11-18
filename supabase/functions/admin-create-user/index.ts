import { createClient } from 'jsr:@supabase/supabase-js@2';

type CreateAccountBody = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  role?: unknown;
  flatId?: unknown;
};

const ALLOWED_ROLES = new Set(['guard', 'resident']);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Supabase function environment is incomplete');
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  let body: CreateAccountBody;
  try {
    body = (await request.json()) as CreateAccountBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const email = readString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = readString(body.fullName);
  const role = readString(body.role);
  const flatId = body.flatId === null || body.flatId === undefined ? null : readString(body.flatId);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Enter a valid email address' }, 400);
  }
  if (password.length < 8 || password.length > 72) {
    return jsonResponse({ error: 'Password must be between 8 and 72 characters' }, 400);
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return jsonResponse({ error: 'Full name must be between 2 and 120 characters' }, 400);
  }
  if (!ALLOWED_ROLES.has(role)) {
    return jsonResponse({ error: 'Only guard and resident accounts can be created' }, 400);
  }
  if (role === 'resident' && !flatId) {
    return jsonResponse({ error: 'A flat is required for resident accounts' }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, society_id')
    .eq('id', user.id)
    .single();

  if (profileError || !callerProfile) {
    return jsonResponse({ error: 'Profile not found' }, 403);
  }
  if (callerProfile.role !== 'admin' || !callerProfile.society_id) {
    return jsonResponse({ error: 'Only society admins may create accounts' }, 403);
  }

  const societyId = callerProfile.society_id as string;

  if (role === 'resident') {
    const { data: flat, error: flatError } = await adminClient
      .from('flats')
      .select('id, society_id')
      .eq('id', flatId)
      .single();

    if (flatError || !flat || flat.society_id !== societyId) {
      return jsonResponse({ error: 'Flat not found in your society' }, 400);
    }
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    console.error('Could not create auth user', createError);
    return jsonResponse({ error: 'Could not create account' }, 400);
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from('profiles')
    .update({
      role,
      society_id: societyId,
      flat_id: role === 'resident' ? flatId : null,
    })
    .eq('id', created.user.id)
    .select('id')
    .single();

  if (updateError || !updatedProfile) {
    console.error('Could not assign profile', updateError);
    await adminClient.auth.admin.deleteUser(created.user.id);
    return jsonResponse({ error: 'Could not assign account' }, 500);
  }

  return jsonResponse({
    user: {
      id: created.user.id,
      email: created.user.email,
      role,
    },
  });
});
