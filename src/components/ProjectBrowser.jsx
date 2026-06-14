'use client'

// src/components/ProjectBrowser.jsx
// Phase E: Upgraded — pagination (9/page), wide apply modal with project details panel.

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApplyForm from './ApplyForm'
import { Search, X, ChevronLeft, ChevronRight, Clock, Banknote, CalendarDays, Building2 as BuildingIcon, Tag } from 'lucide-react'

const PAGE_SIZE = 9

// ── Deterministic avatar colour from company name hash ────────────────────────
function hashColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 55% 45%)`
}

function CompanyAvatar({ name = '', size = 'sm' }) {
  const bg      = hashColor(name)
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  const cls     = size === 'lg'
    ? 'w-14 h-14 rounded-2xl text-2xl'
    : 'w-8 h-8 rounded-full text-xs'
  return (
    <div
      className={`${cls} flex items-center justify-center text-white font-bold ring-2 ring-white/10 shrink-0`}
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

// ── Pagination bar ─────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if ((i === 2 && currentPage > 3) || (i === totalPages - 1 && currentPage < totalPages - 2)) {
      pages.push('…')
    }
  }
  const deduped = pages.filter((p, i) => !(p === '…' && pages[i - 1] === '…'))

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {deduped.map((p, i) =>
        p === '…' ? (
          <span key={`el-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold border transition-all ${
              p === currentPage
                ? 'bg-purple-600 border-purple-500 text-white shadow shadow-purple-900/30'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Apply Modal — project details + form side by side ────────────────────────
function ApplyModal({ project, onClose, onApplied }) {
  function handleSuccess() {
    onApplied(project.id)
    onClose()
  }

  const companyName = project.company_profiles?.legal_name ?? 'Unknown Company'
  const deadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

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
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

        {/* Wide panel */}
        <motion.div
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-themed glass rounded-2xl shadow-2xl border border-white/10"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Close button */}
          <button
            id="apply-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-lg p-1.5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row min-h-0">

            {/* ── LEFT — Project details ── */}
            <div className="md:w-[45%] shrink-0 p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/8 bg-white/[0.02] flex flex-col gap-5">

              {/* Company + title */}
              <div className="flex items-start gap-4">
                <CompanyAvatar name={companyName} size="lg" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Project</p>
                  <h2 id="apply-modal-title" className="text-white font-bold text-lg leading-snug">
                    {project.title}
                  </h2>
                  <p className="text-purple-400 text-sm mt-1 flex items-center gap-1.5">
                    <BuildingIcon className="w-3.5 h-3.5" /> {companyName}
                  </p>
                </div>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                {project.budget_bdt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                    <Banknote className="w-3.5 h-3.5" /> ৳{Number(project.budget_bdt).toLocaleString()}
                  </span>
                )}
                {project.duration_weeks && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    <Clock className="w-3.5 h-3.5" /> {project.duration_weeks}w duration
                  </span>
                )}
                {deadline && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                    <CalendarDays className="w-3.5 h-3.5" /> Due {deadline}
                  </span>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">About this project</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Skills */}
              {project.required_skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Required Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.required_skills.map((s) => (
                      <SkillTag key={s} label={s} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT — Apply form ── */}
            <div className="flex-1 p-6 md:p-8 flex flex-col gap-4">
              <div className="mb-1">
                <h3 className="text-white font-bold text-base">Your Application</h3>
                <p className="text-slate-500 text-sm mt-0.5">Tell the company why you&apos;re the best fit.</p>
              </div>

              <ApplyForm
                projectId={project.id}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            </div>
          </div>
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
  const [page, setPage]             = useState(1)

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

  // Reset page when search changes
  function handleSearch(e) {
    setQuery(e.target.value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
          onChange={handleSearch}
          placeholder="Filter by skill, title, or company…"
          className="kb-input w-full pl-10 pr-10 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setPage(1) }}
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
          : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} open project${filtered.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}`}
      </p>

      {/* Grid */}
      {paged.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {paged.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isApplied={appliedSet.has(project.id)}
              onApply={setActive}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

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
