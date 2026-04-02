// src/app/api/auth/register/route.js
// Member A owns this file.
// POST /api/auth/register
// Creates auth user → inserts users_profiles → inserts role-specific profile

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, role, full_name, ...roleFields } = body

    // Validate required fields
    if (!email || !password || !role || !full_name) {
      return NextResponse.json(
        { error: 'email, password, role, and full_name are required' },
        { status: 400 }
      )
    }

    if (!['student', 'company'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "student" or "company"' },
        { status: 400 }
      )
    }

    // Use service-role admin client to create user without email confirmation
    const supabase = await createAdminSupabaseClient()

    // 1. Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // auto-confirm for development
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Insert into users_profiles
    const { error: profileError } = await supabase
      .from('users_profiles')
      .insert({
        id: userId,
        role,
        email,
        full_name,
      })

    if (profileError) {
      // Cleanup: delete auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 3. Insert into role-specific profile table
    if (role === 'student') {
      const { username, university, graduation_year } = roleFields
      if (!username) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: 'username is required for students' },
          { status: 400 }
        )
      }

      const { error: studentError } = await supabase
        .from('student_profiles')
        .insert({
          id: userId,
          username,
          university: university || null,
          graduation_year: graduation_year || null,
        })

      if (studentError) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: studentError.message },
          { status: 500 }
        )
      }
    }

    if (role === 'company') {
      const { legal_name, website, industry, description } = roleFields
      if (!legal_name) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: 'legal_name is required for companies' },
          { status: 400 }
        )
      }

      const { error: companyError } = await supabase
        .from('company_profiles')
        .insert({
          id: userId,
          legal_name,
          website: website || null,
          industry: industry || null,
          description: description || null,
          verified: false,
        })

      if (companyError) {
        await supabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: companyError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: true, userId, message: `Registered as ${role}` },
      { status: 201 }
    )
  } catch (err) {
    console.error('[register] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
