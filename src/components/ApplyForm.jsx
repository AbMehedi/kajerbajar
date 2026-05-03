'use client'

// src/components/ApplyForm.jsx
// Story 3.2: Client component — apply to a micro-project
//
// Props:
//   projectId  {string}   — UUID of the project to apply to
//   onSuccess  {function} — called with no args when application succeeds
//   onCancel   {function} — called when user dismisses without applying
//
// States: idle → submitting → success | error

import { useState } from 'react'

const MAX_NOTE = 1000

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export default function ApplyForm({ projectId, onSuccess, onCancel }) {
  const [coverNote, setCoverNote]           = useState('')
  const [portfolioUrl, setPortfolioUrl]     = useState('')
  const [status, setStatus]                 = useState('idle') // 'idle' | 'submitting' | 'error'
  const [errorMsg, setErrorMsg]             = useState('')

  const isSubmitting = status === 'submitting'
  const remaining    = MAX_NOTE - coverNote.length

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    // Client-side validation
    if (!coverNote.trim()) {
      setErrorMsg('Please write a cover note before submitting.')
      return
    }
    if (coverNote.trim().length > MAX_NOTE) {
      setErrorMsg(`Cover note must be ${MAX_NOTE} characters or fewer.`)
      return
    }

    setStatus('submitting')

    try {
      const body = {
        project_id: projectId,
        cover_note: coverNote.trim(),
      }
      if (portfolioUrl.trim()) body.portfolio_item_url = portfolioUrl.trim()

      const res = await fetch('/api/applications/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit application. Please try again.')
        setStatus('error')
        return
      }

      // Notify parent — parent is responsible for closing the modal
      onSuccess?.()
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <span className="text-red-400 mt-0.5 shrink-0">⚠️</span>
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Cover note */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Cover Note <span className="text-red-400 ml-0.5">*</span>
        </label>
        <textarea
          id="apply-cover-note"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          placeholder="Tell the company why you're a great fit for this project…"
          rows={6}
          maxLength={MAX_NOTE}
          disabled={isSubmitting}
          className={`${inputClass} resize-none leading-relaxed`}
        />
        <span
          className={`text-xs self-end ${
            remaining < 50 ? 'text-yellow-500' : 'text-slate-600'
          }`}
        >
          {remaining} characters remaining
        </span>
      </div>

      {/* Portfolio URL (optional) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Portfolio / Work Sample URL
          <span className="text-slate-500 font-normal ml-2 text-xs">optional</span>
        </label>
        <input
          id="apply-portfolio-url"
          type="url"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          placeholder="https://github.com/yourhandle/relevant-project"
          disabled={isSubmitting}
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          id="apply-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            '🚀 Submit Application'
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2.5 border border-white/15 text-slate-400 hover:text-slate-200 hover:border-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
