'use client'
// src/app/company/workspace/[id]/DeliverableReviewPanel.jsx
// Company reviews deliverables, downloads files via signed URL, and releases payment.

import { useState } from 'react'
import {
  FileText, CheckCircle, XCircle, Banknote,
  Download, File, Loader2, Image, Archive, Code,
} from 'lucide-react'

// ── File type icon helper ────────────────────────────────────────────────────
function fileIcon(mime, name) {
  if (!mime && name) {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return Image
    if (['zip','rar','tar','gz','7z'].includes(ext)) return Archive
    if (['js','ts','jsx','tsx','py','java','c','cpp','go','rb'].includes(ext)) return Code
  }
  if (mime?.startsWith('image/'))             return Image
  if (mime?.includes('zip') || mime?.includes('tar')) return Archive
  if (mime?.startsWith('text/') || mime?.includes('javascript')) return Code
  return File
}

function formatBytes(bytes) {
  if (!bytes) return ''
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Download button ──────────────────────────────────────────────────────────
function FileDownloadButton({ projectId, storagePath, fileName, fileMime, fileSize }) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const Icon = fileIcon(fileMime, fileName)

  async function handleDownload() {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(
        `/api/projects/${projectId}/deliverables/download-url?storagePath=${encodeURIComponent(storagePath)}`
      )
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Failed to get download link'); return }

      // Open in new tab — browser handles inline preview or download
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch {
      setErr('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-60 group"
      >
        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{fileName || 'Attached File'}</p>
          {fileSize && <p className="text-slate-500 text-xs">{formatBytes(fileSize)}</p>}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
        ) : (
          <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0" />
        )}
      </button>
      {err && <p className="text-red-400 text-xs pl-1">⚠️ {err}</p>}
    </div>
  )
}

