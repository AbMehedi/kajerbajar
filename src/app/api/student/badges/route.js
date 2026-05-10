import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only students can view their badges',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'approved'

    const { data: badges, error } = await supabase
      .from('skill_verifications')
      .select('id, skill_category, status, verified_by, created_at, updated_at')
      .eq('student_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[student/badges GET] DB error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
        { status: 500 }
      )
    }

    return NextResponse.json({ badges: badges ?? [] })
  } catch (err) {
    console.error('[student/badges GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
