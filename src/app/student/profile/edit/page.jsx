// src/app/student/profile/edit/page.jsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import EditProfileForm from './EditProfileForm'

export const metadata = {
  title: 'Edit Profile — KaajerBazar',
}

export default async function EditStudentProfilePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  const { data: student } = await supabase
    .from('student_profiles')
    .select('username, university, bio, portfolio_url') // We'll conditionally fetch about_text later if it exists
    .eq('id', user.id)
    .single()

  // Try to fetch about_text separately in case the column doesn't exist yet
  let about_text = ''
  try {
    const { data: aboutData } = await supabase
      .from('student_profiles')
      .select('about_text')
      .eq('id', user.id)
      .single()
    if (aboutData?.about_text) about_text = aboutData.about_text
  } catch (err) {
    // Ignore error if column missing
  }

  const initialData = {
    full_name: profile.full_name || '',
    username: student?.username || '',
    university: student?.university || '',
    bio: student?.bio || '',
    portfolio_url: student?.portfolio_url || '',
    about_text: about_text,
  }

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ''}
      activePath="/student/profile"
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Edit Profile</h1>
          <p className="text-slate-400 text-sm">Update your public profile details and portfolio.</p>
        </div>
        
        <EditProfileForm initialData={initialData} />
      </div>
    </DashboardShell>
  )
}
