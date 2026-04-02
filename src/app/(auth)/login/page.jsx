'use client'

// src/app/(auth)/login/page.jsx
// Member B owns this file.
//
// Styles: uses .gradient-brand and .glass from globals.css
// Form input: uses <FormInput> from @/components/ui/FormInput

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import FormInput from '@/components/ui/FormInput'

// Role → dashboard path mapping. Update here if routes change.
const ROLE_DASHBOARD = {
  student: '/student/dashboard',
  company: '/company/dashboard',
  admin:   '/admin/dashboard',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Fetch role to redirect to the correct dashboard
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(ROLE_DASHBOARD[profile?.role] ?? '/')
  }

  return (
    <div className="gradient-brand min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Brand logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">কাজের বাজার</h1>
          <p className="text-purple-300 mt-1 text-sm">KaajerBazar — Work Marketplace</p>
        </div>

        {/* Auth card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {/* Inline error — uses badge-error from globals.css */}
          {error && (
            <p className="badge-error block mb-4 p-3">{error}</p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <FormInput
              id="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <FormInput
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
