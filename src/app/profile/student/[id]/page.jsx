import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import PublicShell from '@/components/layout/PublicShell'
import CopyButton from '@/components/CopyButton'
import { Wallet, Star, Briefcase, CheckCircle, Award, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata({ params }) {
  const { id } = await params
  const adminClient = await createAdminSupabaseClient()
  const { data: student } = await adminClient
    .from('student_profiles')
    .select('users_profiles!student_profiles_id_fkey(full_name, role)')
    .eq('id', id)
    .single()
  const fullName = student?.users_profiles?.full_name
  return {
    title: fullName ? `${fullName}'s Profile — KaajerBazar` : 'Student Profile',
  }
}

function StarRating({ rating }) {
  if (!rating) return null
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  )
}

export default async function StudentPublicProfilePage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const adminClient = await createAdminSupabaseClient()

  // Get current viewer
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  let viewerName = ''
  if (user) {
    const { data: viewerProfile } = await supabase.from('users_profiles').select('role, full_name').eq('id', user.id).single()
    role = viewerProfile?.role
    viewerName = viewerProfile?.full_name ?? ''
  }

  const [
    { data: student },
    { data: applications },
    { data: reviews },
    { data: verifications },
    { data: certificates },
    { data: studentBadge },
  ] = await Promise.all([
    adminClient.from('student_profiles').select(`
      *,
      users_profiles!student_profiles_id_fkey(full_name, role)
    `).eq('id', id).single(),
    adminClient.from('applications').select(`
        id,
        projects ( id, title, budget_bdt, status, company_profiles ( legal_name ) )
      `).eq('student_id', id).eq('status', 'selected'),
    adminClient.from('project_reviews').select('project_id, rating, comment, created_at, reviewer:users_profiles!reviewer_id(full_name)')
      .eq('reviewee_id', id).order('created_at', { ascending: false }),
    adminClient.from('skill_verifications').select('status, skill_category').eq('student_id', id).eq('status', 'approved'),
    adminClient.from('certificates').select('id, project_id, issued_at').eq('student_id', id),
    adminClient.from('student_badges').select('badge_type, is_active').eq('student_id', id).eq('is_active', true).order('awarded_at', { ascending: false }).limit(1).maybeSingle()
  ])

  const profile = student?.users_profiles
  if (!student) {
    console.error('[StudentProfile] notFound for id:', id, '| student:', JSON.stringify(student))
    notFound()
  }

  if (profile?.role && profile.role !== 'student') {
    console.error('[StudentProfile] notFound for id:', id, '| profile:', JSON.stringify(profile))
    notFound()
  }

  // Try fetching about_text if schema is updated
  let aboutText = student?.about_text
  if (aboutText === undefined) {
    try {
      const { data } = await adminClient.from('student_profiles').select('about_text').eq('id', id).single()
      if (data?.about_text) aboutText = data.about_text
    } catch(e) {}
  }

  const completedProjects = applications?.map(app => app.projects)?.filter(p => p?.status === 'completed') || []
  
  // Public profile always shows reviews (we bypass double-blind for public view as it is the student's public rep)
  // Actually, only show reviews for projects that are completed and have a review.
  
  const scoreDisplay = student?.kaajerscore !== null && student?.kaajerscore !== undefined ? student.kaajerscore.toFixed(1) : '—'

  const Shell = role ? DashboardShell : PublicShell
  const shellProps = role
    ? { role, fullName: viewerName, activePath: null }
    : { activePath: null }

  const BADGE_LABELS = {
    rising_talent:   { label: '🌟 Rising Star',   color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    top_rated:       { label: '⭐ Top Rated',      color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    top_rated_plus:  { label: '🏆 Elite',         color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  }
  const activeBadge = studentBadge ?? null

  return (
    <Shell {...shellProps}>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20 shrink-0">
              {(profile?.full_name ?? 'S').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-bold text-white">{profile?.full_name ?? 'Student'}</h1>
                {activeBadge && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold \${BADGE_LABELS[activeBadge.badge_type]?.color ?? 'bg-white/10 text-white border-white/20'}`}>
                    {BADGE_LABELS[activeBadge.badge_type]?.label ?? activeBadge.badge_type}
                  </span>
                )}
              </div>
              <p className="text-purple-400 font-medium">@{student?.username}</p>
              <p className="text-slate-400 text-sm mt-1">{student?.university ?? 'University not listed'}</p>
              {student?.bio && (
                <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                  {student.bio}
                </p>
              )}
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col gap-2">
            <div className="glass px-5 py-3 rounded-xl border border-white/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">KaajerScore</p>
              <p className="text-3xl font-black text-white">{scoreDisplay}</p>
            </div>
            {student?.portfolio_url && (
              <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-center px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/5">
                 View Portfolio ↗
               </a>
            )}
          </div>
        </div>

        {/* About Section */}
        {aboutText && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-white font-semibold mb-3">About</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {aboutText}
            </p>
          </div>
        )}

        {/* Skills & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 glass rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Verified Skills
            </h3>
            {verifications && verifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {verifications.map((v, idx) => (
                  <span key={idx} className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold rounded-full">
                    {v.skill_category}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No skills verified yet.</p>
            )}
          </div>
          
          <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedProjects.length}</p>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Completed Jobs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 border-t border-white/10 pt-4 mt-2">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 shrink-0">
                <Wallet className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">৳{(student?.wallet_balance ?? 0).toFixed(0)}</p>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio / Completed Projects */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6">Work History</h2>
          
          {completedProjects.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-white font-medium">No completed projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedProjects.map((project) => {
                const review = reviews?.find(r => r.project_id === project.id)
                return (
                  <div key={project.id} className="border border-white/10 bg-white/4 rounded-xl p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <span className="text-purple-400 font-medium">{project.company_profiles?.legal_name}</span>
                        </p>
                      </div>
                      {review && (
                        <div className="flex flex-col items-end">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-slate-500 mt-1">
                            {new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                    {review && review.comment && (
                      <div className="mt-4 bg-white/5 rounded-lg p-4 text-sm text-slate-300 italic">
                        &quot;{review.comment}&quot;
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
           <h2 className="text-xl font-bold text-white mb-6">Certificates</h2>
           
           {!certificates || certificates.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
              <Award className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-white font-medium">No certificates yet.</p>
            </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => {
                const project = completedProjects.find(p => p.id === cert.project_id)
                const projectTitle = project?.title || 'Unknown Project'
                return (
                  <Link href={`/verify-certificate?id=${cert.id}`} key={cert.id} className="block border border-white/10 bg-white/4 rounded-xl p-5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-1">{projectTitle}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">ID: KB-{cert.id?.slice(0, 8).toUpperCase()}</span>
                          <CopyButton
                            value={`KB-${cert.id?.slice(0, 8).toUpperCase()}`}
                            className="text-slate-400 hover:text-slate-200 underline underline-offset-2"
                          />
                        </div>
                        <p className="text-slate-400 text-xs">Verify Certificate →</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
           )}
        </div>

      </div>
    </Shell>
  )
}
