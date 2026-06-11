'use client'

// src/components/ProjectBrowser.jsx
// Phase E: Upgraded — Framer Motion card hover, company avatar ring,
//          budget badge pill, animated apply button, glass search bar.
//
// Props:
//   projects    {Array}  — list of open projects (joined with company legal_name)
//   appliedIds  {Array}  — project IDs the student has already applied to

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApplyForm from './ApplyForm'
import { Search, X } from 'lucide-react'

// ── Deterministic avatar colour from company name hash ────────────────────────
function hashColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 55% 45%)`
}

function CompanyAvatar({ name = '' }) {
  const bg      = hashColor(name)
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 shrink-0"
      style={{ backgroundColor: bg }}
    >
      {initial}
    </div>
  )
}

// ── Skill tag ──────────────────────────────────────────────────────────────────
function SkillTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
      {label}
    </span>
  )
}

// ── Applied badge ──────────────────────────────────────────────────────────────
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-lg glass rounded-2xl p-6 md:p-8 shadow-2xl"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Close button */}
          <button
            id="apply-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <CompanyAvatar name={project.company_profiles?.legal_name} />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Applying to</p>
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
          </div>

          <ApplyForm
            projectId={project.id}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, isApplied, onApply }) {
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null
  const companyName = project.company_profiles?.legal_name ?? 'Unknown Company'

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 40px hsl(267 84% 61% / 0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass rounded-xl p-5 flex flex-col gap-4 border border-white/8 hover:border-purple-500/30 transition-colors duration-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyAvatar name={companyName} />
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm leading-snug truncate">
              {project.title}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 truncate">{companyName}</p>
          </div>
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
      <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 border-t border-white/5 pt-3">
        {project.budget_bdt && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
            ৳{Number(project.budget_bdt).toLocaleString()}
          </span>
        )}
        {project.duration_weeks && (
          <span>{project.duration_weeks}w duration</span>
        )}
        {deadline && <span>Due {deadline}</span>}
      </div>

      {/* Apply button */}
      <motion.button
        id={`apply-btn-${project.id}`}
        onClick={() => onApply(project)}
        disabled={isApplied}
        whileTap={isApplied ? {} : { scale: 0.97 }}
        className={
          isApplied
            ? 'w-full py-2 rounded-lg text-sm font-semibold text-green-400 border border-green-500/30 bg-green-500/10 cursor-default'
            : 'w-full py-2 rounded-lg text-sm font-semibold kb-btn-primary transition-colors'
        }
      >
        {isApplied ? '✓ Applied' : 'Apply Now'}
      </motion.button>
    </motion.div>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
function ProjectCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 border border-white/8">
      <div className="flex items-start gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3.5 rounded w-3/4" />
          <div className="skeleton h-2.5 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-2.5 rounded w-full" />
        <div className="skeleton h-2.5 rounded w-5/6" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 rounded-md w-16" />
        <div className="skeleton h-5 rounded-md w-20" />
      </div>
      <div className="skeleton h-8 rounded-lg w-full mt-auto" />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProjectBrowser({ projects = [], appliedIds = [] }) {
  const [query, setQuery]           = useState('')
  const [activeProject, setActive]  = useState(null)
  const [appliedSet, setAppliedSet] = useState(new Set(appliedIds))

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

      {/* Glass search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by skill, title, or company…"
          className="kb-input w-full pl-10 pr-10 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
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
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isApplied={appliedSet.has(project.id)}
              onApply={setActive}
            />
          ))}
        </motion.div>
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
