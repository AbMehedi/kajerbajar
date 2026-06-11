---
name: KaajerBazar
description: Workspace instructions for the KaajerBazar micro-freelancing platform. Use for context on architecture, XP principles, Phase iterations, database schema, and code patterns.
applyTo: ["**/*.{js,jsx,ts,tsx,sql}", "**/route.js", "middleware.js"]
---

# KaajerBazar — Workspace Context

## Project Overview

**KaajerBazar** is a Bangladesh micro-freelancing platform connecting verified students with SME micro-projects. Built with Next.js 14, Supabase, and Anthropic Claude API.

**Mission:** Bridge Bangladesh's skills gap by connecting verified student talent with local SME micro-projects — safely, transparently, and rapidly.

**Core Users:** Students (apply for work) | Companies (post projects) | Admins (verify credentials)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn UI |
| **Backend** | Supabase (PostgreSQL) + Supabase Auth (JWT) |
| **AI** | Anthropic Claude API (claude-sonnet-4) for skill verification & ranking |
| **Hosting** | Vercel + GitHub |
| **No Docker/DevOps** | Serverless-first, BaaS over DIY infrastructure |

## Project Phases (6 Iterations)

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE
- **1.1** User registration + role-specific dashboards (DONE)
- **1.2** Company trade license verification (DONE)

### Phase 2: Skill Verification (Weeks 3-4) 🔄 IN PROGRESS
- **2.1** AI-generated skill briefs (Claude) + student submission UI
- **2.2** Admin badge approval + student notification

### Phase 3: Marketplace (Weeks 5-6)
- **3.1** Company posts micro-projects
- **3.2** Student browses + applies with verified badges

### Phase 4: AI Ranking & Workspace (Weeks 7-8)
- **4.1** KaajerScore ranking (Claude)
- **4.2** Shared workspace + real-time checklist

### Phase 5: Escrow & Payments (Weeks 9-10)
- **5.1** BDT escrow ledger (simulated, not real bKash)
- **5.2** Payment release + 10% commission
- **5.3** Dispute arbitration

### Phase 6: Polish & Pilot (Weeks 11-12)
- Feature freeze at Week 11
- Regression testing + bug fixes only

## XP (Extreme Programming) Rules

**Always follow these:**

| Principle | What It Means |
|-----------|--------------|
| **YAGNI** | Build ONLY what the current story requires. No speculative features. |
| **Simple Design** | Simulated escrow ≠ real money. Build only what passes tests. |
| **Small Releases** | Every 2 weeks = shippable increment. Nothing ships without tests. |
| **Collective Ownership** | All code is team code. Understand every change, especially DB schema. |
| **Sustainable Pace** | No all-nighters. Feature freeze Week 11 → testing only. |
| **Test First (TDD)** | Write test BEFORE code. No code without tests. |

**Out of Scope (never build):**
- ❌ Real bKash / mobile banking
- ❌ SMS / OTP verification
- ❌ Native mobile app
- ❌ Bangla language UI
- ❌ Advanced analytics
- ❌ Public third-party API

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| **users_profiles** | Master user record (student, company, or admin) |
| **student_profiles** | Student-specific fields (university, skills, portfolio, wallet) |
| **company_profiles** | Company-specific fields (legal name, industry, trade license, verified status) |
| **skill_verifications** | Student submits proof for a skill (status: pending → approved/rejected) |
| **badges** | Approved skill badges granted to students by admin |
| **projects** | Company posts micro-project (title, budget, required skills, deadline) |
| **applications** | Student applies to project (cover note, AI match score) |
| **workspaces** | Shared workspace between company & hired student |
| **workspace_tasks** | Real-time task checklist in workspace |
| **workspace_files** | File uploads in workspace (max 10MB) |
| **escrow_ledger** | Simulated BDT ledger (state: Deposited → Held → Released/Disputed) |
| **certificates** | Completion certificates issued to students |

### RBAC (Role-Based Access Control)

- **Users** must have one role: `student`, `company`, or `admin`
- **Middleware.js** enforces RBAC on every request
- **Each role** has specific dashboards & accessible routes

## Code Patterns

### 1. API Routes (Authentication + Authorization)

**Pattern:**
```javascript
// src/app/api/[resource]/[action]/route.js

// 1. Get authenticated user
const { data: { user } } = await supabase.auth.getUser()
if (!user) return 401 Unauthorized

// 2. Verify user role
const { data: profile } = await supabase
  .from('users_profiles')
  .select('role')
  .eq('id', user.id)
  .single()
if (profile?.role !== 'expected_role') return 403 Forbidden

// 3. Validate request
const { field } = body
if (!field) return 400 Bad Request

// 4. Execute business logic
const { data, error } = await supabase
  .from('table')
  .update(data)
  .eq('id', user.id)

// 5. Return response
return NextResponse.json({ success: true, data })
```

**Key:** Always check auth FIRST, then role, then validation. Never mix concerns.

### 2. Server Components (Data Fetching)

