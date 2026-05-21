// tests/phase3/applications.test.js
// Story 3.2: Student applies to a micro-project
// Run with: node tests/phase3/applications.test.js
//
// PREREQUISITES:
//   1. App is running:  npm run dev
//   2. migrations_004_applications_rls.sql applied in Supabase SQL Editor

const BASE_URL = 'http://localhost:3000'

// ─── COLOR HELPERS ────────────────────────────────────────────────
const green = (msg) => `\x1b[32m✓ ${msg}\x1b[0m`
const red   = (msg) => `\x1b[31m✗ ${msg}\x1b[0m`
const bold  = (msg) => `\x1b[1m${msg}\x1b[0m`

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
async function post(path, body, cookie = '') {
  const headers = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie'] = cookie

  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

// ═══════════════════════════════════════════════════════════════════
// STORY 3.2 TESTS: POST /api/applications/create
// ═══════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n' + bold('═══════════════════════════════════════════════════════'))
  console.log(bold('  STORY 3.2: Student Project Applications API'))
  console.log(bold('═══════════════════════════════════════════════════════') + '\n')

  console.log(bold('\n📋 POST /api/applications/create\n'))

  // ── Test 1: No auth → 401 ────────────────────────────────────────
  {
    const { status, data } = await post('/api/applications', {
      project_id: '00000000-0000-0000-0000-000000000001',
      cover_note: 'Test cover note',
    })
    assert(status === 401, 'Test 1: Returns 401 when not authenticated')
    assert(
      typeof data.error === 'string' && data.error.toLowerCase().includes('unauthorized'),
      'Test 1: Error message says Unauthorized'
    )
  }

  // ── Test 2: Endpoint exists (not 404) ────────────────────────────
  {
    const { status } = await post('/api/applications', {})
    assert(status !== 404, 'Test 2: Endpoint exists (not 404) — got ' + status)
    assert(status === 401, 'Test 2: Returns auth error before validation')
  }

  // ── Test 3: Missing project_id → 400 (auth-first, so expect 401 without session) ─
  // Without a real session we will always get 401 first.
  // These tests document the INTENDED behaviour; full integration tests need real JWTs.
  {
    const { status } = await post('/api/applications', { cover_note: 'hi' })
    assert(
      status === 401,
      'Test 3: Auth check fires before project_id validation (401 expected without session)'
    )
  }

  // ── Test 4: Empty cover_note → 400 (needs real session; expect 401 unauthenticated) ─
  {
    const { status } = await post('/api/applications', {
      project_id: '00000000-0000-0000-0000-000000000001',
      cover_note: '',
    })
    assert(
      status === 401,
      'Test 4: Auth check fires before cover_note validation (401 expected without session)'
    )
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n' + bold('═══════════════════════════════════════════════════════'))
  console.log(bold(`  RESULTS: ${passed} passed, ${failed} failed`))
  console.log(bold('═══════════════════════════════════════════════════════') + '\n')

  if (failed > 0) {
    console.log(red('Some tests failed! Check API endpoints and auth.'))
    process.exit(1)
  } else {
    console.log(green('All Story 3.2 API tests passed!'))
    console.log('\n📝 Manual tests still needed:')
    console.log('   1. Log in as student → /student/projects → see open project cards')
    console.log('   2. Click Apply on a project → fill cover note → submit → success')
    console.log('   3. Project card shows "Applied ✓" badge after applying')
    console.log('   4. Applying again → 409 / "already applied" message')
    console.log('   5. Log in as company → dashboard shows new applicant entry')
    console.log('   6. Student dashboard shows the application under "My Applications"')
    console.log('\n📝 Full integration tests (Tests 5 & 6) require a seeded student session.')
    console.log('   See TEST_USERS.md for test account credentials.')
  }
}

runTests().catch(console.error)
