'use client'

// src/app/company/dashboard/ApplicationsPanel.jsx
// Phase 3 & 4 — Full applicant management panel for company dashboard.
//
// UX Flow:
//   1. Loads company projects from GET /api/company/projects
//   2. Click a project → loads its applicants from GET /api/company/applications?projectId=...
//   3. Per applicant: view profile card + cover letter, then Accept or Reject
//   4. PATCH /api/company/applications to update status optimistically
//   5. Phase 4: "Start Project" button locks escrow → redirects to workspace

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, ChevronDown, Check, X, Clock, CheckCircle2, Users } from 'lucide-react'

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
    completed:  { cls: 'bg-slate-500/15  text-slate-400  border-slate-500/30',  label: 'Completed' },
  }
  const { cls, label } = map[status] ?? { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: status ?? 'open' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ── Rank Medal Badge ───────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (!rank || rank > 3) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/8 text-slate-400 text-xs font-bold shrink-0">#{rank}</span>
  )
  const styles = [
    'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40', // #1 gold
    'bg-slate-300/15 text-slate-200 border border-slate-300/30',    // #2 silver
    'bg-orange-600/20 text-orange-300 border border-orange-500/35',  // #3 bronze
  ]
  const labels = ['🥇', '🥈', '🥉']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${styles[rank - 1]}`}>
      {labels[rank - 1]} #{rank}
    </span>
  )
}

// ── Applicant Card ─────────────────────────────────────────────────────────────
function ApplicantCard({ app, rank, onAction, actionLoading, canStart, onStartProject, startLoading, startError }) {
  const [expanded, setExpanded] = useState(false)
  const student = app.student_profiles
  const userProfile = Array.isArray(student?.users_profiles) ? student.users_profiles[0] : student?.users_profiles
  const name = userProfile?.full_name ?? 'Unknown Student'
  const avatarUrl = userProfile?.avatar_url
  const username = student?.username ?? '—'
  const university = student?.university ?? 'Not specified'
  const score = student?.kaajerscore
  const badges = app.marketplace_badges ?? []
  const isLoading = actionLoading === app.id
  const isResolved = app.status !== 'pending'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      isResolved
        ? 'border-white/5 bg-white/2'
        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
    }`}>
      {/* Card header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer transition-colors gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex items-start gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0 border border-purple-500/30">
              {name.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {rank && <RankBadge rank={rank} />}
              <Link 
                href={`/profile/student/${app.student_id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className={`font-semibold text-sm hover:underline hover:text-purple-400 flex items-center gap-1 ${isResolved ? 'text-slate-400' : 'text-white'}`}
              >
                {name} <ExternalLink className="w-3 h-3" />
              </Link>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-slate-500 text-xs">@{username} · {university}</p>

            {/* Score + skill badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                score !== null && score !== undefined
                  ? 'text-purple-300 bg-purple-500/15 border-purple-500/25'
                  : 'text-slate-500 bg-white/5 border-white/10'
              }`}>
                ⭐ {score !== null && score !== undefined ? `${score.toFixed(1)} / 100` : 'No score yet'}
              </span>
              
              {(() => {
                const BADGE_LABELS = {
                  rising_talent:   { label: '🌟 Rising Star',   color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                  top_rated:       { label: '⭐ Top Rated',      color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
                  top_rated_plus:  { label: '🏆 Top Rated Plus', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                }
                return badges.map((b) => {
                  const cfg = BADGE_LABELS[b] || { label: b, color: 'bg-white/10 text-white border-white/20' }
                  return (
                    <span key={b} className={`text-xs px-2 py-0.5 rounded-md border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )
                })
              })()}
            </div>
          </div>
        </div>

        {/* Expand toggle — rotating chevron */}
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/8 px-4 pb-4 pt-4 space-y-4">
          {/* Cover letter */}
          {app.cover_note ? (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white/8 flex items-center justify-center text-[10px]">📝</span>
                Cover Letter
              </p>
              <div className="bg-white/5 rounded-xl p-3 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border border-white/8">
                {app.cover_note}
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm italic">No cover note provided.</p>
          )}

          {/* Portfolio link */}
          {app.portfolio_item_url && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white/8 flex items-center justify-center text-[10px]">🔗</span>
                Portfolio / Work Sample
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
            <div className="pt-2 border-t border-white/8">
              <div className="flex gap-2 flex-wrap">
                <button
                  id={`accept-${app.id}`}
                  onClick={(e) => { e.stopPropagation(); onAction(app.id, 'select') }}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-24 max-w-[180px] bg-green-500/15 hover:bg-green-500/25 disabled:opacity-50 text-green-300 text-sm font-medium py-2 px-4 rounded-full border border-green-500/35 transition-all duration-150"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border border-green-400/40 border-t-green-300 rounded-full animate-spin" />
                      Updating…
                    </span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </>
                  )}
                </button>
                <button
                  id={`reject-${app.id}`}
                  onClick={(e) => { e.stopPropagation(); onAction(app.id, 'reject') }}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-24 max-w-[180px] bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-300 text-sm font-medium py-2 px-4 rounded-full border border-red-500/30 transition-all duration-150"
                >
                  {isLoading ? '…' : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: Start Project Banner (shown if accepted and ready to start) */}
          {isResolved && app.status === 'selected' && canStart && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-green-400 font-semibold mb-1">Applicant Accepted</h4>
                  <p className="text-slate-400 text-sm">Lock the budget into escrow to officially begin working together.</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    id={`start-project-${app.project_id}`}
                    onClick={(e) => { e.stopPropagation(); onStartProject() }}
                    disabled={startLoading}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    {startLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : '🔒'}
                    {startLoading ? 'Starting Project…' : 'Start Project & Lock Escrow'}
                  </button>
                  {startError && (
                    <p className="text-red-400 text-xs text-center w-full">{startError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section Divider Header ─────────────────────────────────────────────────────
function SectionDivider({ icon: Icon, label, color = 'text-slate-400' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  )
}

// ── Applicant List ─────────────────────────────────────────────────────────────
function ApplicantList({ projectId, projectTitle, projectStatus, escrowStatus }) {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // applicationId being processed
  const [startLoading, setStartLoading] = useState(false)
  const [startError, setStartError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [sortKey, setSortKey] = useState('kaajerscore') // 'date' | 'kaajerscore'

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

  async function handleStartProject() {
    setShowConfirm(true)
  }

  async function executeStartProject() {
    setShowConfirm(false)
    setStartLoading(true)
    setStartError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setStartError(data.error || 'Failed to start project.'); return }
      router.push(`/company/workspace/${projectId}`)
    } catch {
      setStartError('Network error. Please try again.')
    } finally {
      setStartLoading(false)
    }
  }

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
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
        <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-400 rounded-full animate-spin" />
        <span className="text-sm">Loading applicants…</span>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400 text-sm py-4">{error}</p>
  }

  const hasSelected = applications.some((a) => a.status === 'selected')
  const hasStarted = projectStatus === 'in_progress' || projectStatus === 'completed'
  const canStart = hasSelected && projectStatus === 'open' && escrowStatus !== 'held'

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-2xl">
          📭
        </div>
        <div>
          <p className="text-slate-300 text-sm font-medium">No applicants yet</p>
          <p className="text-slate-500 text-xs mt-1">
            Share the project link to attract students.
          </p>
        </div>
      </div>
    )
  }

  // Sort applicants
  function sortApplicants(apps) {
    if (sortKey === 'kaajerscore') {
      return [...apps].sort((a, b) => {
        const sa = a.student_profiles?.kaajerscore ?? -1
        const sb = b.student_profiles?.kaajerscore ?? -1
        return sb - sa
      })
    }

    // Default: date (ascending)
    return [...apps].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  const pending = sortApplicants(applications.filter((a) => a.status === 'pending'))
  const resolved = sortApplicants(applications.filter((a) => a.status !== 'pending'))

  return (
    <div className="space-y-5">
      {/* Header row: summary + sort + workspace */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {applications.length} applicant{applications.length !== 1 ? 's' : ''}
          </span>
          {pending.length > 0 && (
            <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {pending.length} awaiting review
            </span>
          )}
          {resolved.length > 0 && (
            <span className="text-slate-600">{resolved.length} reviewed</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Rank by:</span>
            <select
              id="applicant-sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-white/5 border border-white/15 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="kaajerscore">⭐ KaajerScore (Trust Score)</option>
              <option value="date">Applied Date</option>
            </select>
          </div>
        </div>

        {/* Phase 4: Project start / workspace actions */}
        {hasStarted ? (
          <Link
            href={`/company/workspace/${projectId}`}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            🚀 Go to Workspace
          </Link>
        ) : null}
      </div>

      {/* KaajerScore Ranking Banner */}
      {sortKey === 'kaajerscore' && pending.length > 0 && (
        <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/25 border-l-2 border-l-purple-400 rounded-xl px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm">⭐</span>
          </div>
          <div>
            <p className="text-purple-300 text-xs font-semibold">Ranked by KaajerScore</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Applicants are ranked by their trust score — a weighted blend of project ratings received (70%) and project completion rate (30%). Higher = more reliable.
            </p>
          </div>
        </div>
      )}

      {/* Pending applicants first */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <SectionDivider icon={Clock} label="Awaiting Review" color="text-yellow-400" />
          {pending.map((app, idx) => (
            <ApplicantCard
              key={app.id}
              app={app}
              rank={sortKey === 'kaajerscore' ? idx + 1 : null}
              onAction={handleAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Resolved applicants */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <SectionDivider icon={CheckCircle2} label="Reviewed" color="text-slate-400" />
          {resolved.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              onAction={handleAction}
              actionLoading={actionLoading}
              canStart={canStart}
              onStartProject={handleStartProject}
              startLoading={startLoading}
              startError={startError}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Start Project?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will officially begin the project and lock the budget into escrow. Are you sure you want to proceed?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeStartProject}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-500 text-white transition-colors shadow-lg shadow-green-900/20"
              >
                Yes, Start Project
              </button>
            </div>
          </div>
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
        // Always auto-select the first project on load
        if (data.projects?.length > 0) setSelectedProject(data.projects[0])
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
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3 text-slate-500 text-sm">
        <span className="w-8 h-8 border-2 border-slate-700 border-t-purple-400 rounded-full animate-spin" />
        <span>Loading your projects…</span>
      </div>
    )
  }

  if (error) {
    return <div className="glass rounded-2xl p-6 text-red-400 text-sm">{error}</div>
  }

  if (projects.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-3xl">
          📋
        </div>
        <div>
          <p className="text-slate-300 text-sm font-medium">No projects yet</p>
          <p className="text-slate-600 text-xs mt-1">Post a project to start receiving student applications.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/8">
      {/* Panel header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-purple-300" />
          </div>
          <h3 className="text-white font-semibold text-base">Manage Applicants</h3>
        </div>
        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex h-[620px]">
        {/* Left: Project list */}
        <div className="w-56 border-r border-white/8 flex-shrink-0 bg-white/[0.01] overflow-y-auto scrollbar-themed">
          <ul className="py-2">
            {projects.map((p) => {
              const isActive = selectedProject?.id === p.id
              return (
                <li key={p.id} className="border-b border-white/5 last:border-0">
                  <button
                    id={`project-tab-${p.id}`}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full text-left px-4 py-3 transition-all duration-150 border-l-2 group ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {p.title}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <ProjectStatusBadge status={p.status} />
                      {p.applicant_count > 0 && (
                        <span className="text-[10px] text-purple-300 font-bold bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded-full shrink-0">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedProject ? (
            <>
              {/* Project header — pinned, never scrolls */}
              <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0 bg-white/[0.01]">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">
                  Selected Project
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-white font-semibold">{selectedProject.title}</h4>
                  <ProjectStatusBadge status={selectedProject.status} />
                  {selectedProject.budget_bdt && (
                    <span className="text-emerald-300 text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      ৳{Number(selectedProject.budget_bdt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {/* Scrollable applicant list only */}
              <div className="flex-1 overflow-y-auto scrollbar-themed px-5 py-4">
                <ApplicantList
                  key={selectedProject.id}
                  projectId={selectedProject.id}
                  projectTitle={selectedProject.title}
                  projectStatus={selectedProject.status}
                  escrowStatus={selectedProject.escrow_status}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm">← Select a project to view applicants</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
