// src/app/student/workspace/[id]/page.jsx
// Phase 4 — Student Active Workspace
// Shows active project details, escrow status, and deliverable submission form.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import DeliverableSubmitForm from './DeliverableSubmitForm'
import DeliverableCard from './DeliverableCard'
import WorkspaceChat from '@/components/workspace/WorkspaceChat'
import ReviewForm from '@/components/workspace/ReviewForm'
import { Shield, Clock, CheckCircle, AlertCircle, FileText, Wallet, Star, Award, Download } from 'lucide-react'

// ── Certificate download button (client component) ────────────────────────
// We keep it inline to avoid an extra file for a small piece of interactivity.
import CertificateDownloadButton from '@/components/workspace/CertificateDownloadButton'

export async function generateMetadata({ params }) {
  return { title: 'Active Workspace — KaajerBazar' }
}

function EscrowStatusBadge({ status }) {
  const map = {
    not_deposited: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Not Deposited', icon: '⏳' },
    held:          { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: 'Held in Escrow', icon: '🔒' },
    released:      { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'Released', icon: '✅' },
    refunded:      { cls: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Refunded', icon: '↩️' },
  }
  const { cls, label, icon } = map[status] ?? map.not_deposited
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {icon} {label}
    </span>
  )
}

export default async function StudentWorkspacePage({ params }) {
  const { id: projectId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  // Verify student is the assigned person
  const { data: app } = await supabase
    .from('applications')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('student_id', user.id)
    .eq('status', 'selected')
    .single()

  if (!app) redirect('/student/dashboard')

  const [
    { data: project },
    { data: deliverables },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, description, budget_bdt, deadline, status, escrow_status, required_skills, company_profiles(legal_name)')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_deliverables')
      .select('id, submission_text, submission_file_url, file_name, file_size_bytes, file_mime_type, status, company_feedback, created_at, reviewed_at')
      .eq('project_id', projectId)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_reviews')
      .select('reviewer_id, rating, comment')
      .eq('project_id', projectId)
  ])

  if (!project) redirect('/student/dashboard')

  const myReview = reviews?.find(r => r.reviewer_id === user.id)
  const companyReview = reviews?.find(r => r.reviewer_id !== user.id)

  const isActive = project.status === 'in_progress'
  const isCompleted = project.status === 'completed'
  const COMMISSION_RATE = 0.10
  const studentPayout = Math.round((project.budget_bdt ?? 0) * (1 - COMMISSION_RATE) * 100) / 100

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ''}
      activePath="/student/workspace"
    >
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
            <a href="/student/workspace" className="hover:text-slate-300 transition-colors">Workspace</a>
            <span>/</span>
            <span className="text-slate-300">{project.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{project.title}</h1>
          <p className="text-slate-400 text-sm">
            by {project.company_profiles?.legal_name}
          </p>
        </div>

        {/* Project Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-400" />
              <p className="text-slate-500 text-xs">Your Payout</p>
            </div>
            <p className="text-white font-bold text-lg">৳{studentPayout.toLocaleString()}</p>
            <p className="text-slate-600 text-xs mt-0.5">after 10% platform fee</p>
          </div>

          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-yellow-400" />
              <p className="text-slate-500 text-xs">Escrow</p>
            </div>
            <EscrowStatusBadge status={project.escrow_status} />
          </div>

          <div className="glass rounded-xl p-4 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-slate-500 text-xs">Deadline</p>
            </div>
            <p className="text-white font-semibold text-sm">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'No deadline'}
            </p>
          </div>
        </div>

        {/* Required Skills */}
        {project.required_skills?.length > 0 && (
          <div className="glass rounded-xl p-5 mb-6 border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {project.required_skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Project Description */}
        <div className="glass rounded-xl p-5 mb-6 border border-white/10">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Project Brief</p>
          <p className="text-slate-300 text-sm leading-relaxed">{project.description}</p>
        </div>

        {/* Completed Banner */}
        {isCompleted && (
          <div className="space-y-6 mb-6">
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-5 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-semibold">Project Completed</p>
                <p className="text-slate-400 text-sm">
                  The company has approved your work and released the payment. Great job!
                </p>
              </div>
            </div>

            {/* Certificate Download — shown only when both reviews are complete */}
            {myReview && companyReview && (
              <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/8 to-yellow-500/10 border border-yellow-500/30 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Award className="w-7 h-7 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-semibold">Your Certificate is Ready!</p>
                    <p className="text-slate-400 text-sm">Download your official PDF Certificate of Completion.</p>
                  </div>
                </div>
                <CertificateDownloadButton projectId={projectId} />
              </div>
            )}

            {/* Review Section */}
            {companyReview ? (
              myReview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company's Review of Student */}
                  <div className="glass rounded-xl p-5 border border-white/10 relative overflow-hidden">
                    <h3 className="text-white font-semibold mb-2">{project.company_profiles?.legal_name} reviewed you</h3>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < companyReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    {companyReview.comment && (
                      <p className="text-slate-300 text-sm italic">&quot;{companyReview.comment}&quot;</p>
                    )}
                  </div>
                  {/* Student's Review of Company */}
                  <div className="glass rounded-xl p-5 border border-white/10 relative overflow-hidden">
                    <h3 className="text-white font-semibold mb-2">You reviewed {project.company_profiles?.legal_name}</h3>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < myReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    {myReview.comment && (
                      <p className="text-slate-300 text-sm italic">&quot;{myReview.comment}&quot;</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-5 border border-yellow-500/30 bg-yellow-500/5 text-center">
                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-400 font-semibold mb-1">The company has left you feedback!</p>
                    <p className="text-slate-400 text-sm">Submit your review for the company to unlock and read it.</p>
                  </div>
                  <ReviewForm projectId={projectId} targetName={project.company_profiles?.legal_name} />
                </div>
              )
            ) : (
              <div className="glass rounded-xl p-6 border border-white/10 text-center">
                <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Waiting for Company Review</h3>
                <p className="text-slate-400 text-sm">You can submit your feedback once the company submits theirs.</p>
              </div>
            )}
          </div>
        )}

        {/* Escrow waiting banner */}
        {project.escrow_status === 'not_deposited' && (
          <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/20 p-5 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Waiting for escrow deposit</p>
              <p className="text-slate-400 text-xs mt-0.5">
                The company needs to officially start the project before you can submit work.
              </p>
            </div>
          </div>
        )}

        {/* Deliverable submission form */}
        {isActive && (
          <div className="glass rounded-xl p-6 mb-6 border border-white/10">
            <h2 className="text-white font-semibold mb-1">📤 Submit Your Work</h2>
            <p className="text-slate-400 text-sm mb-5">
              Upload your deliverable. The company will review and approve it before releasing payment.
            </p>
            <DeliverableSubmitForm projectId={projectId} />
          </div>
        )}

        {/* Past submissions */}
        <div className="glass rounded-xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">
            📋 Submission History
            {deliverables && deliverables.length > 0 && (
              <span className="ml-2 text-slate-500 text-sm font-normal">({deliverables.length})</span>
            )}
          </h2>
          {!deliverables || deliverables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-500 text-sm">No submissions yet. Submit your work above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliverables.map((d) => (
                <DeliverableCard key={d.id} deliverable={d} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar (Right) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <WorkspaceChat 
                projectId={projectId} 
                currentUserProfile={{ id: user.id, full_name: profile.full_name, role: profile.role }} 
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  )
}
