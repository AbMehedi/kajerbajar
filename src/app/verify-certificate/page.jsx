import { createServerSupabaseClient } from '@/lib/supabase-server'
import DashboardShell from '@/components/layout/DashboardShell'
import VerifyCertificateClient from './VerifyCertificateClient'

export const metadata = {
  title: 'Verify Certificate — KaajerBazar',
}

export default async function VerifyCertificatePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  let viewerName = ''
  let avatarUrl = null
  if (user) {
    const { data: viewerProfile } = await supabase.from('users_profiles').select('role, full_name, avatar_url').eq('id', user.id).single()
    role = viewerProfile?.role
    viewerName = viewerProfile?.full_name ?? ''
    avatarUrl = viewerProfile?.avatar_url
  }

  return (
    <DashboardShell
      role={role}
      fullName={viewerName}
      avatarUrl={avatarUrl}
      activePath="/verify-certificate"
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        <VerifyCertificateClient />
      </div>
    </DashboardShell>
  )
}
