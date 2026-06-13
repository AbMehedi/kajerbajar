'use client'

// src/app/company/dashboard/ProjectsTable.jsx
// Renders the "Your Projects" table with a "See all" collapse/expand toggle.
// Shows PREVIEW_COUNT rows by default; expands inline with a fade-in animation.

import { useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

const PREVIEW_COUNT = 3

export default function ProjectsTable({ projects }) {
  const [showAll, setShowAll] = useState(false)

  if (!projects || projects.length === 0) return null // handled by parent

  const visible = showAll ? projects : projects.slice(0, PREVIEW_COUNT)
  const hasMore = projects.length > PREVIEW_COUNT

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs border-b border-white/8">
              <th className="text-left pb-2 font-medium">Title</th>
              <th className="text-left pb-2 font-medium hidden sm:table-cell">Deadline</th>
              <th className="text-right pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((project, idx) => {
              const deadline = project.deadline
                ? new Date(project.deadline).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : null

              const daysLeft = project.deadline
                ? Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                : null

              // Extra rows beyond PREVIEW_COUNT get the fade-in animation
              const isExtra = idx >= PREVIEW_COUNT

              return (
                <tr
                  key={project.id}
                  className={`border-b border-white/5 last:border-0 transition-all duration-300 ${
                    isExtra ? 'animate-fadeInRow' : ''
                  }`}
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/company/projects/${project.id}`}
                      className="text-slate-200 font-medium truncate max-w-[200px] hover:text-purple-300 transition-colors block"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell">
                    {deadline ? (
                      <div>
                        <p className="text-slate-400 text-xs">{deadline}</p>
                        {daysLeft !== null && daysLeft >= 0 && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-600'}`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                          </p>
                        )}
                        {daysLeft !== null && daysLeft < 0 && (
                          <p className="text-xs mt-0.5 text-slate-600">Expired</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">No deadline</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={
                      project.status === 'open'
                        ? 'badge-success'
                        : project.status === 'closed'
                          ? 'badge-error'
                          : 'badge-warning'
                    }>
                      {project.status ?? 'open'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* See all / Show less toggle */}
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-purple-300 transition-colors group"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                Show less
              </>
            ) : (
              <>
                See all {projects.length} projects
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
