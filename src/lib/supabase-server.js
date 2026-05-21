// src/lib/supabase-server.js
// Server-side Supabase client (reads cookies for session, used in API routes & Server Components)
// Member A owns this file.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — setAll is not critical here
          }
        },
      },
    }
  )
}

// Admin client with SERVICE ROLE key — only call from server-side API routes!
// NEVER expose this client to the browser.
export async function createAdminSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// ─── Pure service-role client (NO cookies / user session) ───────────────────
// Use this for privileged writes that must bypass RLS unconditionally,
// e.g. recalculating KaajerScore on another user's student_profiles row.
// createAdminSupabaseClient() reads cookies → acts as the logged-in user →
// RLS applies → silent 0-row update. This client always uses the service role.
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
