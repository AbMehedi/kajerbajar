// src/app/student/profile/page.jsx
// Phase 5 — Student Profile
// Displays earned money (wallet), KaajerScore, and Project Archive with Feedback.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import StatCard from '@/components/ui/StatCard'
import { Wallet, Star, Briefcase, Calendar, CheckCircle } from 'lucide-react'

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

  // 1. Fetch Student Stats
  const { data: student } = await supabase
    .from('student_profiles')
    .select('username, university, kaajerscore, wallet_balance, bio')
    .eq('id', user.id)
    .single()

  // 2. Fetch Project Archive (Completed Projects)
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      projects (
        id, title, budget_bdt, status,
        company_profiles ( legal_name )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'selected')

  const completedProjects = applications
    ?.map(app => app.projects)
    ?.filter(p => p.status === 'completed') || []

  // 3. Fetch Reviews received by the student
  const { data: reviews } = await supabase
    .from('project_reviews')
    .select('project_id, rating, comment, created_at, reviewer:users_profiles!reviewer_id(full_name)')
    .eq('reviewee_id', user.id)
    .order('created_at', { ascending: false })

  // 4. Fetch Reviews submitted by the student (to determine unlocked status)
  const { data: myReviews } = await supabase
    .from('project_reviews')
    .select('project_id')
    .eq('reviewer_id', user.id)

  const unlockedProjectIds = new Set(myReviews?.map(r => r.project_id) || [])

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <div className="glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Star className="w-16 h-16 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <p className="text-slate-400 text-sm font-medium">KaajerScore</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {(student?.kaajerscore ?? 0).toFixed(1)} <span className="text-lg text-slate-500 font-normal">/ 5.0</span>
            </p>
          </div>

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

        {/* ── Project Archive & Feedback ── */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8 mt-10">
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
                // Find review for this project
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
                          "{review.comment}"
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
