// src/app/api/admin/learning/queue/route.js
// GET /api/admin/learning/queue
// Admin only — returns all pending (submitted) module submissions for review.
// "Pending" in admin context means: status=pending AND submitted_at IS NOT NULL
// Ordered by submitted_at ASC (oldest first = FIFO review queue)

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role to bypass RLS
  const adminClient = createServiceRoleClient()

  const { data: submissions, error } = await adminClient
    .from('module_submissions')
    .select(`
      id,
      status,
      attempt_number,
      ai_brief,
      submission_description,
      submission_file_url,
      submitted_at,
      deadline_at,
      created_at,
      student_id,
      module_id,
      learning_modules (
        id,
        skill_name,
        skill_category,
        difficulty_level,
        deadline_hours
      ),
      users_profiles:student_id (
        id,
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

  if (error) {
    console.error('[GET /api/admin/learning/queue]', error)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }

  // Parse ai_brief JSON for each submission (stored as string in DB)
  const enriched = (submissions ?? []).map((sub) => {
    let briefObj = null
    try {
      briefObj = JSON.parse(sub.ai_brief)
    } catch {
      briefObj = { project_title: 'Brief unavailable', task_description: sub.ai_brief }
    }
    return { ...sub, ai_brief_parsed: briefObj }
  })

  return NextResponse.json({ submissions: enriched, total: enriched.length })
}
