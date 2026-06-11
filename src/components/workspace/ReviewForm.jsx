'use client'

import { useState } from 'react'
import { Star, Send, Loader2, CheckCircle } from 'lucide-react'

export default function ReviewForm({ projectId, targetName }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) {
      setErrorMsg('Please select a star rating.')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/projects/${projectId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to submit review')

      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="glass rounded-xl p-6 border border-green-500/30 bg-green-500/5 text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold text-lg mb-1">Feedback Submitted</h3>
        <p className="text-slate-400 text-sm">Thank you for reviewing {targetName}!</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Star className="w-32 h-32 text-yellow-400" />
      </div>

      <h3 className="text-white font-semibold text-lg mb-1 relative z-10">
        Leave a Review for {targetName}
      </h3>
      <p className="text-slate-400 text-sm mb-6 relative z-10">
        Your feedback helps build trust in the KaajerBazar community.
      </p>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
        
        {/* Star Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Overall Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Written Feedback <span className="text-slate-600 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={status === 'submitting'}
            rows={3}
            placeholder="What was it like working together? Was the communication clear?..."
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 resize-none transition-colors disabled:opacity-50"
          />
        </div>

        {errorMsg && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'submitting' || rating === 0}
          className="inline-flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors w-full sm:w-auto shadow-lg shadow-yellow-900/20"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>

      </form>
    </div>
  )
}
