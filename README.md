# ProofPilot

ProofPilot is a production-style MVP for organizing evidence in consumer complaints and small disputes. Users can create a case, upload supporting files, and generate a structured analysis that renders a timeline, extracted facts, missing evidence list, and complaint draft.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Server Actions and Route Handlers

## Core MVP Features

- Sign up, login, and logout with Supabase Auth
- Dashboard showing all user cases
- Case creation form with dispute metadata
- Case detail page with evidence uploads and file listing
- Local rules-based analysis stored as JSON in the `analyses` table and rendered in polished cards
- Loading states, empty states, and error messaging

## Project Structure

```text
app/
  auth/login, auth/signup  Authentication pages
  dashboard                User case dashboard
  cases/new                Case creation page
  cases/[id]               Case detail page
  api/cases/[id]/evidence  Route handler for file uploads
components/
  cases/                   Analysis and evidence UI
  dashboard/               Dashboard-specific cards
  shared/                  App header, logo, setup notice
  ui/                      Reusable primitives
lib/
  actions/                 Server actions for auth and cases
  constants/               Shared form options
  supabase/                Supabase env, server client, middleware helpers
  types/                   Database and domain types
  auth.ts                  Session helpers
  flash.ts                 Query-string notices
  local-analysis-engine.ts Rules-based local analysis engine
  mock-analysis.ts         Backward-compatible alias to the local engine
  queries.ts               Server-side data queries
supabase/schema.sql        Database schema, RLS policies, and storage bucket
```

## Environment Variables

Create `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These same variables are also listed in `.env.example`.

## Supabase Setup

1. Create a new Supabase project.
2. In the Supabase dashboard, open the SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. In Authentication, enable Email/Password sign-in.
4. Copy your project URL and anon key into `.env.local`.
5. Restart the Next.js dev server after updating env vars.

## Local Analysis Engine

ProofPilot now ships with a zero-cost local rules-based analysis engine. It analyzes the case details plus uploaded evidence metadata such as file names, file types, and file count, then generates:

- a dynamic timeline
- extracted facts
- missing evidence suggestions
- complaint draft text
- evidence strength, urgency, and case readiness scoring

No external AI API key is required for the current analysis flow.

The schema creates:

- `profiles`
- `cases`
- `evidence_files`
- `analyses`
- an `evidence` storage bucket
- row-level security policies for user-scoped access

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## Notes

- File uploads are handled through `app/api/cases/[id]/evidence/route.ts`.
- Auth and case creation use server actions in `lib/actions/`.
- The analysis layer is powered by `lib/local-analysis-engine.ts`.
- The current engine is metadata-driven: it analyzes case details plus uploaded evidence metadata only. Raw PDF or image contents are not processed yet.
- The architecture still keeps the analysis flow modular, so a future LLM backend can be swapped in later without replacing the UI or database flow.
