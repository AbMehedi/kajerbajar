import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only students can view their badges',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Backward compatibility for old callers that pass status=approved.
    // Marketplace badges are not tied to skill_verifications statuses.
    if (status && status !== 'approved') {
      return NextResponse.json({ badges: [] })
    }

    const { data: badges, error } = await supabase
      .from('student_badges')
      .select('id, badge_type, is_active, awarded_at, revoked_at, revoke_reason')
      .eq('student_id', user.id)
      .order('awarded_at', { ascending: false })

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
