# SecureGate

Visitor management for a single residential society, built with Expo and Supabase.

The mobile client is a thin, untrusted client. Authorization is enforced in Postgres
row-level security policies and in a server-side Supabase Edge Function; the app never
contains a service-role key.

## Stack

- Expo SDK 58 / React Native 0.88 / React 19
- TypeScript (strict)
- Supabase Auth, Postgres, Realtime, and private Storage
- React Navigation stack
- TanStack Query
- react-hook-form and Zod
- Vitest for unit tests

## Roles and flow

| Role     | Access                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Guard    | Creates a visitor record with a photo, selects the flat, and marks approved visitors as entered/exited |
| Resident | Sees visitors for their own flat and approves or rejects pending visits                                |
| Admin    | Creates guard and resident accounts, sees current counts for today's visitors and guard accounts       |

Only an administrator can create accounts. There is no public signup in the app.

Visitor status transitions are validated in the database:

```text
pending -> approved | rejected       (resident, own flat only)
approved -> entered                  (guard, own society only)
entered -> exited                    (guard, own society only)
```

Every transition is written to `visitor_status_history`.

## Prerequisites

- Node.js 22.13 or newer
- npm
- A Supabase project
- An Expo/EAS account if you want to build installable Android/iOS binaries

## Environment

Copy `.env.example` to `.env` and fill in the public Supabase values:

```bash
cp .env.example .env
```

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values are embedded in the client by Expo. The anon key is public by design; RLS is
what protects the data. Never put `SUPABASE_SERVICE_ROLE_KEY`, an email-provider key, or any
other server secret in the mobile environment.

## Supabase setup

The migration targets a **fresh** Supabase project. It intentionally refuses to modify the
original permissive schema because that schema stored `photo_url` as a public URL and used
`flats.resident_id` as the resident link.

### 1. Apply the database migration

Run [`supabase/migrations/20261118000100_securegate_init.sql`](supabase/migrations/20261118000100_securegate_init.sql)
in the Supabase SQL Editor, or apply it with the Supabase CLI:

```bash
supabase init
supabase link --project-ref <project-ref>
supabase db push
```

The migration creates:

- `societies`, `flats`, `profiles`, `visitors`, `visitor_status_history`
- RLS policies scoped by society and flat
- `create_visitor` and `update_visitor_status` RPCs with server-side transition checks
- A private `visitor-photos` bucket
- Storage policies that scope photo paths to `<society-id>/<file>`
- The auth trigger that creates a resident profile with no role supplied by the client

### 2. Configure email OTP and disable public signup

Password recovery uses `signInWithOtp`, so Supabase must send a numeric token:

1. In Supabase Dashboard, open **Authentication -> Providers -> Email** and ensure the
   email provider is enabled and SMTP is configured for your pilot.
2. Open **Authentication -> Settings** and turn off public signups. Admin-created accounts
   use the service-role Admin API and still work; the public `signUp` endpoint does not.
3. Open **Authentication -> Email Templates -> Magic Link** and include the OTP token in
   the body, for example:

   ```html
   <p>Your SecureGate verification code is <strong>{{ .Token }}</strong>.</p>
   <p>This code expires shortly. If you did not request it, ignore this email.</p>
   ```

   You can remove the confirmation link from this template if the app is the only client.

4. Set a short OTP expiry (5-10 minutes) in the Auth settings.

Without the `{{ .Token }}` template change, the email can contain only a link and the
in-app 6-digit code screen will not work.

### 3. Deploy the admin Edge Function

```bash
supabase functions deploy admin-create-user
```

The function verifies the caller's access token, loads the caller's profile with the
service-role client, requires `role = 'admin'` and a `society_id`, validates the flat
against that society, creates the auth user, and assigns the guard/resident profile.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by the
Supabase Edge runtime. `APP_ORIGIN` is optional and only controls CORS; leave it unset
during local development if needed.

The service-role key must never be added to `.env`, `app.json`, Expo public variables, or
the React Native bundle.

### 4. Bootstrap the first administrator

The migration does not seed fake users or IDs. Create the first user manually:

1. Create a confirmed user in **Authentication -> Users**.
2. Insert the society and promote the profile:

   ```sql
   insert into public.societies (name, address)
   values ('Your Society', 'Your address')
   returning id;

   update public.profiles
   set role = 'admin', society_id = '<society-uuid>'
   where email = '<admin-email>';
   ```

3. Add flats:

   ```sql
   insert into public.flats (flat_number, society_id)
   values ('A-101', '<society-uuid>'), ('A-102', '<society-uuid>');
   ```

4. Sign in as the administrator and create guards and residents from the app.
   The temporary password should be shared privately. The new user can sign out
   and use **Forgot Password** on the sign-in screen to set their own password.

## Run locally

```bash
npm ci
npm start
```

Platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run export:web
```

`npm run export:web` writes a single-page web build to `dist/`.

## Installable builds

The repository includes `app.json` and `eas.json` with a preview profile. The placeholder
bundle/package identifier is `com.securegate.app`; change it before publishing to a store
if you own a different identifier.

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

EAS Build does not upload your gitignored `.env` file. Set
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS environment
variables for the build profile (or in an untracked local `eas.json` `env` block) before
building. These are public client values; never add the service-role key.

For iOS, use `--platform ios` and the same profile. EAS project linking is intentionally
not committed because it is account-specific.

## Security model

- Accounts are provisioned by an administrator. Removed: public signup, client-supplied
  role selection, and guard self-registration. Disable public signups in the Supabase Auth
  settings so the signup endpoint cannot be called outside the app either.
- Profile role and society fields are not writable by clients. Residents may update only
  their own display name.
- Visitors cannot be inserted or updated directly by the client. `create_visitor` and
  `update_visitor_status` are `SECURITY DEFINER` functions with explicit role, society,
  flat, and transition checks.
- Visitor photos are stored in a private bucket. The app requests short-lived signed URLs
  (5 minutes) after an RLS-authorized read.
- Native sessions are stored with `expo-secure-store`, split into chunks when needed.
  Web uses AsyncStorage because SecureStore is not available in browsers.
- Realtime subscriptions are scoped by society or flat and remain subject to RLS.
- Admin statistics are queried from Supabase. There are no hard-coded dashboard numbers.

See [`SECURITY.md`](SECURITY.md) for operational notes and known limitations.

## Limitations

- This is a single-society pilot design. Multi-society onboarding is not exposed in the UI.
- Password recovery requires the Supabase email OTP template described above.
- Web sessions use browser storage; treat the web build as an administrative convenience,
  not the primary hardened deployment.
- Visitor photos are private at rest and in transit through Supabase, but the current
  implementation does not add end-to-end encryption or device-side photo encryption.
- The app has no push notifications. The guard terminal and resident list use Supabase
  Realtime and pull-to-refresh.
- Live deployment, SMTP, Edge Function secrets, and EAS credentials are the operator's
  responsibility.

## Project structure

```text
App.tsx
src/
  components/       reusable UI and form controls
  config/           public environment validation
  context/          auth and password-recovery state
  hooks/            query and auth hooks
  lib/              Supabase client and secure session storage
  navigation/       role-based navigators
  screens/          auth, admin, guard, resident
  services/         auth, admin, visitors, flats, storage, realtime
  theme/            colors, spacing, typography, shadows
  types/            database and domain types
  utils/            error mapping and tests
supabase/
  migrations/       secure schema and RLS
  functions/        admin-create-user Edge Function
```
