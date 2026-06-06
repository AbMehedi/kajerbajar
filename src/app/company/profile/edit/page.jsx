import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import EditCompanyProfileForm from './EditCompanyProfileForm'

export const metadata = {
  title: 'Edit Company Profile — KaajerBazar',
}

export default async function EditCompanyProfilePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/unauthorized')

  const { data: company } = await supabase
    .from('company_profiles')
    .select('legal_name, username, industry, website, description')
    .eq('id', user.id)
    .single()

  const initialData = {
    full_name: profile.full_name || '',
    avatar_url: profile.avatar_url || '',
    username: company?.username || '',
    legal_name: company?.legal_name || '',
    industry: company?.industry || '',
    website: company?.website || '',
    description: company?.description || '',
  }

  return (
    <DashboardShell avatarUrl={profile?.avatar_url}
      role="company"
      fullName={company?.legal_name ?? profile?.full_name ?? ''}
      activePath="/company/profile"
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Edit Company Profile</h1>
          <p className="text-slate-400 text-sm">Update your company details and logo.</p>
        </div>
        
        <EditCompanyProfileForm initialData={initialData} />
      </div>
    </DashboardShell>
  )
}
