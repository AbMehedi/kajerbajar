// src/app/api/auth/callback/route.js
// Handles OAuth callbacks from Google (and other providers)
// After Google login, Supabase redirects here with a code.
// We exchange the code for a session, then redirect to the correct dashboard.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const ROLE_DASHBOARD = {
  student: '/student/dashboard',
  company: '/company/dashboard',
  admin:   '/admin/dashboard',
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()

    // Exchange the code for a session (sets cookies automatically)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the logged-in user's role and redirect to correct dashboard
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // If user has a profile (returning user), go to their dashboard
        if (profile?.role) {
          return NextResponse.redirect(`${origin}${ROLE_DASHBOARD[profile.role]}`)
        }

        // New Google user — they need to pick a role
        // Redirect to a role-selection page (we'll create this next)
        return NextResponse.redirect(`${origin}/auth/complete-profile`)
      }
    }
  }

  // If something went wrong, send back to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_error`)
}
