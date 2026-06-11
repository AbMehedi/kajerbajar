# KaajerBazar — Setup Guide for New Team Members

**Last Updated:** After Phase 1.2 (Company Verification)  
**Status:** Foundation complete, ready for Phase 2  
**Team Size:** Scalable for 2-5 engineers

---

## 🚀 First-Time Setup (5 minutes)

### 1. Clone and Install
```bash
git clone https://github.com/yourteam/kaajerbazar.git
cd kaajerbazar
npm install
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env.local

# Add your Supabase credentials to .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...  # For admin-only API routes
```

Get keys from: **Supabase Dashboard → Settings → API Keys**

### 3. Apply Database Schema
```bash
# Open Supabase SQL Editor (https://app.supabase.com → SQL Editor)

# 1. Copy entire contents of supabase/schema.sql
# 2. Paste into SQL Editor
# 3. Click "Run"

# 4. Then run migrations in order:
# supabase/migrations/001_phase1_auth.sql
# supabase/migrations/002_company_verification.sql
```

### 4. Create Storage Bucket
In Supabase Dashboard → Storage:
1. Click "Create bucket"
2. Name: `trade-licenses`
3. Public: **OFF** (private)
4. Click "Create bucket"

### 5. Start Development
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Run Tests
```bash
npm run test:phase1
```

Expected output:
```
✓ Story 1.1: User registration and dashboards
✓ Story 1.2: Company trade license verification
Results: 29 passed, 0 failed
```

---

## 📋 What's Already Built (Phase 1)

### Story 1.1: Auth + Dashboards ✅
- User registration (student, company, admin)
- JWT-based authentication
- RBAC middleware protecting routes
- Role-specific dashboards
- 13 automated tests

**Test it:**
```bash
npm run test:auth
```

### Story 1.2: Company Verification ✅
- Companies upload trade licenses
- Admin verifies/rejects in queue
- Real-time status updates
- 8 automated tests

**Test it:**
```bash
npm run test:verification
```

---

## 🎯 Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│            Browser (Next.js 14 App Router)          │
├─────────────────────────────────────────────────────┤
│  /admin/dashboard    /company/dashboard             │
│  Login → Verify Role → Fetch Data → Render          │
└────────────────┬────────────────────────────────────┘
                 │ Supabase Client (anon key)
                 │ HTTP + JWT (HTTP-only cookies)
                 ▼
