// tests/phase1/company-verification.test.js
// Story 1.2: Admin verifies company trade licenses
// Run with: node tests/phase1/company-verification.test.js
//
// PREREQUISITES:
//   1. App is running: npm run dev
//   2. Schema migration applied (verification columns added)

const BASE_URL = 'http://localhost:3000'

// ─── COLOR HELPERS ────────────────────────────────────────────────
const green = (msg) => `\x1b[32m✓ ${msg}\x1b[0m`
const red = (msg) => `\x1b[31m✗ ${msg}\x1b[0m`
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

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

// ═══════════════════════════════════════════════════════════════════
// STORY 1.2 TESTS: Company Trade License Verification
// ═══════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n' + bold('═══════════════════════════════════════════════════════'))
  console.log(bold('  STORY 1.2: Company Trade License Verification'))
  console.log(bold('═══════════════════════════════════════════════════════') + '\n')

  // ─── SECTION 1: Upload License API ──────────────────────────────
  console.log(bold('\n📤 POST /api/company/upload-license\n'))

  {
    const { status, data } = await post('/api/company/upload-license', { file_url: 'test.pdf' })
    assert(status === 401, 'Returns 401 when not authenticated')
    assert(data.error?.includes('authenticated'), 'Error message mentions authentication')
  }

  {
    const { status } = await post('/api/company/upload-license', {})
    assert(status === 401, 'Endpoint exists (not 404)')
    assert(status !== 404, 'Returns auth error, not missing endpoint')
  }

  // ─── SECTION 2: Pending Companies API ───────────────────────────
  console.log(bold('\n📋 GET /api/admin/pending-companies\n'))

  {
    const { status, data } = await get('/api/admin/pending-companies')
    assert(status === 401, 'Returns 401 when not authenticated')
    assert(data.error?.includes('authenticated'), 'Error message mentions authentication')
  }

  {
    const { status } = await get('/api/admin/pending-companies')
    assert(status !== 404, 'Endpoint exists (not 404)')
  }

  // ─── SECTION 3: Verify Company API ──────────────────────────────
  console.log(bold('\n✅ POST /api/admin/verify-company\n'))

  {
    const { status, data } = await post('/api/admin/verify-company', { 
      company_id: 'test-uuid', 
      action: 'approve' 
    })
    assert(status === 401, 'Returns 401 when not authenticated')
    assert(data.error?.includes('authenticated'), 'Error message mentions authentication')
  }

  {
    const { status } = await post('/api/admin/verify-company', { action: 'approve' })
    assert(status === 401, 'Endpoint exists (not 404)')
    assert(status !== 404, 'Returns auth error, not missing endpoint')
  }

  {
    const { status } = await post('/api/admin/verify-company', { 
      company_id: 'test', 
      action: 'invalid' 
    })
    assert(status === 401, 'Auth check comes before validation')
  }

  // ─── SUMMARY ────────────────────────────────────────────────────
  console.log('\n' + bold('═══════════════════════════════════════════════════════'))
  console.log(bold(`  RESULTS: ${passed} passed, ${failed} failed`))
  console.log(bold('═══════════════════════════════════════════════════════') + '\n')

  if (failed > 0) {
    console.log(red('Some tests failed! Check API endpoints.'))
    process.exit(1)
  } else {
    console.log(green('All Story 1.2 API tests passed!'))
    console.log('\n📝 Manual tests still needed:')
    console.log('   1. Login as company → see upload UI')
    console.log('   2. Upload PDF → status changes to "pending"')
    console.log('   3. Login as admin → see company in queue')
    console.log('   4. Approve/Reject → company status updates')
  }
}

runTests().catch(console.error)
