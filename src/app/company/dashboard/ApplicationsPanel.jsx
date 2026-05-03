'use client'

// src/app/company/dashboard/ApplicationsPanel.jsx
// Phase 3 — Full applicant management panel for company dashboard.
//
// UX Flow:
//   1. Loads company projects from GET /api/company/projects
//   2. Click a project → loads its applicants from GET /api/company/applications?projectId=...
//   3. Per applicant: view profile card + cover letter, then Accept or Reject
//   4. PATCH /api/company/applications to update status optimistically

import { useState, useEffect } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: 'Pending' },
    selected: { cls: 'bg-green-500/15  text-green-400  border-green-500/30',  label: '✓ Selected' },
    rejected: { cls: 'bg-red-500/15    text-red-400    border-red-500/30',    label: 'Rejected' },
  }
  const { cls, label } = map[status] ?? { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${cls}`}>
      {label}
    </span>
  )
}

function ProjectStatusBadge({ status }) {
  const map = {
    open:       { cls: 'bg-green-500/15  text-green-400  border-green-500/30',  label: 'Open' },
    closed:     { cls: 'bg-red-500/15    text-red-400    border-red-500/30',    label: 'Closed' },
    in_progress:{ cls: 'bg-blue-500/15   text-blue-400   border-blue-500/30',   label: 'In Progress' },
  }
  const { cls, label } = map[status] ?? { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: status ?? 'open' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ── Applicant Card ─────────────────────────────────────────────────────────────
function ApplicantCard({ app, onAction, actionLoading }) {
  const [expanded, setExpanded] = useState(false)
  const student = app.student_profiles
  const name = student?.users_profiles?.full_name ?? 'Unknown Student'
  const username = student?.username ?? '—'
  const university = student?.university ?? 'Not specified'
  const score = student?.kaajerscore ?? 0
  const skills = app.verified_skills ?? []
  const isLoading = actionLoading === app.id
  const isResolved = app.status !== 'pending'

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      isResolved ? 'border-white/5 bg-white/2' : 'border-white/10 bg-white/5'
    }`}>
      {/* Card header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className={`font-semibold text-sm ${isResolved ? 'text-slate-400' : 'text-white'}`}>
              {name}
            </p>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-slate-500 text-xs">@{username} · {university}</p>

          {/* Score + skill badges */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-purple-300 font-semibold bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded-md">
              ⭐ KaajerScore {score.toFixed(1)}
            </span>
            {skills.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-md">
                ✓ {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-xs text-slate-500">+{skills.length - 3} more</span>
            )}
            {skills.length === 0 && (
              <span className="text-xs text-slate-600 italic">No verified skills yet</span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <span className="text-slate-600 text-xs shrink-0 mt-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Cover letter */}
          {app.cover_note ? (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                📝 Cover Letter
              </p>
              <div className="bg-white/5 rounded-lg p-3 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {app.cover_note}
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm italic">No cover note provided.</p>
          )}

          {/* Portfolio link */}
          {app.portfolio_item_url && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                🔗 Portfolio / Work Sample
              </p>
              <a
                href={app.portfolio_item_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2 break-all"
              >
                {app.portfolio_item_url}
              </a>
            </div>
          )}

          {/* Applied date */}
          <p className="text-slate-600 text-xs">
            Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>

          {/* Action buttons — only shown if still pending */}
          {!isResolved && (
            <div className="flex gap-2 flex-wrap">
              <button
                id={`accept-${app.id}`}
                onClick={(e) => { e.stopPropagation(); onAction(app.id, 'select') }}
                disabled={isLoading}
                className="flex-1 min-w-24 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : '✅ Accept'}
              </button>
              <button
                id={`reject-${app.id}`}
                onClick={(e) => { e.stopPropagation(); onAction(app.id, 'reject') }}
                disabled={isLoading}
                className="flex-1 min-w-24 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? '…' : '❌ Reject'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Applicant List ─────────────────────────────────────────────────────────────
function ApplicantList({ projectId, projectTitle }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // applicationId being processed

  useEffect(() => {
    async function fetchApplicants() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/company/applications?projectId=${projectId}`)
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed to load applicants'); return }
        setApplications(data.applications ?? [])
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchApplicants()
  }, [projectId])

  async function handleAction(applicationId, action) {
    setActionLoading(applicationId)
    try {
      const res = await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(`Error: ${data.error}`); return }
      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: data.status } : app
        )
      )
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
        <span className="w-4 h-4 border-2 border-slate-600 border-t-purple-400 rounded-full animate-spin" />
        Loading applicants…
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400 text-sm py-4">{error}</p>
  }

  const pending = applications.filter((a) => a.status === 'pending')
  const resolved = applications.filter((a) => a.status !== 'pending')

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-3">📭</p>
        <p className="text-slate-400 text-sm">No one has applied to <strong className="text-white">{projectTitle}</strong> yet.</p>
        <p className="text-slate-600 text-xs mt-1">Share the project link to attract more students.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{applications.length} total applicant{applications.length !== 1 ? 's' : ''}</span>
        {pending.length > 0 && (
          <span className="text-yellow-400 font-semibold">{pending.length} awaiting review</span>
        )}
        {resolved.length > 0 && (
          <span>{resolved.length} reviewed</span>
        )}
      </div>

      {/* Pending applicants first */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
            ⏳ Awaiting Review
          </p>
          {pending.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Resolved applicants */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            ✅ Reviewed
          </p>
          {resolved.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────────────
export default function ApplicationsPanel() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/company/projects')
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed to load projects'); return }
        setProjects(data.projects ?? [])
        // Auto-select first project if only one exists
        if (data.projects?.length === 1) setSelectedProject(data.projects[0])
      } catch {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 flex items-center gap-3 text-slate-500 text-sm">
        <span className="w-4 h-4 border-2 border-slate-600 border-t-purple-400 rounded-full animate-spin" />
        Loading your projects…
      </div>
    )
  }

  if (error) {
    return <div className="glass rounded-xl p-6 text-red-400 text-sm">{error}</div>
  }

  if (projects.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-slate-400 text-sm">You haven&apos;t posted any projects yet.</p>
        <p className="text-slate-600 text-xs mt-1">Post a project to start receiving student applications.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">👥 Manage Applicants</h3>
        <span className="text-xs text-slate-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex min-h-[420px]">
        {/* Left: Project list */}
        <div className="w-56 border-r border-white/10 flex-shrink-0">
          <ul className="py-2">
            {projects.map((p) => {
              const isActive = selectedProject?.id === p.id
              return (
                <li key={p.id}>
                  <button
                    id={`project-tab-${p.id}`}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/5 border-l-2 ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-transparent'
                    }`}
                  >
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {p.title}
                    </p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <ProjectStatusBadge status={p.status} />
                      {p.applicant_count > 0 && (
                        <span className="text-xs text-purple-400 font-semibold shrink-0">
                          {p.applicant_count} applied
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right: Applicant list for selected project */}
        <div className="flex-1 p-5 overflow-y-auto">
          {selectedProject ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <h4 className="text-white font-semibold">{selectedProject.title}</h4>
                <ProjectStatusBadge status={selectedProject.status} />
                {selectedProject.budget_bdt && (
                  <span className="text-green-400 text-sm font-semibold">
                    ৳{Number(selectedProject.budget_bdt).toLocaleString()}
                  </span>
                )}
              </div>
              <ApplicantList
                key={selectedProject.id}
                projectId={selectedProject.id}
                projectTitle={selectedProject.title}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              ← Select a project to view applicants
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