┌─────────────────────────────────────────────────────┐
│         Supabase Backend (PostgreSQL)               │
├─────────────────────────────────────────────────────┤
│  Auth Tokens    │    Database    │    Storage       │
│  JWT + Refresh  │  12 Tables +   │  Buckets with    │
│  Sessions       │  RLS Policies  │  RLS Policies    │
└─────────────────────────────────────────────────────┘
```

**Flow:**
1. User registers → Supabase creates JWT
2. Every request includes JWT in HTTP-only cookie
3. Middleware verifies JWT, auto-refreshes if needed
4. User can access role-specific data/endpoints

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Can See | Can Do |
|------|----------|--------|
| **student** | Student dashboard, skill verification queue, marketplace | Submit skills, apply for projects, work in workspace |
| **company** | Company dashboard, applicants, workspace | Upload trade license, post projects, review applications |
| **admin** | Admin dashboard | Verify companies, grant skill badges, arbitrate disputes |

**How it works:** Every API route checks `users_profiles.role` (line 1 of auth check).

---

## 📊 Database Schema (Phase 1 Complete)

### Tables Created

| Table | Columns | Purpose |
|-------|---------|---------|
| **users_profiles** | id, role, email, full_name, avatar_url, created_at | Master record for all users |
| **student_profiles** | id, username, university, bio, skills[], portfolio_url, wallet_balance, kaajerscore, completion_rate | Student data |
| **company_profiles** | id, legal_name, industry, **trade_license_url**, **verification_status**, **verified_by**, **verified_at** | Company data + Story 1.2 verification fields |
| **skill_verifications** | id, student_id, skill_category, ai_brief, submission_text, submission_file_url, status, admin_feedback, created_at | Student skill proofs (Phase 2) |
| **badges** | id, student_id, skill_tag, granted_at | Approved skill badges |
| **projects** | id, company_id, title, description, required_skills[], budget_bdt, deadline, status, escrow_status, created_at | Micro-projects (Phase 3) |
| **applications** | id, project_id, student_id, cover_note, status, created_at | Student applications (Phase 3) |
| **workspaces** | id, project_id, student_id, company_id, created_at | Shared workspace (Phase 4) |
| **workspace_tasks** | id, workspace_id, title, completed, updated_at | Real-time checklist (Phase 4) |
| **workspace_files** | id, workspace_id, uploader_id, file_url, size, uploaded_at | File uploads (Phase 4) |
| **escrow_ledger** | id, project_id, event_type, amount_bdt, from_party, to_party, created_at | BDT ledger (Phase 5, simulated) |
| **certificates** | id, project_id, student_id, pdf_url, issued_at | Completion certs |

**Story 1.2 additions to `company_profiles`:**
```sql
ALTER TABLE company_profiles ADD COLUMN trade_license_url TEXT;
ALTER TABLE company_profiles ADD COLUMN verification_status TEXT DEFAULT 'not_submitted';
ALTER TABLE company_profiles ADD COLUMN verification_feedback TEXT;
ALTER TABLE company_profiles ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE company_profiles ADD COLUMN verified_by UUID;
ALTER TABLE company_profiles ADD COLUMN license_uploaded_at TIMESTAMPTZ;
```

---

## 🧪 Testing Guidelines

### Test Structure
- **Plain Node.js** (NOT Jest)
- Custom `assert()` function for assertions
- Tests hit live API on localhost:3000

### Run Tests
```bash
npm run test:phase1          # All Phase 1 tests (21 total)
npm run test:auth            # Story 1.1 auth tests (13)
npm run test:middleware      # RBAC tests (8)
npm run test:verification    # Story 1.2 verification (8) 
node tests/phase1/[file].test.js  # Single test file
```

### Test Pattern
```javascript
const assert = (condition, label) => {
  if (condition) {
    console.log('\x1b[32m✓ ' + label + '\x1b[0m')
  } else {
    console.log('\x1b[31m✗ ' + label + '\x1b[0m')
  }
}

async function post(path, body) {
  const res = await fetch('http://localhost:3000' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return { status: res.status, data: await res.json() }
}

// Run test
const { status } = await post('/api/endpoint', {})
assert(status === 401, 'Returns 401 when not authenticated')
```

---

## 🛠️ Common Commands

### Development
```bash
npm run dev          # Start on localhost:3000
npm run build        # Build for production
npm start            # Run prod build
npm run lint         # Run ESLint
npm run lint --fix   # Auto-fix linting
```

### Testing
```bash
npm run test:phase1                            # All Phase 1 (21 tests)
npm run test:auth                              # Phase 1.1 auth tests
npm run test:middleware                        # RBAC tests  
npm run test:verification                      # Phase 1.2 verification
node tests/phase1/company-verification.test.js # Single file
```

### Git & Deploy
```bash
git status                   # Check changes
git add .                    # Stage all
git commit -m "feat: [story] - [description]"  # Commit
git push origin main         # Push → Vercel preview
```

---

## 📁 Key Files & Directories

| Path | Purpose |
|------|---------|
| **src/middleware.js** | RBAC + JWT refresh (runs on EVERY request) |
| **src/app/api/** | API endpoints (must follow Pattern 1 below) |
| **src/app/[role]/dashboard/page.jsx** | Role-specific dashboards |
| **supabase/schema.sql** | Initial DB schema |
| **supabase/migrations/** | Schema changes per phase |
| **tests/phase1/** | Automated tests (21 total) |
| **copilot-instructions.md** | THIS FILE (context for AI agent) |
| **.env.local** | Secrets (NOT in git, create from .env.example) |

---

## 🎓 Code Patterns (MUST Follow)

### Pattern 1: API Route
```javascript
// src/app/api/[resource]/[action]/route.js
// ALWAYS: Auth → Role → Validate → Execute → Return

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createServerSupabaseClient()
  
  // 1️⃣ Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  
  // 2️⃣ Authorize (check role)
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'expected_role') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3️⃣ Validate
  const { field } = await request.json()
  if (!field) return NextResponse.json({ error: 'Missing field' }, { status: 400 })
  
  // 4️⃣ Execute
  const { data, error } = await supabase
    .from('table')
    .update({ field })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // 5️⃣ Return
  return NextResponse.json({ success: true, data })
}
```

### Pattern 2: Server Component (Data Fetch)
```javascript
// src/app/[role]/dashboard/page.jsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient()
  
  // Verify auth + role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'expected_role') redirect('/unauthorized')
  
  // Fetch data
  const { data: stats } = await supabase.from('table').select('*')
  
  // Render
  return <div>Dashboard: {stats.length} items</div>
}
```

### Pattern 3: Client Component (Interactive)
```javascript
'use client'  // ← Must be first line

