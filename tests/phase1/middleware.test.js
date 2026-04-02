// tests/phase1/middleware.test.js
// Tests that middleware correctly blocks unauthorized cross-role access.
// Run: node tests/phase1/middleware.test.js
// Make sure dev server is running: npm run dev

const BASE_URL = 'http://localhost:3000'

const green = (msg) => `\x1b[32m✓ ${msg}\x1b[0m`
const red = (msg) => `\x1b[31m✗ ${msg}\x1b[0m`
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(green(label)); passed++ }
  else { console.log(red(label)); failed++ }
}

async function getNoAuth(path) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
  return { status: res.status, location: res.headers.get('location') }
}

async function runTests() {
  console.log(bold('\n══════════════════════════════════════════'))
  console.log(bold(' KaajerBazar Phase 1 — Middleware Tests'))
  console.log(bold('══════════════════════════════════════════\n'))

  // ── TEST 1: Protected routes redirect unauthenticated users ──────
  console.log(bold('TEST 1: Unauthenticated access to /student/dashboard'))
  const { status: s1, location: l1 } = await getNoAuth('/student/dashboard')
  assert(
    s1 === 307 || s1 === 302 || s1 === 308,
    `GET /student/dashboard (no auth) → redirect (got ${s1})`
  )
  assert(
    l1?.includes('/login'),
    `Redirect goes to /login (got: ${l1})`
  )
  console.log()

  // ── TEST 2: Company route blocks unauthenticated ─────────────────
  console.log(bold('TEST 2: Unauthenticated access to /company/dashboard'))
  const { status: s2, location: l2 } = await getNoAuth('/company/dashboard')
  assert(s2 === 307 || s2 === 302 || s2 === 308, `GET /company/dashboard → redirect (got ${s2})`)
  assert(l2?.includes('/login'), `Redirect goes to /login (got: ${l2})`)
  console.log()

  // ── TEST 3: Admin route blocks unauthenticated ───────────────────
  console.log(bold('TEST 3: Unauthenticated access to /admin/dashboard'))
  const { status: s3, location: l3 } = await getNoAuth('/admin/dashboard')
  assert(s3 === 307 || s3 === 302 || s3 === 308, `GET /admin/dashboard → redirect (got ${s3})`)
  assert(l3?.includes('/login'), `Redirect goes to /login (got: ${l3})`)
  console.log()

  // ── TEST 4: Public pages are accessible ──────────────────────────
  console.log(bold('TEST 4: Public route /login is accessible'))
  const { status: s4 } = await getNoAuth('/login')
  assert(s4 === 200, `GET /login → 200 (got ${s4})`)
  console.log()

  console.log(bold('TEST 5: Public route /register is accessible'))
  const { status: s5 } = await getNoAuth('/register')
  assert(s5 === 200, `GET /register → 200 (got ${s5})`)
  console.log()

  console.log(bold('TEST 6: Public route /unauthorized is accessible'))
  const { status: s6 } = await getNoAuth('/unauthorized')
  assert(s6 === 200, `GET /unauthorized → 200 (got ${s6})`)
  console.log()

  // ── SUMMARY ──────────────────────────────────────────────────────
  console.log(bold('══════════════════════════════════════════'))
  const total = passed + failed
  console.log(`Results: ${passed}/${total} tests passed`)
  if (failed > 0) {
    console.log(red(`${failed} failed`))
    process.exit(1)
  } else {
    console.log(green('All middleware tests passed!'))
  }
  console.log(bold('══════════════════════════════════════════\n'))
}

runTests().catch((err) => {
  console.error(red('Test suite crashed:'), err.message)
  process.exit(1)
})
