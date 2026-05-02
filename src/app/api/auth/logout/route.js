// src/app/api/auth/logout/route.js
// POST /api/auth/logout — signs out current user, clears session, redirects to /login

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    // Always redirect to /login after logout (works for both form POST and fetch)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login`, { status: 303 })
  } catch (err) {
    console.error('[logout] Unexpected error:', err)
    return NextResponse.redirect('/login', { status: 303 })
  }
}