// src/app/[role]/Component.jsx
import { useState } from 'react'

export default function Component() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleAction = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify({ field: 'value' })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      console.log('Success:', data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return <button onClick={handleAction}>{loading ? 'Loading...' : 'Action'}</button>
}
```

---

## 🐛 Troubleshooting

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `401 Unauthorized` | No/expired JWT | Check `.env.local`, browser cookies |
| `403 Forbidden` | Wrong role | Check `users_profiles.role` in Supabase |
| `404 Not Found` | Route mismatch | Check file path (e.g., `/api/auth/register` → `src/app/api/auth/register/route.js`) |
| `RLS policy error` | Permission denied | Run `CREATE POLICY` in Supabase SQL Editor |
| Tests fail: `describe is not defined` | Using Jest syntax | Use custom `assert()` function instead |
| Changes don't show | Dev server cached | Kill server, restart, hard-refresh (Ctrl+Shift+R) |

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| **README.md** | Project overview |
| **TESTING_INSTRUCTIONS.md** | How to run tests locally |
| **TEST_GUIDE.md** | What each test verifies |
| **PHASE_1_VERIFICATION.md** | Phase 1 completion checklist |
| **copilot-instructions.md** | Full workspace context (for AI agent) |

---

## 🚀 Next Phase: Phase 2 (Weeks 3-4)

### Story 2.1: AI Skill Verification
- Students pick a skill category
- Claude API generates custom brief (e.g., "design a landing page")
- Student submits proof (written + file upload)
- Real-time feedback on submission

**APIs needed:**
- `POST /api/skills/request-brief` → Claude generates brief
- `POST /api/skills/submit-proof` → Save submission
- `GET /api/admin/pending-skills` → Admin queue

### Story 2.2: Admin Badge Approval
- Admin reviews submissions in queue
- Claude API analyzes quality (0-100 score)
- Admin grants badge if approved
- Student notified (email/dashboard)

---

## ✅ Phase Completion Checklist

Before moving to next phase:

- [ ] All stories in current phase have passing tests
- [ ] All tests run: `npm run test:phase[N]`
- [ ] Vercel preview builds without errors
- [ ] Code reviewed by ≥1 teammate
- [ ] Database migrations documented in `supabase/migrations/`
- [ ] Workspace instructions updated
- [ ] Changes committed with co-author trailer

---

## 👥 Team Communication

**Questions?** Ask in this order:
1. Check this file (SETUP.md)
2. Check `copilot-instructions.md` (full context)
3. Check test files (examples of how to use APIs)
4. Ask teammates on Slack/Discord

**When joining Phase 2+:**
1. Pull latest code
2. Read Phase 1 Verification Checklist
3. Run tests to confirm Phase 1 works
4. Read Phase 2 Story descriptions
5. Ask questions!

---

**Last Updated:** Phase 1.2 Complete  
**For Questions:** See copilot-instructions.md (full technical context)
