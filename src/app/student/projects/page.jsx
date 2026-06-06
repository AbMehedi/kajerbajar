// src/app/student/projects/page.jsx
// Story 3.2: Student browses open micro-projects
// Server Component — fetches data server-side, then hands off to ProjectBrowser (client)

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProjectBrowser from '@/components/ProjectBrowser'
import DashboardShell from '@/components/layout/DashboardShell'

export const metadata = {
  title: 'Browse Projects — KaajerBazar',
  description: 'Discover open micro-projects posted by verified companies and submit your application.',
}

export default async function StudentProjectsPage() {
  const supabase = await createServerSupabaseClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role guard
  const { data: profile } = await supabase
    .from('users_profiles')
    .select("full_name, role, avatar_url")
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch all open projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      required_skills,
      budget_bdt,
      duration_weeks,
      deadline,
      company_profiles ( legal_name )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Fetch this student's existing applications
  const { data: myApplications } = await supabase
    .from('applications')
    .select('project_id')
    .eq('student_id', user.id)

  const appliedIds = (myApplications ?? []).map((a) => a.project_id)

  return (
    <DashboardShell avatarUrl={profile?.avatar_url}
      role="student"
      fullName={profile?.full_name ?? ""}
      activePath="/student/projects"
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Browse Projects</h1>
          <p className="text-slate-400 text-sm">
            Discover open micro-projects from verified companies and apply with your skills.
          </p>
        </div>

        {/* Empty state */}
        {(!projects || projects.length === 0) ? (
          <div className="glass rounded-xl p-10 text-center">
            <p className="text-4xl mb-4">📭</p>
            <h2 className="text-white font-semibold mb-2">No open projects yet</h2>
            <p className="text-slate-500 text-sm">
              Check back soon — verified companies are posting micro-projects regularly.
            </p>
          </div>
        ) : (
          <ProjectBrowser
            projects={projects}
            appliedIds={appliedIds}
          />
        )}
      </div>
    </DashboardShell>
  )
}