// ── Deliverable card ─────────────────────────────────────────────────────────
function DeliverableCard({ deliverable, projectId, onReviewed }) {
  const [loading,     setLoading]     = useState(null) // 'approve' | 'reject'
  const [feedback,    setFeedback]    = useState('')
  const [showFeedback,setShowFeedback]= useState(false)

  const statusMap = {
    pending:  { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', label: '⏳ Awaiting Review' },
    approved: { cls: 'bg-green-500/15 text-green-400 border-green-500/30',   label: '✅ Approved'        },
    rejected: { cls: 'bg-red-500/15   text-red-400   border-red-500/30',     label: '❌ Needs Revision'  },
  }
  const { cls, label } = statusMap[deliverable.status] ?? statusMap.pending
  const isPending = deliverable.status === 'pending'

  async function handleAction(action) {
    setLoading(action)
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables/${deliverable.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, feedback: feedback.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { alert(`Error: ${data.error}`); return }
      onReviewed(deliverable.id, data.status, feedback.trim())
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  // Detect whether it's a Supabase storage path (not a plain URL)
  const isStoragePath = deliverable.submission_file_url &&
    !deliverable.submission_file_url.startsWith('http')

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isPending
        ? 'border-yellow-500/25 bg-yellow-500/4'
        : 'border-white/10 bg-white/3'
    }`}>
      {/* Card header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <p className="text-slate-300 text-sm font-medium">
              Submitted {new Date(deliverable.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              {' · '}
              <span className="text-slate-500">
                {new Date(deliverable.created_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {label}
          </span>
        </div>

        {/* Description */}
        {deliverable.submission_text && (
          <div className="bg-white/5 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border border-white/8">
            {deliverable.submission_text}
          </div>
        )}

        {/* File attachment */}
        {deliverable.submission_file_url && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              📎 Attached File
            </p>
            {isStoragePath ? (
              <FileDownloadButton
                projectId={projectId}
                storagePath={deliverable.submission_file_url}
                fileName={deliverable.file_name}
                fileMime={deliverable.file_mime_type}
                fileSize={deliverable.file_size_bytes}
              />
            ) : (
              // Legacy plain URL (before file upload was implemented)
              <a
                href={deliverable.submission_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2"
              >
                <Download className="w-3.5 h-3.5" />
                {deliverable.file_name || 'View Submitted File'}
              </a>
            )}
          </div>
        )}

        {/* Previous company feedback */}
        {deliverable.company_feedback && (
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1.5">
              💬 Your Feedback
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{deliverable.company_feedback}</p>
          </div>
        )}

        {/* Review actions — only for pending */}
        {isPending && (
          <div className="pt-1 space-y-3 border-t border-white/10">
            {showFeedback && (
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Leave feedback for the student (optional for approve, recommended for reject)…"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-slate-300 text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 resize-none transition-colors"
              />
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (!showFeedback) setShowFeedback(true)
                  else handleAction('approve')
                }}
                disabled={loading !== null}
                className="flex-1 min-w-32 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading === 'approve'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                {showFeedback ? 'Confirm Approve' : 'Approve Work'}
              </button>

              <button
                onClick={() => {
                  if (!showFeedback) { setShowFeedback(true); return }
                  handleAction('reject')
                }}
                disabled={loading !== null}
                className="flex-1 min-w-32 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading === 'reject'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                {showFeedback ? 'Confirm Reject' : 'Request Revision'}
              </button>
            </div>

            {!showFeedback && (
              <p className="text-slate-600 text-xs">
                Click a button to expand feedback before confirming.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function DeliverableReviewPanel({
  projectId,
  deliverables: initialDeliverables,
  isInProgress,
  isCompleted,
  studentPayout,
  commission,
  studentName,
}) {
  const [deliverables,   setDeliverables]   = useState(initialDeliverables)
  const [releasing,      setReleasing]      = useState(false)
  const [releaseSuccess, setReleaseSuccess] = useState(false)
  const [releaseError,   setReleaseError]   = useState('')
  const [showConfirm,    setShowConfirm]    = useState(false)

  function handleReviewed(id, newStatus, newFeedback) {
    setDeliverables((prev) =>
      prev.map((d) => d.id === id
        ? { ...d, status: newStatus, company_feedback: newFeedback || d.company_feedback }
        : d
      )
    )
  }

  function handleRelease() {
    setShowConfirm(true)
  }

  async function executeRelease() {
    setShowConfirm(false)
    setReleasing(true)
    setReleaseError('')
    try {
      const res  = await fetch(`/api/projects/${projectId}/release`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setReleaseError(data.error || 'Failed to release payment.'); return }
      setReleaseSuccess(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setReleaseError('Network error. Please try again.')
    } finally {
      setReleasing(false)
    }
  }

  const pending    = deliverables.filter((d) => d.status === 'pending')
  const reviewed   = deliverables.filter((d) => d.status !== 'pending')
  const hasApproved = deliverables.some((d) => d.status === 'approved')

  return (
    <div className="space-y-6">

      {/* ── Payment Release ── */}
      {isInProgress && (
        <div className={`glass rounded-2xl p-6 border ${
          hasApproved ? 'border-green-500/30' : 'border-white/10'
        }`}>
          <h2 className="text-white font-semibold text-lg mb-1">💰 Release Payment</h2>
          <p className="text-slate-400 text-sm mb-5">
            Once satisfied with the work, release the escrowed funds to the student.
          </p>

          <div className="flex items-stretch gap-4 mb-5 flex-wrap">
            <div className="flex-1 bg-green-500/8 border border-green-500/20 rounded-xl p-4 min-w-40">
              <p className="text-slate-500 text-xs mb-1">Student receives</p>
              <p className="text-green-400 font-bold text-2xl">৳{studentPayout.toLocaleString()}</p>
            </div>
            <div className="flex items-center text-slate-600 font-bold text-lg">+</div>
            <div className="flex-1 bg-white/4 border border-white/10 rounded-xl p-4 min-w-40">
              <p className="text-slate-500 text-xs mb-1">Platform fee (10%)</p>
              <p className="text-slate-300 font-semibold text-xl">৳{commission.toLocaleString()}</p>
            </div>
          </div>

          {!hasApproved && (
            <div className="flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3 mb-4">
              <span className="text-yellow-400 shrink-0">⚠️</span>
              <p className="text-yellow-400 text-sm">
                You haven&apos;t approved any deliverables yet. Review and approve the student&apos;s work first.
              </p>
            </div>
          )}

          {releaseError && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              ⚠️ {releaseError}
            </p>
          )}

          {releaseSuccess ? (
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Payment released! Refreshing…
            </div>
          ) : (
            <button
              id="release-payment-btn"
              onClick={handleRelease}
              disabled={releasing || !hasApproved}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              {releasing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Banknote className="w-4 h-4" />
              }
              {releasing ? 'Processing…' : `Release ৳${studentPayout.toLocaleString()} to ${studentName}`}
            </button>
          )}
        </div>
      )}

      {/* ── Deliverables list ── */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-white font-semibold text-lg mb-1">
          📬 Student Submissions
        </h2>
        <p className="text-slate-500 text-sm mb-5">
          {deliverables.length === 0
            ? 'No submissions yet. The student will submit work here.'
            : `${deliverables.length} submission${deliverables.length !== 1 ? 's' : ''} · ${pending.length} pending review`}
        </p>

        {deliverables.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Waiting for the student to submit their first deliverable.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">
                  ⏳ Awaiting Review ({pending.length})
                </p>
                {pending.map((d) => (
                  <DeliverableCard
                    key={d.id}
                    deliverable={d}
                    projectId={projectId}
                    onReviewed={handleReviewed}
                  />
                ))}
              </div>
            )}

            {reviewed.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  ✅ Reviewed ({reviewed.length})
                </p>
                {reviewed.map((d) => (
                  <DeliverableCard
                    key={d.id}
                    deliverable={d}
                    projectId={projectId}
                    onReviewed={handleReviewed}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Release Payment?</h3>
            <p className="text-slate-400 text-sm mb-4">
              Release <strong className="text-green-400 font-semibold">৳{studentPayout.toLocaleString()}</strong> to {studentName}?
            </p>
            <p className="text-slate-500 text-xs mb-6 pb-4 border-b border-white/10">
              Platform commission: ৳{commission.toLocaleString()}<br/><br/>
              <span className="text-red-400">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeRelease}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-500 text-white transition-colors shadow-lg shadow-green-900/20"
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
