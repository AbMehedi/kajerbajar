# Test Users for Development

Quick reference for testing different roles during development.

## Test Credentials

Use these to test different features without remembering passwords:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Student** | `student@test.com` | `Student123!` | Test student dashboard, apply for projects |
| **Company** | `company@test.com` | `Company123!` | Test company dashboard, upload license, post projects |
| **Admin** | `admin@test.com` | `Admin123!` | Test admin dashboard, verify companies, approve badges |

## How to Create Test Users

### Option 1: Automatic Seed (Recommended)

```bash
# Create all 3 test users at once
npm run seed:test-users

# Expected output:
# ✓ Student user created: student@test.com
# ✓ Company user created: company@test.com
# ✓ Admin user created: admin@test.com
```

### Option 2: Manual in Supabase

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click "Add user"
3. Create these 3 users:
   - Email: `student@test.com`, Password: `Student123!`
   - Email: `company@test.com`, Password: `Company123!`
   - Email: `admin@test.com`, Password: `Admin123!`

### Option 3: Use Dev Quick-Login Component

After running `npm run dev`, click the "🔑 Dev Login" button in the top-right corner (visible only in dev mode). It shows a dropdown to instantly log in as any role—no typing needed!

---

## Workflow: Testing All 3 Roles

### Step 1: Start Dev Server
```bash
npm run dev
# Opens http://localhost:3000
```

### Step 2: Login & Test

**Use Dev Quick-Login (easiest):**
1. Top-right corner: Click "🔑 Dev Login"
2. Select role from dropdown (Student/Company/Admin)
3. Instantly logged in!

**Or Manual Login:**
1. Click "Login" button
2. Paste email from table above
3. Paste password from table above
4. Done!

### Step 3: Test Feature
- **Student Role:** Browse projects, apply, check dashboard
- **Company Role:** Upload trade license, view verification status
- **Admin Role:** Verify companies, see pending queue

### Step 4: Switch Roles
- Click "Logout" 
- Repeat Step 2 with different role

---

## For Automated Tests (No Manual Login)

Tests use these credentials automatically:

```javascript
// tests/phase1/auth.test.js
const studentEmail = `student_${Date.now()}@test.com`  // Unique per run
const companyEmail = `company_${Date.now()}@test.com`
const adminEmail = `admin_${Date.now()}@test.com`

// Tests create users, test them, clean up automatically
```

Run:
```bash
npm run test:phase1
```

Tests will create/destroy users so you don't have to!

---

## Environment Variables (for scripts)

File: `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Test Users (optional, only used by seed script)
TEST_STUDENT_EMAIL=student@test.com
TEST_STUDENT_PASSWORD=Student123!
TEST_COMPANY_EMAIL=company@test.com
TEST_COMPANY_PASSWORD=Company123!
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=Admin123!
```

---

## Never Forget Credentials Again!

✅ **Save in browser:**
- Chrome/Firefox password managers auto-save after first login

✅ **Use Dev Quick-Login component:**
- Click button, select role, instant login (dev mode only)

✅ **Or run seed script:**
```bash
npm run seed:test-users
# Creates all 3 users, prints confirmation
```

---

## Troubleshooting

**Q: "User already exists" error when creating test users?**
A: That user already exists in Supabase. Just use the password above to login.

**Q: Lost the password?**
A: Go to Supabase → Authentication → Find the user → Click "Reset password" (email them a link)

**Q: Want to delete and recreate test users?**
A: 
```bash
npm run seed:test-users -- --reset
# Deletes old users, creates fresh ones
```

**Q: Dev Quick-Login button not showing?**
A: You're not in dev mode. Make sure:
1. Running `npm run dev`
2. Browser localhost:3000 (not production URL)
3. Check browser console for errors

---

**Last Updated:** Phase 1.2  
**Ready to test?** `npm run dev` + use Dev Quick-Login! 🔑
