'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MilestoneTracker({ projectId, role }) {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  
  const isCompany = role === 'company'

  useEffect(() => {
    async function fetchMilestones() {
      try {
        setLoading(true)
        const res = await fetch(`/api/projects/${projectId}/milestones`)
        if (!res.ok) throw new Error('Failed to fetch milestones')
        const data = await res.json()
        setMilestones(data.milestones || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMilestones()
  }, [projectId])

  async function addMilestone(e) {
    e.preventDefault()
    if (!newTitle.trim() || !isCompany) return

    try {
      setAdding(true)
      setError(null)
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      })
      if (!res.ok) throw new Error('Failed to add milestone')
      const data = await res.json()
      setMilestones([...milestones, data.milestone])
      setNewTitle('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function toggleMilestone(milestoneId, currentStatus) {
    if (!isCompany) return

    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    
    // Optimistic UI update
    setError(null)
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m))

    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
    } catch (err) {
      // Revert on error
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: currentStatus } : m))
      setError(err.message)
    }
  }

  async function deleteMilestone(milestoneId) {
    if (!isCompany) return

    try {
      setError(null)
      const res = await fetch(`/api/projects/${projectId}/milestones?milestoneId=${milestoneId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      setMilestones(prev => prev.filter(m => m.id !== milestoneId))
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 border border-white/10 mb-6 flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 text-[hsl(var(--kb-brand-500))] animate-spin" />
      </div>
    )
  }

  // If student and no milestones exist, don't render anything to keep UI clean
  if (!isCompany && milestones.length === 0) return null

  return (
    <div className="glass rounded-xl p-6 border border-white/10 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[hsl(var(--kb-brand-400))]" />
          Project Milestones
        </h3>
        <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full font-medium">
          {milestones.filter(m => m.status === 'completed').length} / {milestones.length}
        </span>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {milestones.length === 0 && isCompany && (
          <p className="text-sm text-slate-500 italic text-center py-4">
            No milestones added yet. Add tasks below to track progress.
          </p>
        )}

        {milestones.map((m) => (
          <div 
            key={m.id} 
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              m.status === 'completed' 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <button
                onClick={() => toggleMilestone(m.id, m.status)}
                disabled={!isCompany}
                className={`shrink-0 transition-colors ${
                  !isCompany ? 'cursor-default' : 'hover:scale-110 cursor-pointer'
                }`}
              >
                {m.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 hover:text-white" />
                )}
              </button>
              <span className={`text-sm truncate transition-all ${
                m.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
              }`}>
                {m.title}
              </span>
            </div>
            
            {isCompany && (
              confirmDeleteId === m.id ? (
                <div className="ml-3 flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="text-xs font-semibold px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmDeleteId(m.id)}
                  className="ml-3 p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors shrink-0"
                  title="Delete Milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {isCompany && (
        <form onSubmit={addMilestone} className="flex gap-2 relative">
          <input
            type="text"
            placeholder="Add a new milestone (e.g., UI Design, API Integration)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[hsl(var(--kb-brand-500))]/50 focus:ring-1 focus:ring-[hsl(var(--kb-brand-500))]/50 transition-all"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || adding}
            className="absolute right-1.5 top-1.5 p-1.5 bg-white/10 text-white rounded-md hover:bg-[hsl(var(--kb-brand-500))] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </form>
      )}
    </div>
  )
}
