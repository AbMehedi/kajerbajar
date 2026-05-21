import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import DashboardShell from '@/components/layout/DashboardShell'
import PublicShell from '@/components/layout/PublicShell'
import SearchClient from './SearchClient'

export const metadata = {
  title: 'Directory Search — KaajerBazar',
}

export default async function SearchPage({ searchParams }) {
  const supabase = await createServerSupabaseClient()
  const adminClient = await createAdminSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  let viewerName = ''
  if (user) {
    const { data: viewerProfile } = await supabase.from('users_profiles').select('role, full_name').eq('id', user.id).single()
    role = viewerProfile?.role
    viewerName = viewerProfile?.full_name ?? ''
  }

  // Fetch all students using adminClient to bypass RLS
  const { data: studentsRaw } = await adminClient
    .from('student_profiles')
    .select(`
      id, username, university, kaajerscore, bio,
      users_profiles!student_profiles_id_fkey(full_name, avatar_url)
    `)
    .order('kaajerscore', { ascending: false, nullsFirst: false })

  // Fetch all companies using adminClient to bypass RLS
  const { data: companiesRaw } = await adminClient
    .from('company_profiles')
    .select(`
      id, company_name:legal_name, industry, description,
      users_profiles!company_profiles_id_fkey(full_name, avatar_url)
    `)
    
  // Fetch reviews to calculate average ratings for companies
  const { data: reviews } = await adminClient
    .from('project_reviews')
    .select('reviewee_id, rating')
    
  const companies = companiesRaw?.map(c => {
    const compReviews = reviews?.filter(r => r.reviewee_id === c.id) || []
    const avgRating = compReviews.length > 0 
      ? compReviews.reduce((sum, r) => sum + r.rating, 0) / compReviews.length 
      : null
      
    return {
      ...c,
      full_name: c.users_profiles?.full_name,
      rating: avgRating,
      reviewCount: compReviews.length
    }
  }) || []
  
  const students = studentsRaw?.map(s => ({
    ...s,
    full_name: s.users_profiles?.full_name
  })) || []

  const Shell = role ? DashboardShell : PublicShell
  const shellProps = role
    ? { role, fullName: viewerName, activePath: '/search' }
    : { activePath: '/search' }

  return (
    <Shell {...shellProps}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Directory Search</h1>
          <p className="text-slate-400">Discover top students and companies on KaajerBazar.</p>
        </div>
        
        <SearchClient initialStudents={students} initialCompanies={companies} />
      </div>
    </Shell>
  )
}
