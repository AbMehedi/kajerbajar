import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import PublicShell from '@/components/layout/PublicShell'
import { Star, Building2, ShieldCheck, Briefcase, FileText } from 'lucide-react'

export async function generateMetadata({ params }) {
  const { id } = await params
  const adminClient = await createAdminSupabaseClient()
  const { data: profile } = await adminClient.from('company_profiles').select('legal_name').eq('id', id).single()
  return {
    title: profile ? `${profile.legal_name} — KaajerBazar` : 'Company Profile',
  }
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

export default async function CompanyPublicProfilePage({ params }) {
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

  // Fetch company data using adminClient to bypass RLS
  const { data: company } = await adminClient
    .from('company_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!company) {
    notFound()
  }

  const [
    { data: projects },
    { data: reviews }
  ] = await Promise.all([
    adminClient.from('projects').select('id, title, status').eq('company_id', id),
    adminClient.from('project_reviews').select('rating, comment, created_at, reviewer:users_profiles!reviewer_id(full_name)')
      .eq('reviewee_id', id).order('created_at', { ascending: false })
  ])

  const completedProjects = projects?.filter(p => p.status === 'completed') || []
  
  const avgRating = reviews?.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : null

  const isVerified = company.verification_status === 'verified'

  const Shell = role ? DashboardShell : PublicShell
  const shellProps = role
    ? { role, fullName: viewerName, activePath: null }
    : { activePath: null }

  return (
    <Shell {...shellProps}>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
              {company.legal_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{company.legal_name}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <Building2 className="w-4 h-4" /> {company.industry ?? 'Industry not listed'}
                </span>
                
                {avgRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="w-4 h-4 fill-yellow-400" /> {avgRating.toFixed(1)} 
                    <span className="text-slate-500 font-normal ml-1">({reviews.length})</span>
                  </span>
                )}
              </div>

              {company.description && (
                <p className="text-slate-300 text-sm mt-4 max-w-xl leading-relaxed whitespace-pre-wrap">
                  {company.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedProjects.length}</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Projects Completed</p>
            </div>
          </div>
          
          <div className="glass rounded-2xl border border-white/10 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{reviews?.length || 0}</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Reviews Received</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Feedback from Students
          </h2>
          
          {!reviews || reviews.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
              <Star className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-white font-medium">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="border border-white/10 bg-white/4 rounded-xl p-5">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-slate-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {review.comment && (
                    <div className="text-sm text-slate-300 italic mb-2">
                      &quot;{review.comment}&quot;
                    </div>
                  )}
                  <div className="text-xs text-slate-500 font-medium">
                    — {review.reviewer?.full_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Shell>
  )
}
