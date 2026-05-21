// src/app/student/profile/page.jsx
// Phase 5 — Student Profile
// Displays earned money (wallet), KaajerScore breakdown, and Project Archive with Feedback.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import { Wallet, Star, Briefcase, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'My Profile — KaajerBazar',
  description: 'Your KaajerBazar student profile and project archive.',
}

function StarRating({ rating }) {
  if (!rating) return null
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  )
}

// ── KaajerScore Breakdown Card ─────────────────────────────────────────────────
function KaajerScoreCard({ kaajerscore, skillScore, ratingScore, completionScore, hasActivity }) {
  const scoreDisplay =
    kaajerscore !== null && kaajerscore !== undefined
      ? kaajerscore.toFixed(1)
      : null

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
          <span className="text-xl">⭐</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">KaajerScore</h2>
          <p className="text-slate-400 text-xs">A trust score (0–100), updated after every project.</p>
        </div>
        {scoreDisplay && (
          <div className="ml-auto text-right">
            <p className="text-3xl font-black text-white leading-none">{scoreDisplay}</p>
            <p className="text-slate-500 text-xs">/ 100</p>
          </div>
        )}
      </div>

      {/* Component pills */}
      <div className="space-y-2 mb-4">
        {/* 30%: Skill Verification */}
        <div className="flex items-center gap-3 rounded-lg overflow-hidden border border-white/8">
          <div className="bg-teal-700 px-4 py-3 shrink-0 w-16 text-center">
            <p className="text-white font-bold text-sm">30%</p>
          </div>
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white/4">
            <p className="text-slate-200 text-sm font-medium">Skill Verification Average</p>
            {skillScore !== null ? (
              <span className="text-teal-400 text-xs font-semibold">{skillScore.toFixed(0)}%</span>
            ) : (
              <span className="text-slate-600 text-xs">—</span>
            )}
          </div>
        </div>

        {/* 50%: Project Ratings */}
        <div className="flex items-center gap-3 rounded-lg overflow-hidden border border-white/8">
          <div className="bg-slate-700 px-4 py-3 shrink-0 w-16 text-center">
            <p className="text-white font-bold text-sm">50%</p>
          </div>
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white/4">
            <p className="text-slate-200 text-sm font-medium">Average Project Ratings Received</p>
            {ratingScore !== null ? (
              <span className="text-blue-400 text-xs font-semibold">{ratingScore.toFixed(0)}%</span>
            ) : (
              <span className="text-slate-600 text-xs">—</span>
            )}
          </div>
        </div>

        {/* 20%: Completion Rate */}
        <div className="flex items-center gap-3 rounded-lg overflow-hidden border border-white/8">
          <div className="bg-yellow-600 px-4 py-3 shrink-0 w-16 text-center">
            <p className="text-white font-bold text-sm">20%</p>
          </div>
          <div className="flex-1 flex items-center justify-between px-3 py-2 bg-white/4">
            <p className="text-slate-200 text-sm font-medium">Project Completion Rate</p>
            {completionScore !== null ? (
              <span className="text-yellow-400 text-xs font-semibold">{completionScore.toFixed(0)}%</span>
            ) : (
              <span className="text-slate-600 text-xs">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      {!hasActivity && (
        <p className="text-slate-500 text-xs italic">
          New students show &apos;No score yet&apos; — fair for everyone just starting out.
        </p>
      )}
    </div>
  )
}

export default async function StudentProfilePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  // Parallel data fetches
  const [
    { data: student },
    { data: applications },
    { data: reviews },
    { data: myReviews },
    { data: verifications },
  ] = await Promise.all([
    // 1. Student stats
    supabase
      .from('student_profiles')
      .select('username, university, kaajerscore, wallet_balance, bio')
      .eq('id', user.id)
      .single(),

    // 2. Project archive (selected applications)
    supabase
      .from('applications')
      .select(`
        id,
        projects (
          id, title, budget_bdt, status,
          company_profiles ( legal_name )
        )
      `)
      .eq('student_id', user.id)
      .eq('status', 'selected'),

    // 3. Reviews received by student
    supabase
      .from('project_reviews')
      .select('project_id, rating, comment, created_at, reviewer:users_profiles!reviewer_id(full_name)')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false }),

    // 4. Reviews student submitted (unlocks double-blind)
    supabase
      .from('project_reviews')
      .select('project_id')
      .eq('reviewer_id', user.id),

    // 5. Skill verifications (for breakdown)
    supabase
      .from('skill_verifications')
      .select('status')
      .eq('student_id', user.id)
      .in('status', ['approved', 'rejected']),
  ])

  const completedProjects = applications
    ?.map(app => app.projects)
    ?.filter(p => p?.status === 'completed') || []

  const unlockedProjectIds = new Set(myReviews?.map(r => r.project_id) || [])

  // ── KaajerScore component breakdown (mirrors kaajerscore.js for display) ──
  const totalClosed = verifications?.length ?? 0
  const totalApproved = verifications?.filter(v => v.status === 'approved').length ?? 0
  const skillScore = totalClosed > 0 ? (totalApproved / totalClosed) * 100 : null

  const unlockedIds = Array.from(unlockedProjectIds)
  const unlockedRatings = reviews?.filter(r => unlockedIds.includes(r.project_id)) ?? []
  let ratingScore = null
  if (unlockedRatings.length > 0) {
    const avgStars = unlockedRatings.reduce((s, r) => s + r.rating, 0) / unlockedRatings.length
    ratingScore = ((avgStars - 1) / 4) * 100
  }

  const assignedCount = applications?.length ?? 0
  const closedApps = applications?.filter(
    a => a.projects?.status === 'completed' || a.projects?.status === 'cancelled'
  ) ?? []
  let completionScore = null
  if (closedApps.length > 0) {
    completionScore = (completedProjects.length / closedApps.length) * 100
  } else if (assignedCount > 0) {
    completionScore = 100
  }

  const hasActivity = skillScore !== null || ratingScore !== null || completionScore !== null

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ''}
      activePath="/student/profile"
    >
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{profile.full_name}</h1>
            <p className="text-purple-400 font-medium">@{student?.username}</p>
            <p className="text-slate-400 text-sm mt-1">{student?.university ?? 'No university added'}</p>

            {student?.bio && (
              <p className="text-slate-300 text-sm mt-4 max-w-2xl leading-relaxed">
                {student.bio}
              </p>
            )}
          </div>

          <a href="/student/profile/edit" className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors">
            Edit Profile
          </a>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wallet */}
          <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-16 h-16 text-green-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-green-400" />
              <p className="text-slate-400 text-sm font-medium">Total Earned</p>
            </div>
            <p className="text-3xl font-bold text-white">
              <span className="text-xl mr-1">৳</span>
              {(student?.wallet_balance ?? 0).toLocaleString()}
            </p>
          </div>

          {/* Completed Jobs */}
          <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <p className="text-slate-400 text-sm font-medium">Completed Jobs</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {completedProjects.length}
            </p>
          </div>
        </div>

        {/* ── KaajerScore Breakdown Card ── */}
        <KaajerScoreCard
          kaajerscore={student?.kaajerscore}
          skillScore={skillScore}
          ratingScore={ratingScore}
          completionScore={completionScore}
          hasActivity={hasActivity}
        />

        {/* ── Project Archive & Feedback ── */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Archive</h2>
              <p className="text-slate-400 text-sm">Completed jobs and feedback</p>
            </div>
          </div>

          {completedProjects.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-white font-medium">No completed projects yet.</p>
              <p className="text-slate-400 text-sm mt-1">Keep applying and deliver great work!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedProjects.map((project) => {
                const review = reviews?.find((r) => r.project_id === project.id)
                const isUnlocked = unlockedProjectIds.has(project.id)

                return (
                  <div key={project.id} className="border border-white/10 bg-white/4 rounded-xl p-5 transition-colors hover:bg-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                      {/* Left: Project Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {project.title}
                        </h3>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <span className="text-purple-400 font-medium">{project.company_profiles?.legal_name}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span>Budget: ৳{project.budget_bdt?.toLocaleString() ?? '0'}</span>
                        </p>
                      </div>

                      {/* Right: Star Rating */}
                      <div className="shrink-0">
                        {!review ? (
                          <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-slate-400 font-medium">
                            No review left
                          </span>
                        ) : isUnlocked ? (
                          <div className="flex flex-col items-start sm:items-end">
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-slate-500 mt-1">
                              {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs px-2.5 py-1 flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-medium">
                            <Star className="w-3 h-3" />
                            Hidden pending review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback Comment */}
                    {review && isUnlocked && review.comment && (
                      <div className="mt-4 bg-slate-900/50 rounded-lg p-4 border border-white/5">
                        <p className="text-slate-300 text-sm italic">
                          &quot;{review.comment}&quot;
                        </p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          — {review.reviewer?.full_name}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  )
}
