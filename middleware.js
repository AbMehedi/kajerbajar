// middleware.js — Project root (kaajerbazar/)
// Member C owns this file. Ask before editing.
//
// PURPOSE:
//   Runs on EVERY page request (except static files and /api/).
//   Two jobs:
//     1. Refresh the Supabase session token (keeps users logged in)
//     2. Enforce role-based route protection (student can't see /company/*)
//
// XP NOTE: ROLE_GUARDS replaces 3 identical if-blocks. To add a new
// protected prefix (e.g. /teacher/*) → add one line to ROLE_GUARDS.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// ── Public paths — no auth required ──────────────────────────────────────────
// Add new public routes here (e.g. '/about', '/pricing')
const PUBLIC_PATHS = ['/login', '/register', '/unauthorized', '/verify']

// ── Role guard matrix ─────────────────────────────────────────────────────────
// Format: { prefix: '/route-prefix', allowedRole: 'role-name' }
// If a user's role doesn't match allowedRole, they're sent to /unauthorized.
const ROLE_GUARDS = [
  { prefix: '/student', allowedRole: 'student' },
  { prefix: '/company', allowedRole: 'company' },
  { prefix: '/admin',   allowedRole: 'admin'   },
]

// ── Helper: build a redirect response ────────────────────────────────────────
function redirectTo(request, pathname) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  // Build a Supabase client that can read/write cookies on this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() also refreshes the session JWT.
  // Do not remove this call — without it, sessions expire and users get
  // randomly logged out after 1 hour.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // 1. Unauthenticated user on a protected page → send to login
  if (!user && !isPublic) {
    return redirectTo(request, '/login')
  }

  // 2. Authenticated user — check role matches the requested path prefix
  // Read role from JWT metadata (zero DB calls) instead of querying users_profiles
  if (user) {
    const role = user.user_metadata?.role ?? user.app_metadata?.role

    for (const guard of ROLE_GUARDS) {
      if (pathname.startsWith(guard.prefix) && role !== guard.allowedRole) {
        return redirectTo(request, '/unauthorized')
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all paths EXCEPT Next.js internals and /api/ routes.
    // API routes handle their own auth checks.
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
