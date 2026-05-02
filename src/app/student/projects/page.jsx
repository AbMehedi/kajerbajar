// src/app/student/projects/page.jsx
// Story 3.2: Student browses open micro-projects
// Server Component — fetches data server-side, then hands off to ProjectBrowser (client)

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProjectBrowser from '@/components/ProjectBrowser'

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch all open projects (RLS: authenticated_read_open_projects allows this)
  // Join company_profiles to get legal_name for each card
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

  // Fetch this student's existing applications (to pre-populate "Applied" state)
  const { data: myApplications } = await supabase
    .from('applications')
    .select('project_id')
    .eq('student_id', user.id)

  const appliedIds = (myApplications ?? []).map((a) => a.project_id)

  return (
    <div className="gradient-brand min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">কাজের বাজার</span>
        <div className="flex items-center gap-4">
          <Link
            href="/student/dashboard"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-slate-400 text-sm">{profile?.full_name}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Browse Projects</h1>
          <p className="text-slate-400 text-sm">
            Discover open micro-projects from verified companies and apply with your skills.
          </p>
        </div>

        {/* Empty state (no open projects at all) */}
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
      </main>
    </div>
  )
}
