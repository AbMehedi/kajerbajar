// src/app/api/student/skills/verifications/route.js
// GET /api/student/skills/verifications
// Legacy compatibility endpoint.
// Returns learning-module submissions in the older response shape.

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Students only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    const { data: verifications, error } = await supabase
      .from('module_submissions')
      .select(`
        id,
        status,
        ai_brief,
        submission_description,
        submission_file_url,
        submitted_at,
        admin_feedback,
        created_at,
        learning_modules (skill_category)
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const normalized = (verifications ?? []).map((row) => ({
      id: row.id,
      skill_category: row.learning_modules?.skill_category ?? null,
      status: row.status,
      ai_brief: row.ai_brief,
      submission_text: row.submission_description ?? null,
      submission_file_url: row.submission_file_url ?? null,
      submitted_at: row.submitted_at,
      admin_feedback: row.admin_feedback,
      created_at: row.created_at,
    }))

    return NextResponse.json(
      { verifications: normalized, deprecated: true, replacement: '/api/learning/submissions' },
      { status: 200 }
    )
  } catch (err) {
    console.error('[student/skills/verifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
