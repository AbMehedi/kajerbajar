'use client'

// src/app/admin/dashboard/SkillReviewQueue.jsx
// Phase 2 - Story 2.2: Admin queue to approve/reject skill verifications

import { useState } from 'react'

function fileIcon(path = '') {
  const ext = path.split('.').pop().toLowerCase()
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'
  if (['pdf'].includes(ext)) return '📄'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return '🎬'
  return '📎'
}

function fileBasename(path = '') {
  return path.split('/').pop()
}

export default function SkillReviewQueue({ submissions: initialSubmissions }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [expanded,    setExpanded]    = useState(null)
  const [loading,     setLoading]     = useState(null) // verificationId being processed
  const [feedback,    setFeedback]    = useState({})   // keyed by verificationId
  const [downloading, setDownloading] = useState(null) // verificationId whose file is being fetched

  async function handleAction(verificationId, action) {
    setLoading(verificationId)
    try {
      const res = await fetch('/api/admin/review-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          action,
          feedback: feedback[verificationId] || null,
        }),
      })
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== verificationId))
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDownload(verificationId, filePath) {
    setDownloading(verificationId)
    try {
      const res = await fetch(`/api/admin/download-submission?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      if (!res.ok) { alert(`Download error: ${data.error}`); return }
      // Open signed URL in a new tab — browser handles the download
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      alert('Failed to get download link. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-slate-400">All skill submissions have been reviewed!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const isExpanded  = expanded  === sub.id
        const isLoading   = loading   === sub.id
        const isDownloading = downloading === sub.id
        const studentName = sub.student_profiles?.users_profiles?.full_name || 'Unknown Student'
        const username    = sub.student_profiles?.username    || '—'
        const university  = sub.student_profiles?.university  || 'Not specified'
        const hasFile     = Boolean(sub.submission_file_url)

        return (
          <div key={sub.id} className="glass rounded-xl border border-white/10 overflow-hidden">
            {/* Card header — always visible */}
            <div
              className="flex items-start justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : sub.id)}
            >
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-white font-semibold">{sub.skill_category}</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                    Awaiting Review
                  </span>
                  {hasFile && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      {fileIcon(sub.submission_file_url)} File attached
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{studentName} · @{username}</p>
                <p className="text-slate-500 text-xs">{university}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-slate-500 text-xs">
                  {sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
                <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded review area */}
            {isExpanded && (
              <div className="border-t border-white/10 p-5 space-y-4">

                {/* AI Brief */}
                <div>
                  <p className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    🤖 AI-Generated Brief
                  </p>
                  <pre className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed font-sans bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                    {sub.ai_brief || 'No brief available.'}
                  </pre>
                </div>

                {/* File attachment */}
                {hasFile && (
                  <div>
                    <p className="text-blue-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                      📦 Submitted File
                    </p>
                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <span className="text-2xl">{fileIcon(sub.submission_file_url)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate">
                          {fileBasename(sub.submission_file_url)}
                        </p>
                        <p className="text-slate-500 text-xs">Click download to review</p>
                      </div>
                      <button
                        id={`download-${sub.id}`}
                        onClick={() => handleDownload(sub.id, sub.submission_file_url)}
                        disabled={isDownloading}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {isDownloading ? (
                          <>
                            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                            Getting link…
                          </>
                        ) : '⬇️ Download'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Student's text submission */}
                {sub.submission_text && (
                  <div>
                    <p className="text-green-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                      📝 Student Description
                    </p>
                    <div className="text-slate-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                      {sub.submission_text}
                    </div>
                  </div>
                )}

                {/* If neither text nor file */}
                {!hasFile && !sub.submission_text && (
                  <p className="text-slate-500 text-sm italic">No submission content available.</p>
                )}

                {/* Feedback input */}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">
                    Feedback (required for Reject / Revision, optional for Approve)
                  </label>
                  <textarea
                    id={`feedback-${sub.id}`}
                    value={feedback[sub.id] || ''}
                    onChange={(e) => setFeedback((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    placeholder="Write your feedback for the student…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    id={`approve-${sub.id}`}
                    onClick={() => handleAction(sub.id, 'approve')}
                    disabled={isLoading}
                    className="flex-1 min-w-24 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? '…' : '✅ Approve'}
                  </button>
                  <button
                    id={`revision-${sub.id}`}
                    onClick={() => handleAction(sub.id, 'revision')}
                    disabled={isLoading || !feedback[sub.id]?.trim()}
                    className="flex-1 min-w-24 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? '…' : '🔄 Request Revision'}
                  </button>
                  <button
                    id={`reject-${sub.id}`}
                    onClick={() => handleAction(sub.id, 'reject')}
                    disabled={isLoading || !feedback[sub.id]?.trim()}
                    className="flex-1 min-w-24 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {isLoading ? '…' : '❌ Reject'}
                  </button>
                </div>
                <p className="text-slate-600 text-xs">
                  ⚠️ Reject and Request Revision require feedback text above.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
