import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username || username.trim() === '') {
      return NextResponse.json({ available: false, message: 'Username is required' }, { status: 400 })
    }

    const adminClient = await createAdminSupabaseClient()

    // Check student_profiles
    const { data: studentMatch, error: studentError } = await adminClient
      .from('student_profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle()

    if (studentError) {
      console.error('[check-username] Error checking student_profiles:', studentError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Check company_profiles
    const { data: companyMatch, error: companyError } = await adminClient
      .from('company_profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle()

    if (companyError) {
      console.error('[check-username] Error checking company_profiles:', companyError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const isTaken = !!studentMatch || !!companyMatch

    return NextResponse.json({ available: !isTaken })
  } catch (err) {
    console.error('[check-username] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
