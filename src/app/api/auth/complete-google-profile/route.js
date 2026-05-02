// src/app/api/auth/complete-google-profile/route.js
// Creates users_profiles + role-specific profile for new Google OAuth users.
// Called from /auth/complete-profile page.

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createAdminSupabaseClient()

    const body = await request.json()
    const { userId, email, full_name, role, username, university, legal_name, industry } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!['student', 'company'].includes(role)) {
      return NextResponse.json({ error: 'role must be student or company' }, { status: 400 })
    }

    // 1. Insert into users_profiles (upsert in case it partially exists)
    const { error: profileError } = await supabase
      .from('users_profiles')
      .upsert({
        id: userId,
        email,
        role,
        full_name: full_name || email,
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
        .upsert({ id: userId, username, university: university || null })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (role === 'company') {
      if (!legal_name) {
        return NextResponse.json({ error: 'legal_name is required for companies' }, { status: 400 })
      }
      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          id: userId,
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
