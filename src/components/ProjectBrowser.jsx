'use client'

// src/components/ProjectBrowser.jsx
// Story 3.2: Client component — browse open projects and apply
//
// Props:
//   projects        {Array}  — list of open projects (joined with company legal_name)
//   appliedIds      {Set}    — Set of project IDs the student has already applied to
//
// Features:
//   - Client-side keyword filter (no extra DB calls)
//   - Project cards grid with skill tags, budget, deadline
//   - Apply modal with ApplyForm
//   - "Applied ✓" badge once submitted

import { useState, useMemo } from 'react'
import ApplyForm from './ApplyForm'

// ── Status badge colours ───────────────────────────────────────────────────────
function SkillTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
      {label}
    </span>
  )
}

function AppliedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
      ✓ Applied
    </span>
  )
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ project, onClose, onApplied }) {
  function handleSuccess() {
    onApplied(project.id)
    onClose()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg glass rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* Close button */}
        <button
          id="apply-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Applying to</p>
          <h2
            id="apply-modal-title"
            className="text-lg font-bold text-white leading-snug"
          >
            {project.title}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {project.company_profiles?.legal_name ?? 'Unknown Company'}
          </p>
        </div>

        <ApplyForm
          projectId={project.id}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, isApplied, onApply }) {
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 hover:border-purple-500/30 border border-white/0 transition-colors duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm leading-snug truncate">
            {project.title}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {project.company_profiles?.legal_name ?? 'Unknown Company'}
          </p>
        </div>
        {isApplied && <AppliedBadge />}
      </div>

      {/* Description snippet */}
      {project.description && (
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
          {project.description}
        </p>
      )}

      {/* Skill tags */}
      {project.required_skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.required_skills.map((s) => (
            <SkillTag key={s} label={s} />
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-white/5 pt-3">
        {project.budget_bdt && (
          <span className="text-green-400 font-semibold">
            ৳{Number(project.budget_bdt).toLocaleString()}
          </span>
        )}
        {project.duration_weeks && (
          <span>{project.duration_weeks}w duration</span>
        )}
        {deadline && <span>Due {deadline}</span>}
      </div>

      {/* Apply button */}
      <button
        id={`apply-btn-${project.id}`}
        onClick={() => onApply(project)}
        disabled={isApplied}
        className={
          isApplied
            ? 'w-full py-2 rounded-lg text-sm font-semibold text-green-400 border border-green-500/30 bg-green-500/10 cursor-default'
            : 'w-full py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-colors'
        }
      >
        {isApplied ? '✓ Applied' : 'Apply Now'}
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectBrowser({ projects = [], appliedIds = [] }) {
  const [query, setQuery]           = useState('')
  const [activeProject, setActive]  = useState(null) // project to show in modal
  const [appliedSet, setAppliedSet] = useState(new Set(appliedIds))

  // Client-side keyword filter (title, description, skills)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => {
      const haystack = [
        p.title,
        p.description,
        ...(p.required_skills ?? []),
        p.company_profiles?.legal_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [projects, query])

  function handleApplied(projectId) {
    setAppliedSet((prev) => new Set([...prev, projectId]))
  }

  return (
    <div className="space-y-6">

      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
          🔍
        </span>
        <input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by skill, title, or company…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-lg leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-slate-500 text-xs">
        {filtered.length === 0
          ? 'No projects match your search.'
          : `Showing ${filtered.length} open project${filtered.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}`}
      </p>

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isApplied={appliedSet.has(project.id)}
              onApply={setActive}
            />
          ))}
        </div>
      )}

      {/* Apply modal */}
      {activeProject && (
        <ApplyModal
          project={activeProject}
          onClose={() => setActive(null)}
          onApplied={handleApplied}
        />
      )}
    </div>
  )
}
