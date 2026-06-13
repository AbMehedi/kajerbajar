'use client'

// src/app/student/dashboard/CertificatesSection.jsx
// Renders the "Earned Certificates" grid with a collapse/expand "See all" toggle.
// Shows PREVIEW_COUNT cards by default and expands inline with a fade-in animation.

import { useState } from 'react'
import { Award, Download, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const PREVIEW_COUNT = 4  // 2 columns × 2 rows feels natural

export default function CertificatesSection({ certificates, completedProjects }) {
  const [showAll, setShowAll] = useState(false)

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
        <Award className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium">No certificates yet.</p>
        <p className="text-slate-400 text-sm mt-1">Complete projects to earn certificates.</p>
      </div>
    )
  }

  const visible = showAll ? certificates : certificates.slice(0, PREVIEW_COUNT)
  const hasMore = certificates.length > PREVIEW_COUNT

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((cert, idx) => {
          const project = completedProjects.find(p => p.projects?.id === cert.project_id)?.projects
          const projectTitle = project?.title || 'Unknown Project'
          const displayId = `KB-${cert.id.slice(0, 8).toUpperCase()}`
          const isExtra = idx >= PREVIEW_COUNT

          return (
            <div
              key={cert.id}
              className={`border border-white/10 bg-white/4 rounded-xl p-5 hover:bg-white/5 transition-colors ${
                isExtra ? 'animate-fadeInRow' : ''
              }`}
            >
              <h3 className="text-white font-semibold mb-1 truncate" title={projectTitle}>
                {projectTitle}
              </h3>
              <p className="text-slate-400 text-xs mb-3">
                Issued: {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-slate-500 text-xs font-mono bg-white/5 px-2 py-1 rounded inline-block mb-4 border border-white/10">
                ID: {displayId}
              </p>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                <a
                  href={`/api/projects/${cert.project_id}/certificate`}
                  download
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>
                <Link
                  href={`/verify-certificate?id=${cert.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Verify
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* See all / Show less toggle */}
      {hasMore && (
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center">
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
                See all {certificates.length} certificates
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
