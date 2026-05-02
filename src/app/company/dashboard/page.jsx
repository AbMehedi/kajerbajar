// src/app/company/dashboard/page.jsx
// Story 1.2: Company dashboard with trade license upload
// Uses .gradient-brand and .glass from globals.css

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TradeLicenseUpload from './TradeLicenseUpload'

export const metadata = {
  title: 'Company Dashboard — KaajerBazar',
  description: 'Your KaajerBazar company workspace',
}

export default async function CompanyDashboard() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/unauthorized')

  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('legal_name, industry, verified, verification_status, verification_feedback, trade_license_url')
    .eq('id', user.id)
    .single()

  // Story 3.1: Fetch this company's projects (ordered newest first)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, deadline, created_at')
    .eq('company_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Story 3.2: Fetch latest 5 applicants across all of this company's projects.
  // Guard: .in() with an empty array is invalid in PostgREST - skip if no projects.
  // Join path: applications.student_id -> student_profiles -> users_profiles (full_name)
  let recentApplicants = []
  if (projects && projects.length > 0) {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, projects ( title ), student_profiles ( users_profiles ( full_name ) )')
      .in('project_id', projects.map((p) => p.id))
      .order('created_at', { ascending: false })
      .limit(5)
    recentApplicants = data ?? []
  }
  // Determine verification state for UI
  const verificationStatus = companyProfile?.verification_status || 'not_submitted'

  return (
    <div className="gradient-brand min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">কাজের বাজার</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{companyProfile?.legal_name}</span>
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

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">
          {companyProfile?.legal_name}
        </h1>
        <p className="text-slate-400 text-sm mb-2">{companyProfile?.industry ?? 'Industry not set'}</p>

        {/* ═══════════════════════════════════════════════════════════════════
            Verification Status Banners (Story 1.2)
        ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Not submitted: Show upload prompt */}
        {verificationStatus === 'not_submitted' && (
          <div className="bg-blue-500/10 border border-blue-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">📄 Upload Trade License</h3>
            <p className="text-slate-400 text-sm mb-4">
              To post projects and hire students, please upload your trade license for verification.
            </p>
            <TradeLicenseUpload userId={user.id} />
          </div>
        )}

        {/* Pending: Waiting for admin review */}
        {verificationStatus === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-yellow-300 font-semibold mb-2">⏳ Verification Pending</h3>
            <p className="text-slate-400 text-sm">
              Your trade license is under review. You&apos;ll be able to post projects once approved.
              This usually takes 1-2 business days.
            </p>
          </div>
        )}

        {/* Rejected: Show feedback + re-upload option */}
        {verificationStatus === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-red-300 font-semibold mb-2">❌ Verification Rejected</h3>
            <p className="text-slate-400 text-sm mb-2">
              <strong>Reason:</strong> {companyProfile?.verification_feedback || 'No feedback provided.'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Please upload a corrected document to try again.
            </p>
            <TradeLicenseUpload userId={user.id} />
          </div>
        )}

        {/* Verified: Success banner */}
        {verificationStatus === 'verified' && (
          <div className="bg-green-500/10 border border-green-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-green-300 font-semibold mb-2">✅ Company Verified</h3>
            <p className="text-slate-400 text-sm">
              Your company is verified! You can now post projects and hire students.
            </p>
          </div>
        )}

        {/* ═══ Story 3.1: Your Projects ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

          {/* ── Your Projects card (real data) ── */}
          <div className="glass rounded-xl p-6 flex flex-col gap-4">
            {/* Card header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">📋 Your Projects</h3>
              {verificationStatus === 'verified' ? (
                <a
                  href="/company/projects/new"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + Post a Project
                </a>
              ) : (
                <button
                  disabled
                  title="Verify your company first to post projects"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700/60 text-slate-500 text-xs font-semibold rounded-lg cursor-not-allowed opacity-60 border border-white/5"
                >
                  + Post a Project
                </button>
              )}
            </div>

            {/* Project list */}
            {!projects || projects.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {verificationStatus === 'verified'
                  ? 'No projects yet — post your first one!'
                  : 'Complete verification to post projects.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {projects.map((project) => {
                  const deadline = project.deadline
                    ? new Date(project.deadline).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : null
                  return (
                    <li
                      key={project.id}
                      className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate">
                          {project.title}
                        </p>
                        {deadline && (
                          <p className="text-slate-500 text-xs mt-0.5">Due {deadline}</p>
                        )}
                      </div>
                      {/* Status badge */}
                      <span
                        className={
                          project.status === 'open'
                            ? 'badge-success shrink-0 mt-0.5'
                            : project.status === 'closed'
                              ? 'badge-error shrink-0 mt-0.5'
                              : 'badge-warning shrink-0 mt-0.5'
                        }
                      >
                        {project.status ?? 'open'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* ── Story 3.2: Applicants card (real data) ── */}
          <div className="glass rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-white font-semibold">👥 Applicants</h3>

            {!recentApplicants || recentApplicants.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {(projects ?? []).length === 0
                  ? 'Post a project to start receiving applications.'
                  : 'No applications received yet.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {recentApplicants.map((app) => (
                  <li
                    key={app.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">
                        {app.student_profiles?.users_profiles?.full_name ?? 'Unknown Student'}
                      </p>
                      <p className="text-slate-500 text-xs truncate mt-0.5">
                        {app.projects?.title ?? '—'}
                      </p>
                    </div>
                    <ApplicantStatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            )}

            <p className="text-slate-600 text-xs">
              Full applicant management coming in Phase 4.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Story 3.2: Colour-coded badge for application status (company-side view)
function ApplicantStatusBadge({ status }) {
  const styles = {
    pending:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    selected: 'bg-green-500/15 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels = {
    pending:  'Pending',
    selected: 'Selected',
    rejected: 'Rejected',
  }
  const cls = styles[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  return (
    <span
      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
