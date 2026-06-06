'use client'

// src/app/(auth)/register/page.jsx
// Phase F: Split-screen layout, card-style role selector, staggered form animations.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, User, ArrowRight, GraduationCap, Building2, FileText, Check, X, Loader2, Briefcase } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}
const formVariants = {
  hidden: { opacity: 0, height: 0 },
  show:   { opacity: 1, height: 'auto', transition: { duration: 0.3, staggerChildren: 0.05, delayChildren: 0.1 } },
  exit:   { opacity: 0, height: 0, transition: { duration: 0.3 } },
}

// ── Role cards ─────────────────────────────────────────────────────────────────
const ROLES = [
  {
    key:   'student',
    icon:  GraduationCap,
    title: 'Student',
    desc:  'Build a portfolio & earn with real projects',
  },
  {
    key:   'company',
    icon:  Building2,
    title: 'Company / SME',
    desc:  'Hire verified university talent affordably',
  },
]

function RoleCard({ role, activeRole, onSelect }) {
  const Icon    = role.icon
  const active  = activeRole === role.key

  return (
    <button
      type="button"
      id={`role-${role.key}`}
      onClick={() => onSelect(role.key)}
      className={`flex-1 flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${
        active
          ? 'border-[hsl(var(--kb-brand-500))] bg-[hsl(var(--kb-brand-500))/0.12] ring-2 ring-[hsl(var(--kb-brand-500))/0.25]'
          : 'border-[hsl(var(--kb-border))] bg-[hsl(var(--kb-surface-800))] hover:border-[hsl(var(--kb-brand-500))/0.4] hover:bg-[hsl(var(--kb-surface-700))]'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        active ? 'bg-[hsl(var(--kb-brand-500))/0.18] text-[hsl(var(--kb-brand-500))]' : 'bg-[hsl(var(--kb-surface-700))] text-[hsl(var(--kb-text-secondary))]'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? 'text-[hsl(var(--kb-text-primary))]' : 'text-[hsl(var(--kb-text-secondary))]'}`}>
          {role.title}
        </p>
        <p className="text-xs text-[hsl(var(--kb-text-muted))] leading-tight mt-0.5">{role.desc}</p>
      </div>
    </button>
  )
}

// ── Labelled input with optional icon ─────────────────────────────────────────
function FieldInput({ id, type, value, onChange, placeholder, required, min, max, icon: Icon, label, children }) {
  return (
    <motion.div variants={itemVariants}>
      {label && (
        <label htmlFor={id} className="block text-[hsl(var(--kb-text-secondary))] text-sm mb-1.5">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--kb-text-muted))] pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className={`kb-input w-full text-sm ${Icon ? 'pl-10' : ''} ${children ? 'pr-10' : ''}`}
        />
        {children}
      </div>
    </motion.div>
  )
}

