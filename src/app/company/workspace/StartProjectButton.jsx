'use client'
// src/app/company/workspace/StartProjectButton.jsx
// Client component — "Start Project & Lock Escrow" button used in the hub page.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Lock, AlertTriangle, X } from 'lucide-react'

export default function StartProjectButton({ projectId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    setError('')
    setShowModal(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to start project.')
        return
      }
      router.push(`/company/workspace/${projectId}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <div className="flex flex-col gap-1">
        <button
          id={`start-project-hub-${projectId}`}
          onClick={() => setShowModal(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {loading ? 'Starting…' : 'Start Project & Lock Escrow'}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* In-App Confirmation Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-[hsl(var(--kb-surface-800))] border border-white/15 rounded-2xl p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>

            <h3 className="text-white font-bold text-lg mb-2">Start Project & Lock Escrow?</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              This will officially start the project and lock the agreed budget in escrow. The funds will be held securely until you release them upon completion.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-xl transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Yes, Lock Escrow
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
