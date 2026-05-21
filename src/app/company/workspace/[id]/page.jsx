// src/app/company/workspace/[id]/page.jsx
// Phase 4 — Company Project Workspace
// Shows active project, deliverables from the student, and payment release controls.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import DeliverableReviewPanel from './DeliverableReviewPanel'
import WorkspaceChat from '@/components/workspace/WorkspaceChat'
import ReviewForm from '@/components/workspace/ReviewForm'
import StatusTimeline from '@/components/workspace/StatusTimeline'
import MilestoneTracker from '@/components/workspace/MilestoneTracker'
import { Shield, CheckCircle, Clock, Wallet, FileText, Star } from 'lucide-react'

export async function generateMetadata({ params }) {
  return { title: 'Project Workspace — KaajerBazar' }
}

function EscrowBadge({ status }) {
  const map = {
    not_deposited: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: '⏳ Not Deposited' },
    held:          { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: '🔒 Held in Escrow' },
    released:      { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: '✅ Released' },
    refunded:      { cls: 'bg-red-500/15 text-red-400 border-red-500/30', label: '↩️ Refunded' },
  }
  const { cls, label } = map[status] ?? map.not_deposited
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

export default async function CompanyWorkspacePage({ params }) {
  const { id: projectId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/unauthorized')

  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('legal_name')
    .eq('id', user.id)
    .single()

  // Fetch project and verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, description, budget_bdt, deadline, status, escrow_status, required_skills, company_id')
    .eq('id', projectId)
    .single()

  if (!project || project.company_id !== user.id) redirect('/company/dashboard')

  // Fetch selected student profile
  const { data: selectedApp } = await supabase
    .from('applications')
    .select('student_id, student_profiles(username, users_profiles(full_name, email)), created_at')
    .eq('project_id', projectId)
    .eq('status', 'selected')
    .single()

  // Fetch deliverables
  const { data: deliverables } = await supabase
    .from('project_deliverables')
    .select('id, submission_text, submission_file_url, status, company_feedback, created_at, reviewed_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  // Fetch both reviews (company and student)
  const { data: reviews } = await supabase
    .from('project_reviews')
    .select('reviewer_id, rating, comment')
    .eq('project_id', projectId)

  const myReview = reviews?.find(r => r.reviewer_id === user.id)
  const studentReview = reviews?.find(r => r.reviewer_id !== user.id)

  const isCompleted = project.status === 'completed'
  const isInProgress = project.status === 'in_progress'
  const COMMISSION_RATE = 0.10
  const studentPayout = Math.round((project.budget_bdt ?? 0) * (1 - COMMISSION_RATE) * 100) / 100
  const commission = Math.round((project.budget_bdt ?? 0) * COMMISSION_RATE * 100) / 100

  const studentName = selectedApp?.student_profiles?.users_profiles?.full_name ?? 'Student'
  const studentUsername = selectedApp?.student_profiles?.username ?? '—'
  const pendingDeliverables = (deliverables ?? []).filter(d => d.status === 'pending')

  return (
    <DashboardShell
      role="company"
      fullName={companyProfile?.legal_name ?? profile?.full_name ?? ''}
      activePath="/company/workspace"
    >
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
            <a href="/company/workspace" className="hover:text-slate-300 transition-colors">Workspace</a>
            <span>/</span>
            <span className="text-slate-300">{project.title}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{project.title}</h1>
              <p className="text-slate-400 text-sm">
                Assigned to{' '}
                <span className="text-white font-medium">{studentName}</span>
                <span className="text-slate-600"> @{studentUsername}</span>
              </p>
            </div>
            {pendingDeliverables.length > 0 && (
              <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
                {pendingDeliverables.length} pending review
              </span>
            )}
          </div>
        </div>

        <StatusTimeline projectStatus={project.status} escrowStatus={project.escrow_status} />

        {/* Project Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-400" />
              <p className="text-slate-500 text-xs">Budget</p>
            </div>
            <p className="text-white font-bold">৳{(project.budget_bdt ?? 0).toLocaleString()}</p>
          </div>

          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-yellow-400" />
              <p className="text-slate-500 text-xs">Escrow</p>
            </div>
            <EscrowBadge status={project.escrow_status} />
          </div>

          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-400" />
              <p className="text-slate-500 text-xs">Submissions</p>
            </div>
            <p className="text-white font-bold">{deliverables?.length ?? 0}</p>
          </div>

          <div className="glass rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <p className="text-slate-500 text-xs">Deadline</p>
            </div>
            <p className="text-white text-xs font-semibold">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : 'None'}
            </p>
          </div>
        </div>

        {/* Completed Banner */}
        {isCompleted && (
          <div className="space-y-6 mb-6">
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-5 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-semibold">Project Completed</p>
                <p className="text-slate-400 text-sm">
                  ৳{studentPayout.toLocaleString()} released to {studentName} · ৳{commission.toLocaleString()} platform fee.
                </p>
              </div>
            </div>

            {/* Review Section */}
            {myReview ? (
              studentReview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company's Review of Student */}
                  <div className="glass rounded-xl p-5 border border-white/10 relative overflow-hidden">
                    <h3 className="text-white font-semibold mb-2">You reviewed {studentName}</h3>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < myReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    {myReview.comment && (
                      <p className="text-slate-300 text-sm italic">&quot;{myReview.comment}&quot;</p>
                    )}
                  </div>
                  {/* Student's Review of Company */}
                  <div className="glass rounded-xl p-5 border border-white/10 relative overflow-hidden">
                    <h3 className="text-white font-semibold mb-2">{studentName} reviewed you</h3>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < studentReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    {studentReview.comment && (
                      <p className="text-slate-300 text-sm italic">&quot;{studentReview.comment}&quot;</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass rounded-xl p-6 border border-white/10 text-center">
                  <Star className="w-10 h-10 text-yellow-400/50 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-1">Feedback Submitted</h3>
                  <p className="text-slate-400 text-sm">Waiting for the student to submit their feedback to reveal the reviews.</p>
                </div>
              )
            ) : (
              <ReviewForm projectId={projectId} targetName={studentName} />
            )}
          </div>
        )}

        <MilestoneTracker projectId={projectId} role="company" />

        <DeliverableReviewPanel
          projectId={projectId}
          deliverables={deliverables ?? []}
          isInProgress={isInProgress}
          isCompleted={isCompleted}
          studentPayout={studentPayout}
          commission={commission}
          studentName={studentName}
        />

        </div>

        {/* Chat Sidebar (Right) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <WorkspaceChat 
              projectId={projectId} 
              currentUserProfile={{ id: user.id, full_name: companyProfile?.legal_name || profile.full_name, role: profile.role }} 
            />
          </div>
        </div>

      </div>
    </div>
  </DashboardShell>
  )
}
