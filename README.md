# KaajerBazar

KaajerBazar is a role-based freelance marketplace built for students and companies in Bangladesh.
It combines skill validation, project matching, escrow-style payments, workspace collaboration, and reputation systems in one platform.

## Vision

Build a trusted student work economy where:
- students prove skills through practical tasks,
- companies hire verified talent with lower risk,
- both sides collaborate with transparent progress and reviews,
- reputation and opportunity grow from real outcomes.

## What This Project Solves

Traditional entry-level hiring is noisy and trust-poor. KaajerBazar addresses this with:
- structured learning-module verification instead of only CV claims,
- company verification before project posting,
- project escrow and milestone tracking,
- double-blind reviews and automated reputation scoring,
- downloadable + publicly verifiable completion certificates.

## Core Features

### 1. Authentication and Role-Based Access
- Email/password registration and Google OAuth onboarding
- Roles: `student`, `company`, `admin`
- Middleware-enforced route guards + API-level role checks

### 2. Student and Company Profiles
- Student profile: username, university, bio, portfolio, avatar
- Company profile: legal name, industry, website, description, avatar
- Public student/company profile pages and searchable directory

### 3. Company Verification Workflow
- Company uploads trade license
- Admin queue for approve/reject with feedback
- Only verified companies can post projects

### 4. Learning Module System (Current Skill System)
- Skill categories + level-based modules (`rookie`, `skilled`, `expert`)
- AI-generated unique project briefs
- Student submissions with text/file support
- Admin review decisions: `pass`, `revision`, `fail`
- Cooldown/lockout rules for repeated failed attempts
- Verified skills stored in `verified_skills`

### 5. Project Marketplace and Applications
- Verified companies create projects
- Students browse/filter open projects and apply with cover note
- Company applicant review and select/reject flow

### 6. Escrow, Workspace, and Deliverables
- Company starts project and locks escrow state
- Workspace chat, milestone tracking, and deliverable submissions
- Company reviews deliverables and releases payment
- Ledger-style records for deposit, release, and commission

### 7. Reviews, Reputation, and Badges
- Double-blind review flow between company and student
- KaajerScore recalculation from performance signals
- Automated marketplace tier badges via `student_badges`

### 8. Notifications and Certificates
- In-app notifications and optional email delivery (Resend)
- Project completion certificates generated as PDF
- Public certificate verification by certificate ID

## High-Level Architecture

- Frontend: Next.js 14 App Router + React
- Backend: Supabase (PostgreSQL, Auth, Storage, Realtime)
- AI: OpenAI SDK with Groq-compatible endpoint for brief generation
- Email: Resend API

Main directories:
- `src/app/` - pages and API routes
- `src/components/` - reusable UI/workspace components
- `src/lib/` - Supabase clients, AI, scoring, badges, notifications
- `supabase/` - schema and migration files
- `tests/` - Node-based API and behavior tests

## Active User Flows

### Student Flow
1. Register/login
2. Complete profile
3. Attempt learning modules and get verified skills
4. Browse projects and submit applications
5. Work in workspace (chat, milestones, deliverables)
6. Receive payment and reviews after completion
7. Download/share certificate

### Company Flow
1. Register/login
2. Complete profile and upload trade license
3. Get admin verification
4. Post projects and review applicants
5. Start project (escrow held)
6. Collaborate in workspace and review deliverables
7. Release payment and leave review

### Admin Flow
1. Review pending company verifications
2. Review learning-module submissions
3. Approve/reject with feedback
4. Monitor dashboard stats and moderation queues

## Tech Stack

- `next` 14.2.35
- `react` 18
- `@supabase/ssr`, `@supabase/supabase-js`
- `openai`
- `resend`
- `pdf-lib`
- `tailwindcss`, `framer-motion`, `lucide-react`

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (DB + Auth + Storage)

## Environment Variables

Create `.env.local` in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI brief generation
GROQ_API_KEY=...
AI_BRIEF_MODEL=llama-3.1-8b-instant
AI_BRIEF_BASE_URL=https://api.groq.com/openai/v1

# Optional notifications
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Apply database schema and migrations in Supabase SQL Editor:
- `supabase/schema.sql`
- Then each migration in `supabase/` (in order)

3. Create required private storage buckets:
- `trade-licenses`
- `module-submissions`
- `project-deliverables`

4. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint

npm run test
npm run test:auth
npm run test:middleware
npm run test:verification
npm run test:phase1
npm run test:phase2
npm run test:skills
```

## API Surface (Selected)

- Auth:
  - `POST /api/auth/register`
  - `GET /api/auth/callback`
  - `POST /api/auth/complete-google-profile`

- Learning Modules:
  - `GET /api/learning/categories`
  - `GET /api/learning/modules/[moduleId]`
  - `POST /api/learning/modules/[moduleId]/start`
  - `POST /api/learning/modules/[moduleId]/submit`
  - `GET /api/admin/learning/queue`
  - `POST /api/admin/learning/submissions/[id]/review`

- Projects and Workspace:
  - `GET/POST /api/projects`
  - `POST /api/applications`
  - `GET/PATCH /api/company/applications`
  - `POST /api/projects/[id]/start`
  - `POST /api/projects/[id]/release`
  - `GET/POST /api/projects/[id]/chat`
  - `GET/POST /api/projects/[id]/deliverables`
  - `PATCH /api/projects/[id]/deliverables/[deliverableId]`
  - `GET/POST/PATCH/DELETE /api/projects/[id]/milestones`

- Certificates and Notifications:
  - `GET /api/projects/[id]/certificate`
  - `GET /api/verify-certificate?id=...`
  - `GET/PATCH /api/notifications`

## Security and Trust Model

- Route and API-level RBAC checks
- Supabase RLS policies for table and storage access
- Service-role client used only on server-side privileged operations
- Signed upload/download URLs for private file buckets
- Double-blind review logic to reduce rating bias

## Testing

This repository uses Node-based tests (not Jest as default framework).
Primary test suites live under `tests/phase1` and `tests/phase3`.

Run the most common suite:

```bash
npm run test:phase1
```

## Deployment Notes

Recommended: Vercel + Supabase.

Before deploy:
- set all environment variables in deployment platform,
- ensure Supabase migrations are applied,
- ensure required buckets and RLS policies are configured,
- run `npm run build` and `npm run lint`.

## Current System Notes

- The active skill workflow is the learning-module system (`learning_modules`, `module_submissions`, `verified_skills`).
- Marketplace tier badges are managed through `student_badges`.
- Legacy endpoints can exist for compatibility, but new development should target active learning-module APIs.

## Additional Documentation

- `SETUP.md` - team onboarding and setup details
- `SYSTEM_DOCUMENTATION.md` - deeper architecture and data model notes
- `TESTING_INSTRUCTIONS.md` and `TEST_GUIDE.md` - testing references
