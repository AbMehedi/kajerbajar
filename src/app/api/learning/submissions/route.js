// src/app/api/learning/submissions/route.js
// GET /api/learning/submissions
// Returns all submissions for the authenticated student, ordered by newest first.

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: submissions, error } = await supabase
    .from('module_submissions')
    .select(`
      id,
      status,
      attempt_number,
      cooldown_until,
      deadline_at,
      submitted_at,
      reviewed_at,
      admin_feedback,
      ai_brief,
      submission_description,
      submission_file_url,
      created_at,
      learning_modules (
        id,
        skill_name,
        skill_category,
        difficulty_level,
        deadline_hours
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/learning/submissions]', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }

  return NextResponse.json({ submissions: submissions ?? [] })
}
