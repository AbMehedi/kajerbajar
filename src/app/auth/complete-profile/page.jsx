'use client'

// src/app/auth/complete-profile/page.jsx
// New Google users land here to pick their role (student or company)
// and fill in the required extra fields before using the platform.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import FormInput from '@/components/ui/FormInput'

export default function CompleteProfile() {
  const router = useRouter()
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Student fields
  const [username, setUsername] = useState('')
  const [university, setUniversity] = useState('')

  // Company fields
  const [legalName, setLegalName] = useState('')
  const [industry, setIndustry] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Build payload for our register endpoint
    const payload = {
      email: user.email,
      password: null, // not needed — Google handles auth
      full_name: user.user_metadata?.full_name || user.email,
      role,
      ...(role === 'student'
        ? { username, university }
        : { legal_name: legalName, industry }),
    }

    const res = await fetch('/api/auth/complete-google-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: user.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to complete profile')
      setLoading(false)
      return
    }

    router.push(role === 'student' ? '/student/dashboard' : '/company/dashboard')
  }

  return (
    <div className="gradient-brand min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">কাজের বাজার</h1>
          <p className="text-purple-300 mt-1 text-sm">One last step to set up your account</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Complete Your Profile</h2>

          {/* Role toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/20 mb-6">
            {['student', 'company'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  role === r ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                {r === 'student' ? '🎓 Student' : '🏢 Company'}
              </button>
            ))}
          </div>

          {error && <p className="badge-error block mb-4 p-3">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'student' ? (
              <>
                <FormInput id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (e.g. rafiq_ahan)" required />
                <FormInput id="university" type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University (optional)" />
              </>
            ) : (
              <>
                <FormInput id="legal-name" type="text" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Company legal name" required />
                <FormInput id="industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry (e.g. Tech, Finance)" />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Saving…' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
