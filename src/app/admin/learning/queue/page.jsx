// src/app/admin/learning/queue/page.jsx
// Admin Learning Queue — /admin/learning/queue
// Server component fetching pending submissions, rendered in LearningReviewQueue.

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import LearningReviewQueue from './LearningReviewQueue'

export const metadata = {
  title: 'Learning Review Queue — Admin | KaajerBazar',
}

export default async function AdminLearningQueue() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles').select("full_name, role, avatar_url").eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

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
        id, skill_name, skill_category, difficulty_level, deadline_hours
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
    console.error('[admin/learning/queue]', error)
  }

  // Parse ai_brief JSON for client
  const enriched = (submissions ?? []).map((sub) => {
    let ai_brief_parsed = null
    try {
      ai_brief_parsed = JSON.parse(sub.ai_brief)
    } catch {
      ai_brief_parsed = { project_title: 'Brief parse error', task_description: sub.ai_brief }
    }
    return { ...sub, ai_brief_parsed }
  })

  return (
    <DashboardShell avatarUrl={profile?.avatar_url} role="admin" fullName={profile?.full_name ?? ''}
      activePath="/admin/learning/queue">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Learning Module Review Queue</h1>
            <p className="text-slate-400 text-sm">
              Review student submissions and award verified skills.
              {enriched.length > 0 && (
                <span className="ml-2 bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full">
                  {enriched.length} pending
                </span>
              )}
            </p>
            <p className="text-slate-500 text-xs mt-1">⏱️ SLA target: review within 48 hours of submission.</p>
          </div>
        </div>

        <LearningReviewQueue submissions={enriched} />
      </div>
    </DashboardShell>
  )
}
