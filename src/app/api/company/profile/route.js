import { requireAuthAndRole } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    const auth = await requireAuthAndRole({ allowedRoles: ['company'] })
    if (auth.errorResponse) return auth.errorResponse
    
    const { user } = auth
    const body = await request.json()
    
    // We expect: legal_name, avatar_url, username, industry, website, description
    const { legal_name, avatar_url, username, industry, website, description } = body
    
    const { createServiceRoleClient } = require('@/lib/supabase-server')
    const serviceRoleClient = createServiceRoleClient()

    // 1. Update users_profiles (full_name for fallback, avatar_url)
    const userUpdates = {}
    if (legal_name) userUpdates.full_name = legal_name.trim()
    if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await serviceRoleClient
        .from('users_profiles')
        .update(userUpdates)
        .eq('id', user.id)

      if (userError) {
        console.error('[company profile PUT] users_profiles update error:', userError)
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
      }
    }

    // 2. Update company_profiles
    const companyUpdates = {}
    if (legal_name) companyUpdates.legal_name = legal_name.trim()
    if (username !== undefined) companyUpdates.username = username.trim()
    if (industry !== undefined) companyUpdates.industry = industry.trim()
    if (website !== undefined) companyUpdates.website = website.trim()
    if (description !== undefined) companyUpdates.description = description.trim()

    if (Object.keys(companyUpdates).length > 0) {
      const { error: companyError } = await serviceRoleClient
        .from('company_profiles')
        .update(companyUpdates)
        .eq('id', user.id)
        
      if (companyError) {
        if (companyError.code === '23505') {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
        }
        console.error('[company profile PUT] company_profiles update error:', companyError)
        return NextResponse.json({ error: 'Failed to update company details' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('[company profile PUT] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
