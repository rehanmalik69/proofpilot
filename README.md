# ProofPilot

ProofPilot is a premium evidence-first complaint workspace for consumer disputes and small claims.

Live app: [https://proofpilot-three.vercel.app/](https://proofpilot-three.vercel.app/)

It helps a user turn scattered receipts, screenshots, PDFs, support messages, and notes into a structured case file with:

- a clean timeline
- extracted dispute facts
- missing-evidence recommendations
- a polished complaint draft
- export-ready case summaries

The product is built as a responsive Next.js web app with Supabase for auth, data, and storage, plus a provider-based analysis layer that prefers Groq when configured and safely falls back to ProofPilot's local rules-based engine.

## Live Demo

- Production app: [https://proofpilot-three.vercel.app/](https://proofpilot-three.vercel.app/)
- GitHub repository: [https://github.com/rehanmalik69/proofpilot](https://github.com/rehanmalik69/proofpilot)

## What ProofPilot Does

ProofPilot is designed for the moment after something goes wrong with a purchase or service and the user needs to build a credible complaint record.

Instead of keeping everything in scattered folders and message threads, the app gives the user:

- a dashboard of active complaint files
- a structured case creation flow
- a dedicated case workspace
- secure evidence uploads
- status tracking from draft to resolved
- AI-style analysis without breaking when an API is unavailable

## Demo-Ready Highlights

- Email/password authentication with Supabase Auth
- End-to-end email verification flow with in-app success and recovery screens
- Case dashboard with metrics, recent activity, and one-click demo case creation
- Rich case workspace with premium responsive UI
- Evidence uploads to Supabase Storage
- TXT and PDF evidence text extraction on the server
- Groq-powered structured analysis when configured
- Automatic local-engine fallback when Groq is missing or fails
- Export actions for complaint draft, case summary, and full report
- Case workflow statuses: `Draft`, `Under Review`, `Ready to Submit`, `Submitted`, `Resolved`

## Product Walkthrough

### 1. Landing and Authentication

Users land on a polished startup-style homepage, then sign up or log in with Supabase Auth.

Email verification stays inside ProofPilot:

- signup sends users to `Check your email`
- verification links return to `/auth/callback`
- successful confirmations land on `/auth/verified`
- expired or failed links land on `/auth/verification-error`
- resend actions issue fresh ProofPilot verification links instead of dropping users onto localhost or a blank provider screen

### 2. Dashboard

The dashboard shows:

- total cases
- under review cases
- ready to submit cases
- resolved cases
- recent activity
- `Create New Case`
- `Try Demo Case`

### 3. Create Case

Users create a case with:

- title
- dispute type
- merchant name
- issue description
- transaction amount
- incident date
- status

### 4. Case Workspace

Each case gets a dedicated workspace with:

- case overview
- evidence upload panel
- case status controls
- analysis trigger
- uploaded evidence list
- analysis cards for summary, timeline, facts, missing evidence, and complaint draft

### 5. Analysis Layer

When the user clicks `Analyze Evidence`, ProofPilot:

1. reads the case details
2. loads evidence metadata
3. extracts TXT and PDF text when available
4. tries Groq if `GROQ_API_KEY` is configured
5. falls back to the local analysis engine if Groq is unavailable or fails
6. saves one canonical latest analysis record to Supabase
7. renders the latest saved result back into the workspace

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| File Storage | Supabase Storage |
| Analysis Provider | Groq via OpenAI-compatible SDK |
| Fallback Engine | Local rules-based analysis engine |
| Motion/UI | Framer Motion + custom component system |

## Analysis Providers

ProofPilot currently supports two analysis paths.

### Groq

Used when `GROQ_API_KEY` is present.

- Runs server-side only
- Uses the OpenAI-compatible SDK pattern with Groq's base URL
- Produces structured JSON
- Feeds the existing ProofPilot UI without redesigning the app

### Local Fallback

Used when Groq is not configured or fails.

- Zero-cost
- Rules-based and deterministic
- Uses case details, file metadata, and extracted TXT/PDF content
- Generates summary, timeline, extracted facts, missing evidence, scoring, and complaint draft

### Reliability Behavior

ProofPilot never breaks the user flow if the external provider is unavailable.

- If `GROQ_API_KEY` is missing: local analysis runs
- If Groq errors or times out: local analysis runs
- The saved analysis includes provider and fallback metadata
- The case page always reads the latest saved analysis record

## Environment Variables

Create a `.env.local` file in the project root.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://proofpilot-three.vercel.app
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

### Variable Reference

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase browser anon key |
| `NEXT_PUBLIC_APP_URL` | Recommended for production | Canonical app origin used for auth email redirects |
| `GROQ_API_KEY` | Optional | Enables Groq as the primary analysis provider |
| `GROQ_MODEL` | Optional | Overrides the default Groq model |

If `GROQ_API_KEY` is omitted, ProofPilot still works using the local engine.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Add the environment variables shown above.

### 3. Create a Supabase project

In Supabase:

1. create a new project
2. enable Email/Password auth
3. open the SQL editor
4. run [`supabase/schema.sql`](./supabase/schema.sql)
5. add your app domain to the Supabase Auth URL configuration
6. make sure verification emails return to your ProofPilot domain

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Demo Flow

For a hackathon or judging demo:

1. sign in
2. open the dashboard
3. click `Try Demo Case`
4. open the generated case
5. show the evidence file
6. run `Re-analyze`
7. show provider badge, timeline, extracted facts, missing evidence, and complaint draft
8. use export actions to download or copy outputs

This gives a presentation-ready path without needing manual sample data.

## Case Status Workflow

ProofPilot supports these case states:

- `Draft`
- `Under Review`
- `Ready to Submit`
- `Submitted`
- `Resolved`

The case workspace allows users to update the status directly as they prepare the dispute for escalation.

## Evidence Support

Current supported upload categories:

- images
- PDFs
- text files

Current server-side extraction support:

- `.txt`
- `.pdf`

Evidence records are stored in the `evidence-files` bucket and linked back to the owning case and user.

## Project Structure

```text
app/
  auth/
    callback/
    check-email/
    login/
    signup/
    verification-error/
    verified/
  dashboard/
  cases/
    new/
    [id]/
  api/
    cases/[id]/evidence/

components/
  cases/
  dashboard/
  marketing/
  shared/
  ui/

lib/
  actions/
  constants/
  supabase/
  types/
  analysis-provider.ts
  analysis-storage.ts
  analysis-summary.ts
  analysis-transform.ts
  auth.ts
  evidence-text.ts
  flash.ts
  local-analysis-engine.ts
  local-analysis-language.ts
  queries.ts
  utils.ts

supabase/
  schema.sql
```

## Important Files

| File | Responsibility |
|---|---|
| `app/auth/callback/route.ts` | Handles Supabase verification redirects and exchanges auth tokens for a session |
| `app/auth/verified/page.tsx` | Success screen after email verification |
| `app/auth/verification-error/page.tsx` | Recovery screen for expired or failed verification links |
| `app/cases/[id]/page.tsx` | Main case workspace |
| `lib/actions/cases.ts` | Case creation, demo case creation, analysis execution, status updates |
| `lib/actions/auth.ts` | Login, signup, resend verification, recheck verification, logout |
| `lib/auth-url.ts` | Builds the canonical app-origin verification callback URLs |
| `lib/queries.ts` | Dashboard and case data reads |
| `lib/analysis-provider.ts` | Groq-first provider orchestration with local fallback |
| `lib/analysis-storage.ts` | Canonical read/write format for persisted analyses |
| `lib/local-analysis-engine.ts` | Local rules-based analysis engine |
| `lib/evidence-text.ts` | TXT and PDF text extraction |
| `components/cases/analysis-output.tsx` | Analysis rendering and export actions |
| `components/cases/evidence-upload-panel.tsx` | Evidence upload UX |

## Database Schema

The Supabase schema creates these core tables:

- `profiles`
- `cases`
- `evidence_files`
- `analyses`

It also creates:

- an `evidence-files` storage bucket
- row-level security policies for user-scoped access
- updated-at triggers for mutable tables

## How Analysis Persistence Works

ProofPilot now uses a canonical latest-analysis storage flow.

- Each case should resolve to one current analysis record
- Re-analyze updates the latest record for that case
- Duplicate rows are cleaned up if they exist
- The case page reads the newest saved analysis deterministically
- Legacy analysis JSON shapes are normalized before rendering

This prevents stale saved summaries from masking newer results.

## UX and Product Design Notes

The UI direction is intentionally closer to a premium legal-tech / AI SaaS product than a raw CRUD dashboard.

The design system emphasizes:

- high-contrast CTAs
- rounded premium cards
- responsive app-like layouts
- polished empty states
- startup-style landing page presentation
- strong desktop and mobile workspace usability

## Current Limitations

- Raw image understanding is not part of the current analysis pipeline
- PDF support is text-extraction based, so scanned PDFs may produce limited results
- The project may hit a Next.js webpack cache issue on some Windows environments during `npm run build`

## Windows Build Note

If `next build` fails with webpack cache restore errors such as `Unexpected end of stream`, try:

1. stopping all running Next.js processes
2. deleting the `.next` folder
3. rerunning `npm run build`

This is an environment/cache issue rather than a ProofPilot source-level feature limitation.

## Future Extensions

Natural next steps for the product:

- OCR for image-heavy evidence
- richer PDF parsing
- filing templates for banks or regulators
- multi-provider LLM selection
- collaborative review workflows
- generated submission packets

## Summary

ProofPilot is not just a case tracker. It is an evidence organization and complaint-generation workspace built to feel credible in front of hackathon judges, demo audiences, and real users. It combines practical dispute management, clean product UX, and resilient analysis behavior so the app remains useful even when no external AI provider is available.
