# SecureGate

Smart Visitor Management for Modern Societies.

## Tech Stack

- **Framework:** React Native (Expo SDK 51)
- **Language:** TypeScript
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Navigation:** React Navigation (Stack)
- **State Management:** TanStack React Query v5
- **Forms:** react-hook-form + Zod

## Platforms

iOS, Android, Web

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project

## Environment Variables

Create a `.env` file in the root:

```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=your_resend_key # optional
```

## Getting Started

```bash
npm install
npm start
```

Launch on specific platform:

```bash
npm run android
npm run ios
npm run web
```

## User Roles

| Role     | Capabilities |
| -------- | ------------ |
| **Guard** | Capture visitor photos, log entries, track real-time status |
| **Resident** | View visitors for their flat, approve/reject requests |
| **Admin** | Dashboard stats, create guard/resident accounts |

## Database Schema

- **profiles** — user accounts with role (guard/resident/admin)
- **societies** — residential complexes
- **flats** — units within a society
- **visitors** — visitor logs with status (pending/approved/rejected/entered/exited)
- **visitor_status_history** — audit trail for status changes

## Project Structure

```
src/
├── components/   # Reusable UI components
├── config/       # Environment configuration
├── context/      # Auth context provider
├── hooks/        # Custom React hooks (useAuth, useVisitors)
├── lib/          # Supabase client
├── navigation/   # Role-based navigators
├── screens/      # Screen components by role
├── services/     # API services (auth, visitors, profiles, etc.)
├── theme/        # Colors, spacing, typography, shadows
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```
