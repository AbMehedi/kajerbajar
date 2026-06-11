'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function CustomSkillInput({ category }) {
  const [skill, setSkill] = useState('')
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!skill.trim()) return
    router.push(`/student/learn/${category}/${encodeURIComponent(skill.trim())}`)
  }

  return (
    <div className="glass rounded-xl border border-white/10 p-6 mt-8">
      <h2 className="text-white font-semibold text-lg mb-2">Can&apos;t find your skill?</h2>
      <p className="text-slate-400 text-sm mb-4">Create a custom skill to verify and our AI will generate a unique project brief for you.</p>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="e.g. Svelte, Rust, 3D Animation..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!skill.trim()}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Skill
        </button>
      </form>
    </div>
  )
}
