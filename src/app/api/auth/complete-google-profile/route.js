// src/app/api/auth/complete-google-profile/route.js
// Creates users_profiles + role-specific profile for new Google OAuth users.
// Called from /auth/complete-profile page.

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { jsonError, parseJsonBody, requireAuth } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const supabase = await createAdminSupabaseClient()

    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse

    const body = parsed.body
    const { userId, email, full_name, role, username, university, legal_name, industry } = body

    // Ignore client-supplied userId for writes and reject mismatches.
    if (userId && userId !== user.id) {
      return jsonError('Forbidden', 403)
    }

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }

    if (!['student', 'company'].includes(role)) {
      return NextResponse.json({ error: 'role must be student or company' }, { status: 400 })
    }

    const effectiveUserId = user.id
    const effectiveEmail = user.email || email || null
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    // 0. Update user metadata with role (for JWT-based middleware checks)
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      effectiveUserId,
      { user_metadata: { role } }
    )

    if (metadataError) {
      return NextResponse.json({ error: metadataError.message }, { status: 500 })
    }

    // 1. Insert into users_profiles (upsert in case it partially exists)
    const { error: profileError } = await supabase
      .from('users_profiles')
      .upsert({
        id: effectiveUserId,
        email: effectiveEmail,
        role,
        full_name: full_name || user.user_metadata?.full_name || effectiveEmail,
        avatar_url: avatarUrl,
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 2. Insert role-specific profile
    if (role === 'student') {
      if (!username) {
        return NextResponse.json({ error: 'username is required for students' }, { status: 400 })
      }
      const { error } = await supabase
        .from('student_profiles')
        .upsert({ id: effectiveUserId, username, university: university || null })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (role === 'company') {
      if (!legal_name) {
        return NextResponse.json({ error: 'legal_name is required for companies' }, { status: 400 })
      }
      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          id: effectiveUserId,
          legal_name,
          industry: industry || null,
          verified: false,
          verification_status: 'not_submitted',
        })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, role }, { status: 201 })
  } catch (err) {
    console.error('[complete-google-profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
