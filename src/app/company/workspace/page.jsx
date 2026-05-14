// src/app/company/workspace/page.jsx
// Phase 4 — Company Workspace Hub
// Lists ALL projects the company has created that involve active work, grouped by status:
//   • In Progress    → project.status = 'in_progress'
//   • Open (Hiring)  → selected student but project still 'open' (ready to start)
//   • Completed      → project.status = 'completed'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import StartProjectButton from './StartProjectButton'
import {
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Wallet,
  Shield,
  FolderKanban,
  AlertCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Company Workspace — KaajerBazar',
  description: 'Manage your active and completed projects.',
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    open:        { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Ready to Start' },
    in_progress: { cls: 'bg-blue-500/15  text-blue-400  border-blue-500/30',  label: 'In Progress'   },
    completed:   { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'Completed'      },
  }
  const { cls, label } = map[status] ?? map.open
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, selectedStudentName, pendingDeliverables }) {
  const isActive    = project.status === 'in_progress'
  const isCompleted = project.status === 'completed'
  const isOpen      = project.status === 'open'
  const COMMISSION  = 0.10
  const studentPayout = Math.round((project.budget_bdt ?? 0) * (1 - COMMISSION) * 100) / 100

  return (
    <div className={`glass rounded-2xl border transition-all duration-200 overflow-hidden ${
      isActive
        ? 'border-blue-500/30 hover:border-blue-400/50'
        : isCompleted
        ? 'border-green-500/20 hover:border-green-400/40'
        : 'border-white/10 hover:border-white/20'
    }`}>
      {/* Colour bar */}
      <div className={`h-1 w-full ${
        isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500'
        : isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400'
        : 'bg-gradient-to-r from-slate-600 to-slate-500'
      }`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug truncate">
              {project.title}
            </h3>
            {selectedStudentName && (
              <p className="text-slate-500 text-xs mt-0.5">
                Assigned to <span className="text-slate-300 font-medium">{selectedStudentName}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusPill status={project.status} />
            {pendingDeliverables > 0 && (
              <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingDeliverables} review{pendingDeliverables !== 1 ? 's' : ''} pending
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 flex-wrap mt-3">
          <span className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-green-400" />
            <span className="text-slate-300 font-semibold">৳{(project.budget_bdt ?? 0).toLocaleString()}</span>
            <span>budget</span>
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(project.deadline).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-yellow-400" />
            <span className={
              project.escrow_status === 'held' ? 'text-yellow-400 font-semibold' :
              project.escrow_status === 'released' ? 'text-green-400 font-semibold' :
              'text-slate-500'
            }>
              {project.escrow_status === 'held'     ? '🔒 Held'
               : project.escrow_status === 'released' ? '✅ Released'
               : '⏳ Not deposited'}
            </span>
          </span>
        </div>

        {/* Skills */}
        {project.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.required_skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                {s}
              </span>
            ))}
            {project.required_skills.length > 4 && (
              <span className="text-slate-600 text-xs self-center">+{project.required_skills.length - 4}</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {isOpen ? (
            // Show client start button for projects ready to start
            <StartProjectButton projectId={project.id} />
          ) : (
            <Link
              href={`/company/workspace/${project.id}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/8 hover:bg-white/15 text-slate-300'
              }`}
            >
              {isActive ? 'Open Workspace' : 'View Archive'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Extra link for in-progress: still allow quick access */}
          {isOpen && (
            <Link
              href={`/company/workspace/${project.id}`}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              View workspace
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, color }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-white font-semibold text-lg">{label}</h2>
      {count > 0 && (
        <span className="bg-white/10 text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function CompanyWorkspaceHub() {
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

  // Fetch all projects that have at least one selected applicant OR are in_progress/completed
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, title, description, budget_bdt, deadline,
      status, escrow_status, required_skills, created_at
    `)
    .eq('company_id', user.id)
    .in('status', ['open', 'in_progress', 'completed'])
    .order('created_at', { ascending: false })

  if (!projects || projects.length === 0) {
    return (
      <DashboardShell
        role="company"
        fullName={companyProfile?.legal_name ?? profile?.full_name ?? ''}
        activePath="/company/workspace"
      >
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Company Workspace</h1>
              <p className="text-slate-400 text-sm">No active projects yet</p>
            </div>
          </div>
          <div className="glass rounded-2xl border border-white/10 p-16 text-center">
            <p className="text-5xl mb-4">📋</p>
            <h2 className="text-white font-semibold text-lg mb-2">No Projects Yet</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Post a project, select a student, and start your workspace here.
            </p>
            <Link
              href="/company/projects/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Post a Project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const projectIds = projects.map((p) => p.id)

  // Fetch selected applicants for all projects in one query
  const { data: selectedApps } = await supabase
    .from('applications')
    .select('project_id, student_id, student_profiles(users_profiles(full_name))')
    .in('project_id', projectIds)
    .eq('status', 'selected')

  // Fetch pending deliverable counts for in_progress projects
  const inProgressIds = projects.filter((p) => p.status === 'in_progress').map((p) => p.id)
  let pendingCounts = {}
  if (inProgressIds.length > 0) {
    const { data: pendingDeliverables } = await supabase
      .from('project_deliverables')
      .select('project_id')
      .in('project_id', inProgressIds)
      .eq('status', 'pending')

    for (const d of pendingDeliverables ?? []) {
      pendingCounts[d.project_id] = (pendingCounts[d.project_id] ?? 0) + 1
    }
  }

  // Build lookup maps
  const studentNameMap = {}
  for (const app of selectedApps ?? []) {
    studentNameMap[app.project_id] = app.student_profiles?.users_profiles?.full_name ?? null
  }

  // Only show open projects that have a selected applicant (ready to start)
  const selectedProjectIds = new Set((selectedApps ?? []).map((a) => a.project_id))

  const inProgress  = projects.filter((p) => p.status === 'in_progress')
  const readyToStart = projects.filter((p) => p.status === 'open' && selectedProjectIds.has(p.id))
  const completed   = projects.filter((p) => p.status === 'completed')

  const totalActive = inProgress.length

  return (
    <DashboardShell
      role="company"
      fullName={companyProfile?.legal_name ?? profile?.full_name ?? ''}
      activePath="/company/workspace"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Company Workspace</h1>
              <p className="text-slate-400 text-sm">
                {totalActive > 0
                  ? `${totalActive} active project${totalActive !== 1 ? 's' : ''}`
                  : 'All projects up to date'}
              </p>
            </div>
          </div>
        </div>

        {/* ── In Progress ── */}
        {inProgress.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={Clock}
              label="In Progress"
              count={inProgress.length}
              color="bg-blue-500/20 text-blue-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgress.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selectedStudentName={studentNameMap[p.id]}
                  pendingDeliverables={pendingCounts[p.id] ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Ready to Start ── */}
        {readyToStart.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={Hourglass}
              label="Ready to Start"
              count={readyToStart.length}
              color="bg-yellow-500/20 text-yellow-400"
            />
            <p className="text-slate-500 text-sm mb-4">
              These projects have a selected student. Lock the escrow to begin work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyToStart.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selectedStudentName={studentNameMap[p.id]}
                  pendingDeliverables={0}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Completed ── */}
        {completed.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={CheckCircle2}
              label="Completed"
              count={completed.length}
              color="bg-green-500/20 text-green-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completed.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selectedStudentName={studentNameMap[p.id]}
                  pendingDeliverables={0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nothing to show in workspace yet */}
        {inProgress.length === 0 && readyToStart.length === 0 && completed.length === 0 && (
          <div className="glass rounded-2xl border border-white/10 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              No active work yet. Select an applicant on a project to unlock the workspace.
            </p>
            <Link
              href="/company/dashboard"
              className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 text-sm font-semibold underline underline-offset-2 transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

      </div>
    </DashboardShell>
  )
}
