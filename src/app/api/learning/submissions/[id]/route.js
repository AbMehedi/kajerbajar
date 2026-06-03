// src/app/api/learning/submissions/[id]/route.js
// GET /api/learning/submissions/[id]
// Returns a single submission by ID for the authenticated student.

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: submission, error } = await supabase
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
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  return NextResponse.json({ submission })
}
