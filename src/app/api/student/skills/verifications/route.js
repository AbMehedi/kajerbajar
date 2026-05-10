// src/app/api/student/skills/verifications/route.js
// GET /api/student/skills/verifications
// Returns all skill verifications for the logged-in student

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Students only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    const { data: verifications, error } = await supabase
      .from('skill_verifications')
      .select('id, skill_category, status, ai_brief, submission_text, submission_file_url, submitted_at, admin_feedback, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ verifications }, { status: 200 })
  } catch (err) {
    console.error('[student/skills/verifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
