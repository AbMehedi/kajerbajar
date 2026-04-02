// tests/phase1/auth.test.js
// Phase 1 — Manual Test Checklist + API Tests
// Run these with: node tests/phase1/auth.test.js
// Or use Postman / Thunder Client to call the endpoints.
//
// PREREQUISITES:
//   1. App is running: npm run dev
//   2. .env.local is filled with real Supabase keys
//   3. schema.sql has been applied in Supabase SQL Editor

const BASE_URL = 'http://localhost:3000'

// ─── COLOR HELPERS ────────────────────────────────────────────────
const green = (msg) => `\x1b[32m✓ ${msg}\x1b[0m`
const red = (msg) => `\x1b[31m✗ ${msg}\x1b[0m`
const yellow = (msg) => `\x1b[33m⚠ ${msg}\x1b[0m`
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(green(label))
    passed++
  } else {
    console.log(red(label))
    failed++
  }
}

// ─── TEST HELPERS ─────────────────────────────────────────────────
async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

// ─── UNIQUE IDs for this test run ─────────────────────────────────
const ts = Date.now()
const studentEmail = `student_${ts}@test.com`
const studentPassword = 'TestPass123!'
const studentUsername = `student_${ts}`

const companyEmail = `company_${ts}@test.com`
const companyPassword = 'TestPass456!'

// ─── TESTS ────────────────────────────────────────────────────────

async function runTests() {
  console.log(bold('\n══════════════════════════════════════════'))
  console.log(bold(' KaajerBazar Phase 1 — Auth Test Suite'))
  console.log(bold('══════════════════════════════════════════\n'))

  // ── TEST 1: Register as Student ──────────────────────────────────
  console.log(bold('TEST 1: Register as Student'))
  const { status: s1, data: d1 } = await post('/api/auth/register', {
    email: studentEmail,
    password: studentPassword,
    full_name: 'Test Student',
    role: 'student',
    username: studentUsername,
    university: 'BUET',
    graduation_year: 2026,
  })
  assert(s1 === 201, `POST /api/auth/register → 201 (got ${s1})`)
  assert(d1?.success === true, 'Response has success: true')
  assert(typeof d1?.userId === 'string', 'Response has a userId string')
  assert(d1?.message?.includes('student'), 'Message mentions student role')
  console.log()

  // ── TEST 2: Register as Company ──────────────────────────────────
  console.log(bold('TEST 2: Register as Company'))
  const { status: s2, data: d2 } = await post('/api/auth/register', {
    email: companyEmail,
    password: companyPassword,
    full_name: 'Test Company Ltd',
    role: 'company',
    legal_name: `TestCo ${ts}`,
    website: 'https://testco.example.com',
    industry: 'Tech',
  })
  assert(s2 === 201, `POST /api/auth/register → 201 (got ${s2})`)
  assert(d2.success === true, 'Company registration success')
  console.log()

  // ── TEST 3: Duplicate student email ──────────────────────────────
  console.log(bold('TEST 3: Duplicate Registration (same email)'))
  const { status: s3 } = await post('/api/auth/register', {
    email: studentEmail,
    password: studentPassword,
    full_name: 'Duplicate',
    role: 'student',
    username: `dup_${ts}`,
  })
  assert(s3 === 400 || s3 === 422, `Duplicate email rejected (got ${s3})`)
  console.log()

  // ── TEST 4: Missing required field ───────────────────────────────
  console.log(bold('TEST 4: Missing required fields'))
  const { status: s4, data: d4 } = await post('/api/auth/register', {
    email: `missing_${ts}@test.com`,
    password: 'abc123456',
    // missing full_name and role
  })
  assert(s4 === 400, `Missing fields → 400 (got ${s4})`)
  assert(typeof d4.error === 'string', 'Error message included in response')
  console.log()

  // ── TEST 5: Invalid role ─────────────────────────────────────────
  console.log(bold('TEST 5: Invalid role value'))
  const { status: s5 } = await post('/api/auth/register', {
    email: `badrole_${ts}@test.com`,
    password: 'abc123456',
    full_name: 'Bad Role',
    role: 'hacker',
    username: `badrole_${ts}`,
  })
  assert(s5 === 400, `Invalid role → 400 (got ${s5})`)
  console.log()

  // ── TEST 6: Student without username ─────────────────────────────
  console.log(bold('TEST 6: Student missing username'))
  const { status: s6 } = await post('/api/auth/register', {
    email: `nousername_${ts}@test.com`,
    password: 'abc12345',
    full_name: 'No Username',
    role: 'student',
    // username intentionally omitted
  })
  assert(s6 === 400, `Student missing username → 400 (got ${s6})`)
  console.log()

  // ── TEST 7: Logout ───────────────────────────────────────────────
  console.log(bold('TEST 7: Logout endpoint'))
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' })
  assert(
    logoutRes.status === 200 || logoutRes.status === 401,
    `POST /api/auth/logout → 200 or 401 (got ${logoutRes.status})`
  )
  console.log()

  // ── SUMMARY ──────────────────────────────────────────────────────
  console.log(bold('══════════════════════════════════════════'))
  const total = passed + failed
  console.log(`Results: ${passed}/${total} tests passed`)
  if (failed > 0) {
    console.log(red(`${failed} test(s) failed — check the errors above`))
    process.exit(1)
  } else {
    console.log(green('All tests passed!'))
  }
  console.log(bold('══════════════════════════════════════════\n'))
}

runTests().catch((err) => {
  console.error(red('Test suite crashed:'), err.message)
  console.error(yellow('Make sure the dev server is running: npm run dev'))
  process.exit(1)
})
