'use client'

// src/app/(auth)/login/page.jsx
// Phase F: Split-screen layout — left brand panel + right form.
// Framer Motion: form fields stagger-fade-in on mount.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'

const ROLE_DASHBOARD = {
  student: '/student/dashboard',
  company: '/company/dashboard',
  admin:   '/admin/dashboard',
}

// ── Framer Motion variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Brand panel (left side) ────────────────────────────────────────────────────
function BrandPanel() {
  return (
        <div className="hidden lg:flex lg:w-[42%] relative flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(145deg, hsl(220 26% 10%) 0%, hsl(220 30% 6%) 60%, hsl(42 40% 12%) 100%)' }}>

      {/* Background orbs */}
       <div aria-hidden className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20 pointer-events-none"
         style={{ background: 'radial-gradient(circle, hsl(42 92% 55%) 0%, transparent 70%)', animation: 'float 9s ease-in-out infinite' }} />
       <div aria-hidden className="absolute -bottom-20 -right-16 w-64 h-64 rounded-full opacity-15 pointer-events-none"
         style={{ background: 'radial-gradient(circle, hsl(42 92% 55%) 0%, transparent 70%)', animation: 'float 11s ease-in-out infinite reverse' }} />

      {/* Geometric SVG decoration */}
      <svg aria-hidden className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--kb-brand-500))/0.15] border border-[hsl(var(--kb-brand-500))/0.35] flex items-center justify-center mb-6 mx-auto"
               style={{ boxShadow: '0 0 32px hsl(42 92% 55% / 0.3)' }}>
            <span className="text-2xl font-extrabold text-[hsl(var(--kb-brand-400))]">ক</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight">
            কাজের <span className="gradient-text">বাজার</span>
          </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
            Bangladesh&apos;s premier platform connecting verified university students with SME micro-projects.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col gap-3 w-full max-w-xs"
        >
          {[
            { emoji: '🎯', text: 'AI-verified skill badges' },
            { emoji: '🔒', text: 'Secure escrow payments'  },
            { emoji: '🚀', text: 'Real-world portfolio'    },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3 border border-white/10">
              <span className="text-lg">{emoji}</span>
              <span className="text-slate-200 text-sm">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState('')

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

    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(ROLE_DASHBOARD[profile?.role] ?? '/')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(var(--kb-surface-900))' }}>
      <BrandPanel />

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-md"
        >
          {/* Mobile brand header (only shown when brand panel is hidden) */}
          <motion.div variants={itemVariants} className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-white">কাজের বাজার</h1>
            <p className="text-[hsl(var(--kb-brand-400))] mt-1 text-sm">KaajerBazar — Work Marketplace</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue.</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.p variants={itemVariants} className="badge-error block mb-5 p-3 text-sm">
              {error}
            </motion.p>
          )}

          {/* Google Sign In */}
          <motion.button
            variants={itemVariants}
            id="google-login"
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 rounded-xl transition-colors text-sm mb-5 shadow-sm"
          >
            {googleLoading ? (
              <span className="text-gray-500">Redirecting to Google…</span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-slate-300 text-sm mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="kb-input w-full pl-10 text-sm"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-slate-300 text-sm mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="kb-input w-full pl-10 text-sm"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                id="login-submit"
                type="submit"
                disabled={loading || googleLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full kb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.p variants={itemVariants} className="text-center text-slate-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[hsl(var(--kb-brand-400))] hover:text-[hsl(var(--kb-brand-500))] font-medium transition-colors">
              Register here
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

// ── Google "G" icon ────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
