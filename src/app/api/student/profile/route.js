import { requireAuthAndRole } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    const auth = await requireAuthAndRole({ allowedRoles: ['student'] })
    if (auth.errorResponse) return auth.errorResponse
    
    const { user } = auth
    const body = await request.json()
    
    // We expect: full_name, username, bio, university, about_text, portfolio_url
    const { full_name, username, bio, university, about_text, portfolio_url } = body
    
    const adminClient = await createAdminSupabaseClient()

    // 1. Update users_profiles (full_name)
    if (full_name) {
      const { error: userError } = await adminClient
        .from('users_profiles')
        .update({ full_name: full_name.trim() })
        .eq('id', user.id)

      if (userError) {
        console.error('[profile PUT] users_profiles update error:', userError)
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
      }
    }

    // 2. Update student_profiles
    const studentUpdates = {}
    if (username !== undefined) studentUpdates.username = username.trim()
    if (bio !== undefined) studentUpdates.bio = bio.trim()
    if (university !== undefined) studentUpdates.university = university.trim()
    if (portfolio_url !== undefined) studentUpdates.portfolio_url = portfolio_url.trim()
    
    // Attempt to update about_text; if it fails, we ignore it (graceful fallback if schema not updated)
    if (about_text !== undefined) studentUpdates.about_text = about_text.trim()

    if (Object.keys(studentUpdates).length > 0) {
      const { error: studentError } = await adminClient
        .from('student_profiles')
        .update(studentUpdates)
        .eq('id', user.id)
        
      if (studentError) {
        // Fallback for about_text column missing
        if (studentError.code === '42703' && studentUpdates.about_text !== undefined) {
          console.warn('[profile PUT] about_text column missing, retrying without it.')
          delete studentUpdates.about_text
          const { error: retryError } = await adminClient
            .from('student_profiles')
            .update(studentUpdates)
            .eq('id', user.id)
            
          if (retryError) {
             console.error('[profile PUT] student_profiles retry update error:', retryError)
             return NextResponse.json({ error: 'Failed to update student details' }, { status: 500 })
          }
        } else {
          // If username is taken, it's code 23505
          if (studentError.code === '23505') {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
          }
          console.error('[profile PUT] student_profiles update error:', studentError)
          return NextResponse.json({ error: 'Failed to update student details' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('[profile PUT] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
