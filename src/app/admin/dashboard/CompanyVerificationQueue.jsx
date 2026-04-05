'use client'

// src/app/admin/dashboard/CompanyVerificationQueue.jsx
// Story 1.2: Admin can approve/reject companies from this queue
//
// Each company card shows:
//   - Company name, industry, email
//   - Link to view trade license PDF
//   - Approve button (instant)
//   - Reject button (requires feedback)

import { useState } from 'react'

export default function CompanyVerificationQueue({ companies }) {
  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}

function CompanyCard({ company }) {
  const [action, setAction] = useState(null) // null | 'approve' | 'reject'
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState(null) // 'approved' | 'rejected'

  const handleApprove = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/verify-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          action: 'approve',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve')
      }

      setCompleted('approved')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (feedback.trim().length < 10) {
      setError('Please provide feedback (at least 10 characters)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/verify-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          action: 'reject',
          feedback: feedback.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject')
      }

      setCompleted('rejected')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show completed state
  if (completed) {
    return (
      <div className={`glass rounded-xl p-4 border ${
        completed === 'approved' 
          ? 'border-green-500/30 bg-green-500/10' 
          : 'border-red-500/30 bg-red-500/10'
      }`}>
        <p className={completed === 'approved' ? 'text-green-400' : 'text-red-400'}>
          {completed === 'approved' ? '✅' : '❌'} {company.legal_name} has been {completed}
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-4 border border-white/10">
      {/* Company Info Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold">{company.legal_name}</h3>
          <p className="text-slate-400 text-sm">{company.industry || 'No industry specified'}</p>
          <p className="text-slate-500 text-xs mt-1">
            📅 Submitted: {company.license_uploaded_at ? new Date(company.license_uploaded_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>

        {/* Trade License Link */}
        {company.trade_license_url && (
          <a
            href={company.trade_license_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            📄 View Trade License
          </a>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}

      {/* Action Buttons */}
      {action === null && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 
              text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Processing...' : '✅ Approve'}
          </button>
          <button
            onClick={() => setAction('reject')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 
              text-white rounded-lg text-sm font-medium transition-colors"
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* Rejection Feedback Form */}
      {action === 'reject' && (
        <div className="mt-4 space-y-3">
          <label className="text-slate-300 text-sm block">
            Rejection reason (visible to company):
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., Trade license is expired or illegible. Please upload a clearer copy."
            className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg 
              text-white text-sm placeholder-slate-500 focus:outline-none 
              focus:ring-2 focus:ring-red-500/50"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading || feedback.trim().length < 10}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 
                disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => {
                setAction(null)
                setFeedback('')
                setError(null)
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 
                text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
