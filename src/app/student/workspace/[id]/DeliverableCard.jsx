// src/app/student/workspace/[id]/DeliverableCard.jsx

import { FileText } from 'lucide-react'

export default function DeliverableCard({ deliverable }) {
  const statusMap = {
    pending:  { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: 'Awaiting Review' },
    approved: { cls: 'bg-green-500/15 text-green-400 border-green-500/30', label: '✓ Approved' },
    rejected: { cls: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Needs Revision' },
  }
  const { cls, label } = statusMap[deliverable.status] ?? statusMap.pending

  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-slate-300 text-sm font-medium">
            Submission — {new Date(deliverable.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
          {label}
        </span>
      </div>

      {deliverable.submission_text && (
        <div className="bg-white/5 rounded-lg p-3 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border border-white/8">
          {deliverable.submission_text}
        </div>
      )}

      {deliverable.submission_file_url && (
        <a
          href={deliverable.submission_file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2"
        >
          🔗 View Attached File
        </a>
      )}

      {deliverable.company_feedback && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
            💬 Company Feedback
          </p>
          <p className="text-slate-300 text-sm">{deliverable.company_feedback}</p>
        </div>
      )}
    </div>
  )
}
