'use client'
// src/app/company/workspace/StartProjectButton.jsx
// Client component — "Start Project & Lock Escrow" button used in the hub page.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function StartProjectButton({ projectId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    if (!confirm('Start this project and lock the budget in escrow?')) return
    setLoading(true)
    setError('')
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
    <div className="flex flex-col gap-1">
      <button
        id={`start-project-hub-${projectId}`}
        onClick={handleStart}
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
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  )
}