function BrandPanel() {
  return (
    <div
      className="dark hidden lg:flex lg:w-[42%] relative flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, hsl(220 26% 10%) 0%, hsl(220 30% 6%) 60%, hsl(42 40% 12%) 100%)' }}
    >
      {/* Orbs */}
       <div aria-hidden className="absolute -top-24 -right-20 w-80 h-80 rounded-full opacity-20 pointer-events-none"
         style={{ background: 'radial-gradient(circle, hsl(42 92% 55%) 0%, transparent 70%)', animation: 'float 9s ease-in-out infinite' }} />
       <div aria-hidden className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full opacity-15 pointer-events-none"
         style={{ background: 'radial-gradient(circle, hsl(42 92% 55%) 0%, transparent 70%)', animation: 'float 11s ease-in-out infinite reverse' }} />

      {/* Grid overlay */}
      <svg aria-hidden className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid2)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div
            className="w-16 h-16 rounded-2xl bg-[hsl(var(--kb-brand-500))/0.15] border border-[hsl(var(--kb-brand-500))/0.35] flex items-center justify-center mb-6 mx-auto"
            style={{ boxShadow: '0 0 32px hsl(42 92% 55% / 0.3)' }}
          >
            <span className="text-2xl font-extrabold text-[hsl(var(--kb-brand-400))]">ক</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight">
            Join <span className="gradient-text">কাজের বাজার</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Start earning through real-world projects today. Zero upfront cost — just skill and dedication.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 grid grid-cols-2 gap-3 w-full max-w-xs"
        >
          {[
            { value: '500+', label: 'Students' },
            { value: '120+', label: 'Projects'  },
            { value: '৳2M+', label: 'Paid out'  },
            { value: '10%',  label: 'Commission' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/4 rounded-xl px-4 py-3 border border-white/10 text-center">
              <p className="text-white font-bold text-lg">{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole]       = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Shared state
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Student specific
  const [studentFullName, setStudentFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle, loading, available, taken
  const [university, setUniversity] = useState('')
  
  // Company specific
  const [companyLegalName, setCompanyLegalName] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [tradeLicenseFile, setTradeLicenseFile] = useState(null)

  // Username Availability Debounce
  useEffect(() => {
    if (role !== 'student') return;
    
    const checkUsername = async () => {
      if (!username || username.trim().length < 3) {
        setUsernameStatus('idle')
        return
      }
      
      setUsernameStatus('loading')
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch (err) {
        setUsernameStatus('idle')
      }
    }

    const delay = setTimeout(checkUsername, 500)
    return () => clearTimeout(delay)
  }, [username, role])

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (role === 'student' && usernameStatus === 'taken') {
      setError('Please choose an available username.')
      setLoading(false)
      return
    }

    const payload = {
      email,
      password,
      role,
      ...(role === 'student'
        ? {
            full_name: studentFullName,
            username: username,
            university: university,
          }
        : {
            full_name: companyLegalName,
            legal_name: companyLegalName,
            industry: companyIndustry,
          }),
    }

    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (authError) {
        throw new Error('Failed to sign in after registration')
      }

      // If company, upload trade license
      if (role === 'company' && tradeLicenseFile && authData.user) {
        const fileExt = tradeLicenseFile.name.split('.').pop()
        const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`
        const filePath = `${authData.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('trade-licenses')
          .upload(filePath, tradeLicenseFile)

        if (uploadError) {
          throw new Error(`Trade license upload failed: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage.from('trade-licenses').getPublicUrl(filePath)
        
        // Update company profile with trade license via API to bypass RLS
        const response = await fetch('/api/company/upload-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: publicUrlData.publicUrl }),
        })

        if (!response.ok) {
          const resData = await response.json()
          throw new Error(resData.error || 'Failed to update company profile')
        }
      }

      router.push(role === 'student' ? '/student/dashboard' : '/company/dashboard')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(var(--kb-surface-900))' }}>
      <BrandPanel />

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <motion.div variants={itemVariants} className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-[hsl(var(--kb-text-primary))]">কাজের বাজার</h1>
            <p className="text-[hsl(var(--kb-brand-500))] mt-1 text-sm">KaajerBazar — Work Marketplace</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-[hsl(var(--kb-text-primary))] mb-1">Create your account</h2>
            <p className="text-[hsl(var(--kb-text-secondary))] text-sm mb-5">Join thousands of students and companies already on the platform.</p>
          </motion.div>

          {/* Role card selector */}
          <motion.div variants={itemVariants}>
            <p className="text-[hsl(var(--kb-text-muted))] text-xs uppercase tracking-widest font-semibold mb-2">I am a…</p>
            <div className="flex gap-3 mb-5">
              {ROLES.map((r) => (
                <RoleCard key={r.key} role={r} activeRole={role} onSelect={setRole} />
              ))}
            </div>
          </motion.div>
          
          {error && (
            <motion.p variants={itemVariants} className="badge-error block mb-5 p-3 text-sm">
              {error}
            </motion.p>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            
            <AnimatePresence mode="wait">
              {/* ── Student Form ── */}
              {role === 'student' && (
                <motion.div
                  key="student-fields"
                  variants={formVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-3 overflow-hidden"
                >
                  <FieldInput
                    id="student-name" type="text" value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    placeholder="e.g. Omor Faruk" required icon={User} label="Full Name"
                  />
                  <FieldInput
                    id="student-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu" required icon={Mail} label="Email Address"
                  />
                  <FieldInput
                    id="student-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 characters)" required icon={Lock} label="Password"
                  />
                  <FieldInput
                    id="university" type="text" value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. United International University" required icon={GraduationCap} label="University"
                  />
                  
                  <FieldInput
                    id="username" type="text" value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="e.g. omorfaruk" required icon={User} label="Username"
                  >
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {usernameStatus === 'loading' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                      {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                      {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-500" />}
                    </div>
                  </FieldInput>
                  {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1">This username is already taken.</p>}
                  {usernameStatus === 'available' && <p className="text-xs text-green-500 mt-1">Username is available!</p>}
                </motion.div>
              )}

              {/* ── Company Form ── */}
              {role === 'company' && (
                <motion.div
                  key="company-fields"
                  variants={formVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="space-y-3 overflow-hidden"
                >
                  <FieldInput
                    id="company-name" type="text" value={companyLegalName}
                    onChange={(e) => setCompanyLegalName(e.target.value)}
                    placeholder="e.g. Acme Corp Ltd." required icon={Building2} label="Company Legal Name"
                  />
                  <FieldInput
                    id="company-industry" type="text" value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="e.g. Software, Healthcare, Retail" required icon={Briefcase} label="Industry"
                  />
                  <FieldInput
                    id="company-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com" required icon={Mail} label="Company Email"
                  />
                  <FieldInput
                    id="company-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 characters)" required icon={Lock} label="Password"
                  />
                  
                  <motion.div variants={itemVariants}>
                    <label className="block text-[hsl(var(--kb-text-secondary))] text-sm mb-1.5">Trade License (Optional)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--kb-text-muted))] pointer-events-none" />
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setTradeLicenseFile(e.target.files[0])}
                        className="kb-input w-full pl-10 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[hsl(var(--kb-surface-700))] file:text-white hover:file:bg-[hsl(var(--kb-surface-600))] cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--kb-text-muted))] mt-1.5">Upload a PDF or Image of your valid Trade License.</p>
                  </motion.div>

                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                id="register-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full kb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.p variants={itemVariants} className="text-center text-[hsl(var(--kb-text-secondary))] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[hsl(var(--kb-brand-600))] dark:text-[hsl(var(--kb-brand-400))] hover:text-[hsl(var(--kb-brand-700))] dark:hover:text-[hsl(var(--kb-brand-500))] font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