```javascript
// src/app/[role]/dashboard/page.jsx

// Use server-side Supabase client for data fetching
const supabase = await createServerSupabaseClient()

// Fetch data with role checks
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase
  .from('users_profiles')
  .select('role')
  .eq('id', user.id)
  .single()
if (profile?.role !== 'expected_role') redirect('/unauthorized')

// Render with data
return <Dashboard data={data} />
```

### 3. Client Components (Interactions)

```javascript
// 'use client' at top

// Use browser Supabase client for file uploads, real-time, mutations
const supabase = createBrowserClient(...)

// Handle form submission → API call
const handleSubmit = async () => {
  const response = await fetch('/api/..', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  const { data, error } = await response.json()
  if (error) setError(error)
  else setSuccess(true)
}
```

### 4. Testing Pattern

```javascript
// tests/phase1/[feature].test.js

// Use plain Node.js (not Jest)
const BASE_URL = 'http://localhost:3000'

// Test helpers
const assert = (condition, label) => {
  if (condition) console.log(green('✓ ' + label))
  else console.log(red('✗ ' + label))
}

async function post(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return { status: res.status, data: await res.json() }
}

// Run tests
assert(status === 401, 'Returns 401 when not authenticated')
assert(error.includes('authenticated'), 'Error message is clear')
```

## JWT & Session Management

### How It Works

1. **User registers** → Supabase creates auth.users entry + JWT
2. **JWT stored** in HTTP-only cookie (secure transport)
3. **Middleware.js** calls `getUser()` on EVERY request
   - Checks if JWT is valid
   - Auto-refreshes if expired (1hr access + 7day refresh)
   - Returns current user
4. **After 7 days** → User must re-login

**Key:** `middleware.getUser()` on every request keeps session fresh. Never manually handle tokens.

## Story Template (For Each Feature)

When building a story, follow this structure:

```
[ CONCEPT ] — What & why (analogy first)
[ TEST FIRST ] — Write tests BEFORE code
[ CODE ] — Full implementation
[ EXPLANATION ] — Walk through code like a mentor
[ VERIFY ] — How to test locally
[ WHAT YOU LEARNED ] — 3-5 key concepts
[ NEXT STEP ] — What's next
```

## Common Commands

```bash
# Development
npm run dev                    # Start dev server on :3000
npm run build                  # Build for production

# Testing
npm run test:auth              # Test Phase 1.1 auth
npm run test:middleware        # Test RBAC middleware
npm run test:verification      # Test Phase 1.2 company verification
npm run test:phase1            # All Phase 1 tests

# Git
git status                      # Check changes
git add .                       # Stage all
git commit -m "feat: [story]"   # Commit with co-author trailer
git push                        # Push to GitHub → Vercel preview
```

## File Structure

```
kaajerbazar/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login/Register pages
│   │   ├── admin/dashboard     # Admin dashboard
│   │   ├── company/dashboard   # Company dashboard
│   │   ├── student/dashboard   # Student dashboard
│   │   ├── api/                # API routes (auth, companies, skills, projects, etc.)
│   │   ├── layout.js           # Root layout
│   │   └── page.js             # Home page
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities (Supabase clients, auth helpers)
│   └── middleware.js           # RBAC middleware + JWT refresh
├── supabase/
│   └── schema.sql              # Database schema (run in SQL Editor)
├── tests/
│   └── phase1/                 # Test files per phase
├── middleware.js               # Auth middleware
└── package.json
```

## When to Use Each Supabase Client

| Client | Use Case | Where |
|--------|----------|-------|
| **Browser (anon key)** | File uploads, real-time listeners | Client components ('use client') |
| **Server (anon key)** | Data fetching in Server Components | page.js, layout.js |
| **Server (service role)** | NEVER EXPOSE. Admin operations only | API routes (read .env.local) |

## Debugging Checklist

- ❓ User sees 401 Unauthorized?
  - Check `.env.local` has real Supabase keys
  - Verify JWT in browser cookies (F12 → Application → Cookies)
  
- ❓ API returns 404?
  - Check route path matches file location (e.g., `/api/auth/register` → `src/app/api/auth/register/route.js`)
  
- ❓ RLS policy error?
  - Run `CREATE POLICY` in Supabase SQL Editor
  - Verify `TO authenticated` includes the user's role
  
- ❓ "describe is not defined" in tests?
  - You're using Jest syntax but project uses plain Node.js
  - Use custom `assert()` function instead
  
- ❓ Changes not showing locally?
  - Kill dev server, restart: `npm run dev`
  - Check schema applied in Supabase
  - Hard-refresh browser (Ctrl+Shift+R)

## Resources

- **Codebase:** `e:\Kaajer_bazar\kaajerbazar`
- **Docs:** `TESTING_INSTRUCTIONS.md`, `TEST_GUIDE.md`, `PHASE_1_VERIFICATION.md`
- **Supabase Skill:** Available at `.agents/skills/supabase-postgres-best-practices/`
- **Project Plan:** Updated in session state as work progresses

---

**Last Updated:** Phase 1.2 Complete (Company Verification)
**Next:** Phase 2.1 (AI Skill Verification with Claude)
