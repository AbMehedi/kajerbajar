'use client'

import { useState, useMemo } from 'react'
import { Search, Star, Briefcase, Download, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

function StarRating({ rating }) {
  if (!rating) return null
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  )
}

function ApplicationStatusBadge({ status }) {
  const styles = {
    pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    selected: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  const labels = {
    pending:  "Pending",
    selected: "Selected ✓",
    rejected: "Rejected",
  }
  const cls = styles[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30"
  return (
    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function ProjectHistoryClient({ applications, reviews, unlockedProjectIds }) {
  const [query, setQuery] = useState('')

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return applications
    return applications.filter((app) => {
      const haystack = [
        app.projects?.title,
        app.projects?.company_profiles?.legal_name,
        app.status,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [applications, query])

  return (
    <div className="glass rounded-xl p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-400" /> 
          Project History
        </h3>
        
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      {!filteredApps || filteredApps.length === 0 ? (
        <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5 mt-2">
          <Briefcase className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium">No projects found.</p>
          {!query && (
            <div className="mt-4">
              <Link href="/student/projects" className="kb-btn-primary px-4 py-2 rounded-lg text-sm font-semibold">
                Browse Projects
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {filteredApps.map((app) => {
            const project = app.projects
            const isCompleted = project?.status === 'completed'
            const review = reviews?.find(r => r.project_id === project?.id)
            const isUnlocked = unlockedProjectIds.has(project?.id)

            return (
              <div key={app.id} className="border border-white/10 bg-white/4 rounded-xl p-5 hover:bg-white/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-semibold text-base">{project?.title || 'Unknown Project'}</h4>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <span className="text-purple-400 font-medium">{project?.company_profiles?.legal_name}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span>৳{project?.budget_bdt?.toLocaleString() ?? '0'}</span>
                    </p>
                  </div>

                  {app.status === 'selected' && (
                    <div className="shrink-0 text-right">
                      {isCompleted ? (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 font-medium border border-green-500/20">
                          Completed ✓
                        </span>
                      ) : (
                        <Link href={`/student/workspace/${project?.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                          Go to Workspace
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {!review ? (
                          <span className="text-xs text-slate-500 italic">No feedback received</span>
                        ) : isUnlocked ? (
                          <div className="flex flex-col gap-2">
                            <StarRating rating={review.rating} />
                            {review.comment && (
                              <p className="text-sm text-slate-300 italic">&quot;{review.comment}&quot;</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs px-2.5 py-1 flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-medium w-fit">
                            <Star className="w-3 h-3" /> Hidden pending your review
                          </span>
                        )}
                      </div>
                      
                      {review && isUnlocked && (
                        <div className="text-xs text-slate-500 shrink-0 text-right mt-1">
                          {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
