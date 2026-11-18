# Security Notes

SecureGate handles visitor names, visitor photos, flat assignments, and entry/exit
records. Treat the Supabase project, SMTP provider, Edge Function, and EAS account as
production systems even during a pilot.

## Reporting

Do not open a public issue for a suspected vulnerability that includes credentials,
visitor data, or an exploitable step-by-step. Use the repository's private security
advisory flow, or contact the repository owner through the private channel they provided.

## Secrets

The following must never be committed or placed in the mobile bundle:

- `SUPABASE_SERVICE_ROLE_KEY`
- SMTP/email-provider API keys
- Supabase database passwords
- EAS credentials or keystores
- Apple/Google signing secrets

The only client-side configuration is:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

`EXPO_PUBLIC_*` values are public after bundling. Security comes from RLS, not from hiding
the anon key. The service-role key is used only by the `admin-create-user` Edge Function,
where Supabase injects it at runtime.

## Authorization model

- New auth users receive a `profiles` row with the fixed role `resident`; the trigger
  ignores any role in client metadata.
- After bootstrap, the admin Edge Function is the only application path that assigns
  `guard`, `resident`, or `admin` roles and society/flat membership. The first admin is
  promoted manually in SQL by the database owner.
- Clients have no insert/update policy on `visitors`. Creation and status changes go
  through RPCs that validate the caller's role, society, flat, current status, and target
  status.
- Admins can create accounts only inside their own society. Residents can read only their
  own profile, visitors for their assigned flat, and history for those visitors.
- Guards can read visitors within their society. Admins can read visitors and profiles
  within their society. Guards cannot enumerate resident profiles.
- Storage is private. Object names are `<society-id>/<file>`, uploads are limited to
  guards in that society, and reads require an RLS-authorized visitor-photo lookup.

## Session storage

- Native: `expo-secure-store`, with chunking for session payloads that exceed the
  secure-store item limit.
- Web: AsyncStorage because SecureStore is not available in a browser. A stolen browser
  profile can expose the web session; use the web build with that limitation in mind.

## Operational checklist

- Disable public signups in Supabase Auth settings. Admin provisioning uses the Admin API
  and still works.
- Use a fresh Supabase project for this schema. The migration intentionally refuses a
  legacy schema that still has `flats.resident_id` or `visitors.photo_url`.
- Enable email OTP and change the Supabase Magic Link template to include `{{ .Token }}`.
- Restrict or monitor the `admin-create-user` function logs; they can contain provider
  error details.
- Keep the `visitor-photos` bucket private. Do not add a public-read policy.
- Rotate the service-role key immediately if it is ever pasted into a client file, issue,
  or log.
- Use EAS credentials scoped to the project. Do not commit keystores.
- Before production, test the RLS matrix with guard, resident, admin, and unauthenticated
  sessions in a staging Supabase project.

## Known limitations

- Password recovery requires a working SMTP/email provider and the OTP template change.
- Visitor photos are protected by RLS and signed URLs, but not end-to-end encrypted.
- Realtime delivery is best effort; the app also supports pull-to-refresh.
- The web build is a convenience client, not the primary hardened deployment.
- There is no automated RLS test harness in this repository. The SQL is designed for a
  staging review before production data is added.

## Dependency audit

`npm audit` currently reports transitive advisories in Expo/Metro build tooling, mainly
`picomatch` and `minimatch` denial-of-service issues. These paths are used to resolve and
watch files during development and bundling, not to parse visitor input in the running
app. There is no patched `picomatch` release in the current dependency range. Do not run
`npm audit fix --force`: it proposes downgrading Expo/React Native. Recheck the audit
after each Expo SDK update.
