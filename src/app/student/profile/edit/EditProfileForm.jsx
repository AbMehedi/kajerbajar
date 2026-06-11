'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { BD_UNIVERSITIES } from '@/lib/universities'

export default function EditProfileForm({ initialData }) {
  const router = useRouter()
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update profile')
      
      setSuccess(true)
      // Redirect back to profile after a short delay
      setTimeout(() => {
        router.push('/student/profile')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
          ✅ Profile updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="mb-6">
          <AvatarUpload 
            avatarUrl={formData.avatar_url} 
            onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="e.g. Omor Faruck Ullas"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                placeholder="username"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">University / College</label>
          <input
            type="text"
            name="university"
            list="universities"
            value={formData.university}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="e.g. United International University"
          />
          <datalist id="universities">
            {BD_UNIVERSITIES.map((uni) => (
              <option key={uni} value={uni} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Short Bio</label>
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={100}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="A one-line description about you (max 100 chars)"
          />
        </div>
        
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">About Section (Optional)</label>
          <textarea
            name="about_text"
            value={formData.about_text}
            onChange={handleChange}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="Tell us more about your background, goals, and what makes you unique..."
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Portfolio URL (Optional)</label>
          <input
            type="url"
            name="portfolio_url"
            value={formData.portfolio_url}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            placeholder="https://your-portfolio.com"
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
