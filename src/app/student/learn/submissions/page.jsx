// src/app/student/learn/submissions/page.jsx
// Submission History — /student/learn/submissions

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import { ChevronLeft, ClipboardList } from 'lucide-react'

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  pass:     { label: '✓ Passed',       color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  fail:     { label: 'Failed',         color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  revision: { label: '↺ Revision',     color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
}

const LEVEL_COLORS = {
  rookie:  'text-green-400 bg-green-500/10 border-green-500/20',
  skilled: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  expert:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

export const metadata = {
  title: 'Submission History — KaajerBazar',
}

export default async function SubmissionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles').select('full_name, role').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/unauthorized')

  const { data: submissions } = await supabase
    .from('module_submissions')
    .select(`
      id, status, attempt_number, cooldown_until,
      deadline_at, submitted_at, reviewed_at, admin_feedback, created_at,
      learning_modules (skill_name, skill_category, difficulty_level, deadline_hours)
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const list = submissions ?? []

  return (
    <DashboardShell role="student" fullName={profile?.full_name ?? ''} activePath="/student/learn">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/student/learn" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
              <ChevronLeft className="w-4 h-4" /> Learn
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-purple-400" /> Submission History
            </h1>
          </div>
        </div>

        {/* ── Empty State ── */}
        {list.length === 0 ? (
          <div className="glass rounded-xl border border-white/10 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-semibold mb-1">No submissions yet</p>
            <p className="text-slate-400 text-sm mb-6">Start a learning module to begin your journey.</p>
            <Link href="/student/learn"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Browse Skills →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((sub) => {
              const sc   = STATUS_CONFIG[sub.status]   ?? STATUS_CONFIG.pending
              const lc   = LEVEL_COLORS[sub.learning_modules?.difficulty_level] ?? 'text-slate-400'
              const isSubmittedPending = sub.status === 'pending' && sub.submitted_at

              return (
                <div key={sub.id} className="glass rounded-xl border border-white/10 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold">
                          {sub.learning_modules?.skill_name ?? 'Unknown Skill'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${lc}`}>
                          {sub.learning_modules?.difficulty_level}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                          {isSubmittedPending ? '⏳ Under Review' : sc.label}
                        </span>
                        {sub.attempt_number > 1 && (
                          <span className="text-xs text-slate-500">Attempt {sub.attempt_number}</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        Started {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {sub.submitted_at && ` · Submitted ${new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        {sub.reviewed_at && ` · Reviewed ${new Date(sub.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>

                    {/* Cooldown badge */}
                    {sub.cooldown_until && new Date(sub.cooldown_until) > new Date() && (
                      <span className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2.5 py-1 rounded-lg">
                        🔒 Cooldown until {new Date(sub.cooldown_until).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>

                  {/* Admin feedback */}
                  {sub.admin_feedback && (
                    <div className="mt-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <p className="text-slate-400 text-xs font-medium mb-0.5">Admin Feedback:</p>
                      <p className="text-slate-300 text-sm">{sub.admin_feedback}</p>
                    </div>
                  )}

                  {/* Resubmit button for revision */}
                  {sub.status === 'revision' && (
                    <div className="mt-3">
                      <Link
                        href={`/student/learn/${sub.learning_modules?.skill_category}/${encodeURIComponent(sub.learning_modules?.skill_name ?? '')}`}
                        className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                        ↺ Go to Module to Resubmit
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  )
}
