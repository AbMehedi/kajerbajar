'use client'

// src/app/admin/learning/queue/LearningReviewQueue.jsx
// Admin review queue — two-panel view per submission.
// Left: AI Brief (parsed JSON) + evaluation_hints (admin only)
// Right: Student submission, file download, attempt info
// Actions: Pass / Request Revision / Fail + feedback textarea

import { useState } from 'react'
import { CheckCircle2, RotateCcw, XCircle, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

function fileBasename(path = '') { return path.split('/').pop() }
function capitalize(str = '') { return str.charAt(0).toUpperCase() + str.slice(1) }

const LEVEL_COLORS = {
  rookie:  'bg-green-500/15 text-green-300 border-green-500/30',
  skilled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  expert:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
}

export default function LearningReviewQueue({ submissions: initial }) {
  const [submissions, setSubmissions] = useState(initial)
  const [expanded,    setExpanded]    = useState(null)
  const [loading,     setLoading]     = useState(null)
  const [feedback,    setFeedback]    = useState({})
  const [downloading, setDownloading] = useState(null)
  const [results,     setResults]     = useState({}) // { [id]: { type: 'pass'|'fail'|'revision', message } }

  async function handleAction(submissionId, decision) {
    const fb = feedback[submissionId]?.trim()
    if ((decision === 'fail' || decision === 'revision') && !fb) {
      alert('Please provide feedback before marking as Fail or Revision.')
      return
    }

    setLoading(submissionId)
    try {
      const res = await fetch(`/api/admin/learning/submissions/${submissionId}/review`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ decision, feedback: fb || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults((prev) => ({ ...prev, [submissionId]: { type: decision, message: data.message } }))
        // Remove from queue after a short delay so admin can see the result
        setTimeout(() => setSubmissions((prev) => prev.filter((s) => s.id !== submissionId)), 1500)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDownload(submissionId, filePath) {
    setDownloading(submissionId)
    try {
      const res = await fetch(`/api/admin/download-submission?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      if (!res.ok) { alert(`Download error: ${data.error}`); return }
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      alert('Failed to get download link.')
    } finally {
      setDownloading(null)
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center border border-white/10">
        <p className="text-3xl mb-3">🎉</p>
        <p className="text-white font-semibold">All submissions reviewed!</p>
        <p className="text-slate-400 text-sm mt-1">The learning module review queue is empty.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const isExpanded  = expanded  === sub.id
        const isLoading   = loading   === sub.id
        const isDl        = downloading === sub.id
        const result      = results[sub.id]

        const brief       = sub.ai_brief_parsed ?? {}
        const moduleData  = sub.learning_modules ?? {}
        const student     = sub.users_profiles ?? {}
        const studentProfile = (Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles) ?? {}
        const studentName = student.full_name ?? 'Unknown Student'
        const username    = studentProfile.username ?? '—'
        const university  = studentProfile.university ?? 'Not specified'
        const hasFile     = Boolean(sub.submission_file_url)
        const levelColor  = LEVEL_COLORS[moduleData.difficulty_level] ?? 'bg-white/10 text-white border-white/20'

        return (
          <div key={sub.id} className={`glass rounded-xl border overflow-hidden transition-all ${
            result?.type === 'pass'     ? 'border-green-500/40' :
            result?.type === 'fail'     ? 'border-red-500/40'   :
            result?.type === 'revision' ? 'border-blue-500/40'  :
            'border-white/10'
          }`}>
            {/* ── Header (always visible) ── */}
            <div
              className="flex items-start justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors gap-3"
              onClick={() => setExpanded(isExpanded ? null : sub.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white font-semibold">{moduleData.skill_name ?? 'Unknown Skill'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${levelColor}`}>
                    {moduleData.difficulty_level}
                  </span>
                  <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Attempt {sub.attempt_number} / 3
                  </span>
                  {hasFile && (
                    <span className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      📎 File attached
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{studentName} · @{username}</p>
                <p className="text-slate-500 text-xs">{university}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-slate-500 text-xs">
                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* ── Expanded Review Area ── */}
            {isExpanded && (
              <div className="border-t border-white/10 p-5">

                {/* ── Result Banner ── */}
                {result && (
                  <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${
                    result.type === 'pass'     ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                    result.type === 'fail'     ? 'bg-red-500/10 border-red-500/30 text-red-300'       :
                    'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}>
                    {result.message}
                  </div>
                )}

                {/* ── Two-panel layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* LEFT: AI Brief */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        🧠 AI-Generated Brief
                      </p>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-3">
                        {brief.project_title && (
                          <h3 className="text-white font-bold text-base">{brief.project_title}</h3>
                        )}
                        {brief.client_context && (
                          <div className="border-l-2 border-purple-500/40 pl-3">
                            <p className="text-slate-300 text-sm italic">{brief.client_context}</p>
                          </div>
                        )}
                        {brief.task_description && (
                          <div>
                            <p className="text-white/60 text-xs font-semibold uppercase mb-1">Task</p>
                            <p className="text-slate-200 text-sm leading-relaxed">{brief.task_description}</p>
                          </div>
                        )}
                        {Array.isArray(brief.deliverables) && brief.deliverables.length > 0 && (
                          <div>
                            <p className="text-white/60 text-xs font-semibold uppercase mb-1">Deliverables</p>
                            <ul className="space-y-1">
                              {brief.deliverables.map((d, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start gap-1.5">
                                  <span className="text-purple-400 mt-0.5">•</span> {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evaluation Hints (ADMIN ONLY) */}
                    {brief.evaluation_hints && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                          🔑 Evaluation Hints (Admin Only)
                        </p>
                        <p className="text-amber-200/80 text-sm">{brief.evaluation_hints}</p>
                      </div>
                    )}

                    {/* Submission Meta */}
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Deadline: {new Date(sub.deadline_at).toLocaleString('en-GB')}</p>
                      <p>Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('en-GB') : '—'}</p>
                      <p>SLA Note: Admin review target is 48 hours from submission.</p>
                    </div>
                  </div>

                  {/* RIGHT: Student Submission */}
                  <div className="space-y-4">
                    <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">
                      📝 Student Submission
                    </p>

                    {/* File Download */}
                    {hasFile && (
                      <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm font-medium truncate">
                            {fileBasename(sub.submission_file_url)}
                          </p>
                          <p className="text-slate-500 text-xs">Click to download and review</p>
                        </div>
                        <button
                          id={`download-${sub.id}`}
                          onClick={() => handleDownload(sub.id, sub.submission_file_url)}
                          disabled={isDl}
                          className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {isDl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          {isDl ? 'Getting…' : 'Download'}
                        </button>
                      </div>
                    )}

                    {/* Description */}
                    {sub.submission_description ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-white/60 text-xs font-semibold uppercase mb-2">Description</p>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {sub.submission_description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No text description provided.</p>
                    )}

                    {!hasFile && !sub.submission_description && (
                      <p className="text-red-400 text-sm">⚠️ No submission content found.</p>
                    )}

                    {/* Feedback Input */}
                    <div>
                      <label className="block text-slate-400 text-xs mb-1.5">
                        Feedback for student
                        <span className="text-slate-500"> (required for Fail / Revision)</span>
                      </label>
                      <textarea
                        id={`feedback-${sub.id}`}
                        value={feedback[sub.id] || ''}
                        onChange={(e) => setFeedback((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                        placeholder="Write clear, actionable feedback for the student…"
                        rows={3}
                        className="w-full bg-white/5 border border-white/20 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        id={`pass-${sub.id}`}
                        onClick={() => handleAction(sub.id, 'pass')}
                        disabled={isLoading || Boolean(result)}
                        className="flex-1 min-w-24 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Pass
                      </button>
                      <button
                        id={`revision-${sub.id}`}
                        onClick={() => handleAction(sub.id, 'revision')}
                        disabled={isLoading || Boolean(result) || !feedback[sub.id]?.trim()}
                        className="flex-1 min-w-24 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Revision
                      </button>
                      <button
                        id={`fail-${sub.id}`}
                        onClick={() => handleAction(sub.id, 'fail')}
                        disabled={isLoading || Boolean(result) || !feedback[sub.id]?.trim()}
                        className="flex-1 min-w-24 flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Fail
                      </button>
                    </div>
                    <p className="text-slate-600 text-xs">⚠️ Fail and Revision require feedback text.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
