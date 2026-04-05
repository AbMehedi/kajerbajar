# 🧪 TESTING INSTRUCTIONS — Phase 1 Verification

## ✅ Quick Test Run (5 minutes)

### Prerequisites Checklist

Before running tests, verify:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` exists and is filled with real Supabase keys
- [ ] Supabase schema applied (run `supabase/schema.sql` in SQL Editor)
- [ ] Internet connection (tests need to reach Supabase)

---

## 🚀 STEP-BY-STEP TEST EXECUTION

### Step 1: Start the Dev Server (Terminal #1)

```bash
cd e:\Kaajer_bazar\kaajerbazar
npm run dev
```

**What you should see:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env.local

  ✓ Ready in 3.2s
```

**IMPORTANT:** Don't proceed until you see "Ready in X.Xs"

---

### Step 2: Open New Terminal (Terminal #2)

Keep Terminal #1 running. Open a new PowerShell or Command Prompt window.

```bash
cd e:\Kaajer_bazar\kaajerbazar
```

---

### Step 3: Run the Full Test Suite

```bash
npm run test:phase1
```

**This runs TWO test files sequentially:**
1. `tests/phase1/auth.test.js` — Registration & API tests
2. `tests/phase1/middleware.test.js` — Route protection tests

**Expected output (13 + 8 = 21 tests):**

```
══════════════════════════════════════════
 KaajerBazar Phase 1 — Auth Test Suite
══════════════════════════════════════════

TEST 1: Register as Student
✓ POST /api/auth/register → 201 (got 201)
✓ Response has success: true
✓ Response has a userId string
✓ Message mentions student role
... (more tests)

Results: 13/13 tests passed
✓ All tests passed!
══════════════════════════════════════════

══════════════════════════════════════════
 KaajerBazar Phase 1 — Middleware Tests
══════════════════════════════════════════

TEST 1: Unauthenticated access to /student/dashboard
✓ GET /student/dashboard (no auth) → redirect (got 307)
✓ Redirect goes to /login (got: /login)
... (more tests)

Results: 8/8 tests passed
✓ All middleware tests passed!
══════════════════════════════════════════
```

**Result:** If you see **21/21 passed**, you're golden! ✅

---

## 🔍 Run Individual Test Suites

If you only want to run one test file:

```bash
# Just registration & auth API tests
npm run test:auth

# Just middleware & routing tests
npm run test:middleware

# Run directly (if npm scripts don't work)
node tests/phase1/auth.test.js
node tests/phase1/middleware.test.js
```

---

## 🛠️ TROUBLESHOOTING

### ❌ Error: "ECONNREFUSED"

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Cause:** Dev server not running or not ready yet

**Fix:**
```bash
# Terminal 1: Make sure dev server is fully ready
npm run dev
# Wait for "Ready in Xs" message

# Terminal 2: Try tests again
npm run test:phase1
```

---

### ❌ Error: "Cannot find module '@/lib/supabase'"

```
Error: Cannot find module '@/lib/supabase'
```

**Cause:** Build artifacts missing

**Fix:**
```bash
npm install
npm run build
npm run dev
# Then try tests again
```

---

### ❌ Error: "Supabase error: auth_token_jwt_invalid"

```
Error: Invalid auth credentials
```

**Cause:** `.env.local` has wrong Supabase keys

**Fix:**
```
1. Go to https://supabase.com → Your Project
2. Click "Settings" → "API"
3. Copy these values to .env.local:
   - NEXT_PUBLIC_SUPABASE_URL = "Project URL"
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = "Anon public key"
   - SUPABASE_SERVICE_ROLE_KEY = "Service role secret"
4. Save .env.local
5. Restart dev server: npm run dev
6. Try tests again
```

---

### ❌ Error: "relation \"users_profiles\" does not exist"

```
Error: relation "users_profiles" does not exist
```

**Cause:** Supabase schema not applied

**Fix:**
```
1. Go to Supabase → SQL Editor
2. Create a new query
3. Copy entire contents of supabase/schema.sql
4. Paste into Supabase SQL Editor
5. Click "RUN"
6. Wait for completion
7. Try tests again
```

**Verify schema was applied:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- You should see:
-- applications
-- certificates
-- company_profiles
-- escrow_ledger
-- projects
-- skill_verifications
-- student_profiles
-- users_profiles
```

---

### ❌ Error: "Duplicate email" / "already exists"

```
Error: email already exists
```

**This is EXPECTED behavior!** ✓

Tests create random emails using timestamps. If you run tests multiple times in the same second, they might use the same email. This actually **verifies** that validation works!

**Fix:** Just run the tests again (a few seconds later):
```bash
npm run test:phase1
```

---

### ❌ Error: "ENOENT: no such file or directory"

```
ENOENT: no such file or directory, open 'tests/phase1/auth.test.js'
```

**Cause:** Wrong working directory

**Fix:**
```bash
# Make sure you're in the kaajerbazar directory
cd e:\Kaajer_bazar\kaajerbazar
pwd  # Should show: e:\Kaajer_bazar\kaajerbazar

