import { requireAuth } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse
    
    const { user } = auth
    const adminClient = await createAdminSupabaseClient()

    // 1. Get base user profile
    const { data: profile, error: profileError } = await adminClient
      .from('users_profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[user me GET] users_profiles error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    let username = null
    let legalName = null

    // 2. Get role-specific details
    if (profile.role === 'student') {
      const { data: studentData } = await adminClient
        .from('student_profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (studentData) username = studentData.username
    } else if (profile.role === 'company') {
      const { data: companyData } = await adminClient
        .from('company_profiles')
        .select('username, legal_name')
        .eq('id', user.id)
        .single()
      
      if (companyData) {
        username = companyData.username
        legalName = companyData.legal_name
      }
    }

    // Determine the display name (company legal name takes precedence if company)
    const displayName = legalName || profile.full_name

    return NextResponse.json({ 
      id: user.id,
      role: profile.role,
      full_name: displayName,
      avatar_url: profile.avatar_url,
      username: username 
    })
  } catch (err) {
    console.error('[user me GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
