// src/app/student/workspace/page.jsx
// Phase 4 — Student Workspace Hub
// Lists ALL projects the student has been selected for, grouped by status:
//   • In Progress   → project.status = 'in_progress'
//   • Completed     → project.status = 'completed'
//   • Awaiting Start→ selected but project still 'open'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import {
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Wallet,
  Shield,
  FolderKanban,
} from 'lucide-react'

export const metadata = {
  title: 'My Workspace — KaajerBazar',
  description: 'View and manage your active and completed projects.',
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    open:        { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30',   label: 'Awaiting Start' },
    in_progress: { cls: 'bg-blue-500/15  text-blue-400  border-blue-500/30',    label: 'In Progress'    },
    completed:   { cls: 'bg-green-500/15 text-green-400 border-green-500/30',   label: 'Completed'      },
    cancelled:   { cls: 'bg-red-500/15   text-red-400   border-red-500/30',     label: 'Cancelled'      },
  }
  const { cls, label } = map[status] ?? map.open
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ── Escrow pill ───────────────────────────────────────────────────────────────
function EscrowPill({ status }) {
  const map = {
    not_deposited: { cls: 'text-slate-500', label: '⏳ Escrow pending' },
    held:          { cls: 'text-yellow-400', label: '🔒 Funds held' },
    released:      { cls: 'text-green-400',  label: '✅ Payment released' },
  }
  const { cls, label } = map[status] ?? map.not_deposited
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>
}

// ── Single project card ───────────────────────────────────────────────────────
function ProjectCard({ project, deliverableCount }) {
  const isActive    = project.status === 'in_progress'
  const isCompleted = project.status === 'completed'
  const isAwaiting  = project.status === 'open'
  const COMMISSION  = 0.10
  const payout      = Math.round((project.budget_bdt ?? 0) * (1 - COMMISSION) * 100) / 100

  return (
    <div className={`glass rounded-2xl border transition-all duration-200 overflow-hidden group ${
      isActive
        ? 'border-blue-500/30 hover:border-blue-400/50'
        : isCompleted
        ? 'border-green-500/20 hover:border-green-400/40'
        : 'border-white/10 hover:border-white/20'
    }`}>
      {/* Top colour bar */}
      <div className={`h-1 w-full ${
        isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500'
        : isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400'
        : 'bg-white/10'
      }`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug truncate">
              {project.title}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              by {project.company_profiles?.legal_name ?? 'Company'}
            </p>
          </div>
          <StatusPill status={project.status} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 font-semibold">৳{payout.toLocaleString()}</span>
            <span>payout</span>
          </span>

          {project.deadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(project.deadline).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}

          {isActive && deliverableCount > 0 && (
            <span className="text-purple-400 font-semibold">
              {deliverableCount} submission{deliverableCount !== 1 ? 's' : ''}
            </span>
          )}

          <EscrowPill status={project.escrow_status} />
        </div>

        {/* Required skills */}
        {project.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.required_skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                {s}
              </span>
            ))}
            {project.required_skills.length > 4 && (
              <span className="text-slate-600 text-xs self-center">+{project.required_skills.length - 4} more</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between">
          {isAwaiting ? (
            <p className="text-slate-500 text-xs italic">
              Waiting for company to start the project…
            </p>
          ) : (
            <Link
              href={`/student/workspace/${project.id}`}
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
export default async function StudentWorkspaceHub() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select("full_name, role, avatar_url")
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch all applications where student is selected, with project details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      project_id,
      projects (
        id, title, description, budget_bdt, deadline,
        status, escrow_status, required_skills,
        company_profiles ( legal_name )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'selected')
    .order('created_at', { ascending: false })

  const projects = (applications ?? [])
    .map((a) => a.projects)
    .filter(Boolean)

  // Fetch deliverable counts for in-progress projects
  const inProgressIds = projects
    .filter((p) => p.status === 'in_progress')
    .map((p) => p.id)

  let deliverableCounts = {}
  if (inProgressIds.length > 0) {
    const { data: deliverables } = await supabase
      .from('project_deliverables')
      .select('project_id')
      .in('project_id', inProgressIds)
      .eq('student_id', user.id)

    for (const d of deliverables ?? []) {
      deliverableCounts[d.project_id] = (deliverableCounts[d.project_id] ?? 0) + 1
    }
  }

  // Group by status
  const inProgress = projects.filter((p) => p.status === 'in_progress')
  const completed  = projects.filter((p) => p.status === 'completed')
  const awaiting   = projects.filter((p) => p.status === 'open')

  const totalActive = inProgress.length

  return (
    <DashboardShell avatarUrl={profile?.avatar_url}
      role="student"
      fullName={profile?.full_name ?? ''}
      activePath="/student/workspace"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Workspace</h1>
              <p className="text-slate-400 text-sm">
                {totalActive > 0
                  ? `${totalActive} active project${totalActive !== 1 ? 's' : ''}`
                  : 'No active projects right now'}
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="glass rounded-2xl border border-white/10 p-16 text-center">
            <p className="text-5xl mb-4">📭</p>
            <h2 className="text-white font-semibold text-lg mb-2">No Projects Yet</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Apply to projects and get selected by a company to start working.
            </p>
            <Link
              href="/student/projects"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Browse Projects
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── In Progress section ── */}
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
                  deliverableCount={deliverableCounts[p.id] ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Awaiting Start section ── */}
        {awaiting.length > 0 && (
          <section className="mb-10">
            <SectionHeader
              icon={Hourglass}
              label="Selected — Awaiting Start"
              count={awaiting.length}
              color="bg-slate-500/20 text-slate-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awaiting.map((p) => (
                <ProjectCard key={p.id} project={p} deliverableCount={0} />
              ))}
            </div>
          </section>
        )}

        {/* ── Completed section ── */}
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
                <ProjectCard key={p.id} project={p} deliverableCount={0} />
              ))}
            </div>
          </section>
        )}

      </div>
    </DashboardShell>
  )
}
