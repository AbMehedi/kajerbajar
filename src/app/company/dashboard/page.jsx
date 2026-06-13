// src/app/company/dashboard/page.jsx
// D2: Company dashboard — 3-step verification progress bar, improved projects table.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TradeLicenseUpload from './TradeLicenseUpload'
import ApplicationsPanel from './ApplicationsPanel'
import DashboardShell from '@/components/layout/DashboardShell'
import EmptyState from '@/components/ui/EmptyState'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'
import { CheckCircle, Circle, Clock, PlusCircle, Star, Briefcase, FileText, Building2, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Company Dashboard — KaajerBazar',
  description: 'Your KaajerBazar company workspace',
}

// ── 3-step verification progress bar ─────────────────────────────────────────

function VerificationProgressBar({ status }) {
  const steps = [
    { key: 'not_submitted', label: 'Submit License', shortLabel: '① Submit' },
    { key: 'pending',       label: 'Under Review',   shortLabel: '② Review' },
    { key: 'verified',      label: 'Verified',        shortLabel: '③ Done'   },
  ]

  // Map current status → step index (0-based)
  const stepIndex = {
    not_submitted: 0,
    pending:       1,
    rejected:      0,  // back to step 0 to re-submit
    verified:      3,  // mapped to 3 so all steps (idx < 3) are marked 'done'
  }[status] ?? 0

  return (
    <div className="glass rounded-xl p-5 mb-6 border border-white/10">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
        Verification Progress
      </p>
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const done   = idx < stepIndex
          const active = idx === stepIndex && status !== 'rejected'
          const isLast = idx === steps.length - 1

          return (
            <>
              {/* Step pill — flex-1 so each circle gets equal space */}
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    done   ? 'bg-green-500/20 border-green-500 text-green-400'
                    : active ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                    : 'bg-white/5 border-white/20 text-slate-500'
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <p className={`text-[10px] mt-1 whitespace-nowrap font-medium ${
                  done ? 'text-green-400' : active ? 'text-purple-300' : 'text-slate-600'
                }`}>
                  {step.label}
                </p>
              </div>

              {/* Connector line — flex-1 between the circles */}
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-3 rounded-full transition-colors ${
                  done ? 'bg-green-500/40' : 'bg-white/10'
                }`} />
              )}
            </>
          )
        })}
      </div>

      {/* Status sub-message */}
      {status === 'rejected' && (
        <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ❌ Your license was rejected. Please re-upload a corrected document below.
        </p>
      )}
      {status === 'pending' && (
        <p className="mt-3 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          ⏳ Under review — usually takes 1–2 business days.
        </p>
      )}
      {status === 'verified' && (
        <p className="mt-3 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          ✅ Verified! You can now post projects and hire students.
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

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

  const [
    { data: companyProfile },
    { data: projects },
    { data: completedProjectsData },
    { data: reviewsData }
  ] = await Promise.all([
    supabase
      .from('company_profiles')
      .select('legal_name, industry, verified, verification_status, verification_feedback, trade_license_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, title, status, deadline, created_at')
      .eq('company_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('projects')
      .select('id')
      .eq('company_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('project_reviews')
      .select('rating')
      .eq('reviewee_id', user.id)
  ])

  const verificationStatus = companyProfile?.verification_status || 'not_submitted'
  const isVerified = verificationStatus === 'verified'
  
  const completedProjects = completedProjectsData || []
  const reviews = reviewsData || []
  
  const totalCompleted = completedProjects.length
  const totalFeedbacks = reviews.length
  const avgRating = totalFeedbacks > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalFeedbacks 
    : null

  return (
    <DashboardShell
      role="company"
      fullName={companyProfile?.legal_name ?? profile?.full_name ?? ''}
      activePath="/company/dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {companyProfile?.legal_name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {companyProfile?.legal_name}
              </h1>
              {isVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{companyProfile?.industry ?? 'Industry not set'}</p>
          </div>
        </div>
        
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            label="Projects Completed"
            value={totalCompleted.toString()}
            color="blue"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Feedback Received"
            value={totalFeedbacks.toString()}
            color="purple"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Average Rating"
            value={avgRating !== null ? avgRating.toFixed(1) : 'No rating'}
            unit={avgRating !== null ? '/ 5.0' : ''}
            color="yellow"
          />
        </div>

        {/* ── 3-step verification progress bar ── */}
        <VerificationProgressBar status={verificationStatus} />

        {/* ── Upload form (not_submitted or rejected states) ── */}
        {(verificationStatus === 'not_submitted' || verificationStatus === 'rejected') && (
          <div className="glass rounded-xl p-6 mb-6 border border-white/10">
            <h3 className="text-white font-semibold mb-1">📄 Upload Trade License</h3>
            <p className="text-slate-400 text-sm mb-4">
              Upload your trade license to start the verification process.
            </p>
            <TradeLicenseUpload userId={user.id} />
          </div>
        )}

        {/* ── Projects table ── */}
        <div className="glass rounded-xl p-6 mt-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">📋 Your Projects</h3>
            {isVerified ? (
              <Link
                href="/company/projects/new"
                className="inline-flex items-center gap-1.5 kb-btn-primary text-xs px-4 py-2 rounded-lg font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post a Project
              </Link>
            ) : (
              <button
                disabled
                title="Verify your company first"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700/60 text-slate-500 text-xs font-semibold rounded-lg cursor-not-allowed opacity-60 border border-white/5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post a Project
              </button>
            )}
          </div>

          {!projects || projects.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title={isVerified ? 'No projects yet' : 'Complete verification first'}
              description={
                isVerified
                  ? 'Post your first project and start hiring university talent.'
                  : 'Your company needs to be verified before posting projects.'
              }
              actionLabel={isVerified ? 'Post First Project' : undefined}
              actionHref={isVerified ? '/company/projects/new' : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-white/8">
                    <th className="text-left pb-2 font-medium">Title</th>
                    <th className="text-left pb-2 font-medium hidden sm:table-cell">Deadline</th>
                    <th className="text-right pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const deadline = project.deadline
                      ? new Date(project.deadline).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : null

                    const daysLeft = project.deadline
                      ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                      : null

                    return (
                      <tr key={project.id} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 pr-4">
                          <p className="text-slate-200 font-medium truncate max-w-[200px]">{project.title}</p>
                        </td>
                        <td className="py-2.5 pr-4 hidden sm:table-cell">
                          {deadline ? (
                            <div>
                              <p className="text-slate-400 text-xs">{deadline}</p>
                              {daysLeft !== null && daysLeft >= 0 && (
                                <p className={`text-xs mt-0.5 flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-600'}`}>
                                  <Clock className="w-3 h-3" />
                                  {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                                </p>
                              )}
                              {daysLeft !== null && daysLeft < 0 && (
                                <p className="text-xs mt-0.5 text-slate-600">Expired</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">No deadline</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={
                            project.status === 'open'
                              ? 'badge-success'
                              : project.status === 'closed'
                                ? 'badge-error'
                                : 'badge-warning'
                          }>
                            {project.status ?? 'open'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Applications panel ── */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Applications</h2>
          <ApplicationsPanel />
        </div>
      </div>
    </DashboardShell>
  )
}
