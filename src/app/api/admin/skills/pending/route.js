// src/app/api/admin/skills/pending/route.js
// GET /api/admin/skills/pending
// Legacy compatibility endpoint.
// Mirrors the learning-module review queue so old clients do not read stale tables.

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['admin'],
      forbiddenMessage: 'Admins only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase } = auth

    const { data: submissions, error } = await supabase
      .from('module_submissions')
      .select(`
        id,
        status,
        ai_brief,
        submission_description,
        submission_file_url,
        submitted_at,
        created_at,
        student_id,
        learning_modules (skill_category),
        users_profiles:student_id (
          full_name,
          email,
          student_profiles (
            username,
            university
          )
        )
      `)
      .eq('status', 'pending')
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: true })

    if (error) throw error

    const normalized = (submissions ?? []).map((sub) => ({
      id: sub.id,
      skill_category: sub.learning_modules?.skill_category ?? null,
      status: sub.status,
      ai_brief: sub.ai_brief,
      submission_text: sub.submission_description ?? null,
      submission_file_url: sub.submission_file_url ?? null,
      submitted_at: sub.submitted_at,
      created_at: sub.created_at,
      student_id: sub.student_id,
      users_profiles: sub.users_profiles ?? null,
      student_profiles: sub.users_profiles?.student_profiles ?? null,
    }))

    return NextResponse.json(
      { submissions: normalized, deprecated: true, replacement: '/api/admin/learning/queue' },
      { status: 200 }
    )
  } catch (err) {
    console.error('[admin/skills/pending]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