# Then run tests
npm run test:phase1
```

---

## 📊 TEST BREAKDOWN

### `npm run test:auth` — 13 Tests

**What it verifies:**
- ✅ Student registration API
- ✅ Company registration API
- ✅ Validation catches missing fields
- ✅ Invalid roles are rejected
- ✅ Duplicate emails are rejected
- ✅ Required student fields (username) enforced
- ✅ Logout endpoint works

**Time:** ~3 seconds

---

### `npm run test:middleware` — 8 Tests

**What it verifies:**
- ✅ Unauthenticated users redirected to /login
- ✅ /student/dashboard protected
- ✅ /company/dashboard protected
- ✅ /admin/dashboard protected
- ✅ /login is public
- ✅ /register is public
- ✅ /unauthorized is public

**Time:** ~2 seconds

---

## ✨ MANUAL TESTING (After Automated Tests Pass)

After all automated tests pass ✅, verify these scenarios manually:

### Test 1: Student Registration & Login

```
1. Go to http://localhost:3000/register
2. Select "🎓 Student" tab
3. Fill in:
   Email: studenttest@example.com
   Password: TestPass123!
   Full name: Test Student
   Username: teststudent123
   University: BUET
   Graduation year: 2026
4. Click "Create account"
   Expected: Redirected to /student/dashboard ✓
5. See your name and KaajerScore at the top
6. Click "Logout"
   Expected: Redirected to /login ✓
```

---

### Test 2: Company Registration & Verification Status

```
1. Go to http://localhost:3000/register
2. Select "🏢 Company" tab
3. Fill in:
   Email: companytest@example.com
   Password: TestPass456!
   Full name: Company Admin
   Legal name: TestCorp Ltd.
   Website: https://testcorp.com
   Industry: Technology
4. Click "Create account"
   Expected: Redirected to /company/dashboard ✓
5. See banner: "⏳ Your company is pending verification"
   This is correct! (Phase 1.2 will add verification queue)
6. Click "Logout"
```

---

### Test 3: Role-Based Access Control

```
1. Login as student
2. Try to visit http://localhost:3000/company/dashboard
   Expected: Redirected to /unauthorized ✓
3. Try to visit http://localhost:3000/admin/dashboard
   Expected: Redirected to /unauthorized ✓
4. Logout
5. Login as company
6. Try to visit http://localhost:3000/student/dashboard
   Expected: Redirected to /unauthorized ✓
```

---

### Test 4: Session Persistence

```
1. Login as student
2. Refresh the page (F5)
   Expected: Still logged in ✓
3. Close browser tab
4. Open new tab, go to http://localhost:3000/student/dashboard
   Expected: May need to login (7-day session, depends on cookies)
```

---

### Test 5: Admin Dashboard

```
1. Create admin manually:
   a. Go to Supabase → Authentication → Users
   b. Click "Invite user"
   c. Email: admin@example.com
   d. Password: AdminPass123!
   e. Note the UUID shown in the users list

2. Go to Supabase → SQL Editor
3. Run:
   INSERT INTO users_profiles (id, role, email, full_name)
   VALUES ('UUID_HERE', 'admin', 'admin@example.com', 'Admin User');
   (Replace UUID_HERE with actual UUID)

4. Go to http://localhost:3000/login
5. Login as admin@example.com / AdminPass123!
   Expected: Redirected to /admin/dashboard ✓

6. See stat cards:
   - Total Students: (count of registered students)
   - Total Companies: (count of registered companies)
   - Pending Verifications: 0 (Phase 2 will add skill verifications)
```

---

## 📈 Expected Test Output Summary

```
Phase 1 Auth Tests:     13/13 PASSED ✓
Phase 1 Middleware:      8/8  PASSED ✓
────────────────────────────────────
TOTAL:                  21/21 PASSED ✅

✨ Phase 1.1 Foundation is VERIFIED!
```

---

## 🎓 Understanding Test Results

### ✅ Green Check = Test Passed
```
✓ POST /api/auth/register → 201 (got 201)
```
This means the API returned the expected response.

### ❌ Red X = Test Failed
```
✗ POST /api/auth/register → 201 (got 400)
```
This means something is broken. Check the error message above it.

---

## 📝 Test Logs

Tests write detailed logs to help debug issues.

**Auth test output includes:**
- Each API call's response status
- Response body (if there's an error)
- Which assertions passed/failed

**Middleware test output includes:**
- HTTP redirect responses (307, 302, etc.)
- Redirect target URLs
- Which assertions passed/failed

---

## 🚀 NEXT STEPS

Once all tests pass ✅:

### Build Story 1.2 (Company Verification)
```
Features:
- Companies upload trade license PDF during/after registration
- Admin sees "Company Verification Queue"
- Admin approves/rejects with feedback
- Email notification to company

Time estimate: 2-3 hours
```

### Or Jump to Phase 2 (Skill Verification)
```
Features:
- Students request AI-generated skill briefs
- Claude API creates skill verification tasks
- Students submit proofs (portfolio, code, essay)
- Admins approve → grant badges

Time estimate: 3-4 hours
```

---

## 💡 Tips

- **Keep Terminal #1 running** — Dev server must stay active
- **Use multiple terminals** — One for dev, one for tests
- **Check .env.local first** — 80% of issues are wrong environment variables
- **Restart dev server** — If you change .env.local, restart with `npm run dev`
- **Clear browser cache** — If login doesn't work, try incognito/private mode

---

## 📞 Need Help?

If tests fail:

1. **Read the error message carefully** — It usually tells you what's wrong
2. **Check the troubleshooting section** above
3. **Verify prerequisites** — Node.js, npm install, .env.local, schema applied
4. **Restart everything** — Stop dev server, run `npm install`, `npm run dev` again

Good luck! 🎉
