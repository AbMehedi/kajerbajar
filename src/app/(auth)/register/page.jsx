'use client'

// src/app/(auth)/register/page.jsx
// Phase F: Split-screen layout, card-style role selector, staggered form animations.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, User, ArrowRight, GraduationCap, Building2 } from 'lucide-react'

// ── Field definitions ──────────────────────────────────────────────────────────
const STUDENT_FIELDS = [
  { id: 'username',        key: 'username',       type: 'text',   placeholder: 'Username (e.g. rafiq_ahan)',     required: true,  icon: User   },
  { id: 'university',      key: 'university',      type: 'text',   placeholder: 'University (optional)',          required: false, icon: GraduationCap },
  { id: 'graduation-year', key: 'graduationYear',  type: 'number', placeholder: 'Graduation year (optional)',     required: false, min: '2020', max: '2035' },
]

const COMPANY_FIELDS = [
  { id: 'legal-name', key: 'legalName', type: 'text', placeholder: 'Company legal name',            required: true,  icon: Building2 },
  { id: 'website',    key: 'website',   type: 'url',  placeholder: 'Website URL (optional)',         required: false },
  { id: 'industry',   key: 'industry',  type: 'text', placeholder: 'Industry (e.g. Tech, Finance)',  required: false },
]

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
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
      className={`flex-1 flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
        active
          ? 'border-[hsl(var(--kb-brand-500))] bg-[hsl(var(--kb-brand-500))/0.12] ring-2 ring-[hsl(var(--kb-brand-500))/0.25]'
          : 'border-white/15 bg-white/3 hover:border-[hsl(var(--kb-brand-500))/0.4] hover:bg-white/5'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        active ? 'bg-[hsl(var(--kb-brand-500))/0.18] text-[hsl(var(--kb-brand-400))]' : 'bg-white/8 text-slate-400'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>
          {role.title}
        </p>
        <p className="text-xs text-slate-500 leading-snug mt-0.5">{role.desc}</p>
      </div>
    </button>
  )
}

// ── Labelled input with optional icon ─────────────────────────────────────────
function FieldInput({ id, type, value, onChange, placeholder, required, min, max, icon: Icon, label }) {
  return (
    <motion.div variants={itemVariants}>
      {label && (
        <label htmlFor={id} className="block text-slate-300 text-sm mb-1.5">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
          className={`kb-input w-full text-sm ${Icon ? 'pl-10' : ''}`}
        />
      </div>
    </motion.div>
  )
}

// ── Brand panel ────────────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[42%] relative flex-col items-center justify-center overflow-hidden"
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

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const [studentData, setStudentData] = useState({ username: '', university: '', graduationYear: '' })
  const [companyData, setCompanyData] = useState({ legalName: '', website: '', industry: '' })

  function setField(setter) {
    return (key) => (e) => setter((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      email,
      password,
      full_name: fullName,
      role,
      ...(role === 'student'
        ? {
            username:        studentData.username,
            university:      studentData.university,
            graduation_year: studentData.graduationYear ? parseInt(studentData.graduationYear) : null,
          }
        : {
            legal_name: companyData.legalName,
            website:    companyData.website,
            industry:   companyData.industry,
          }),
    }

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
    await supabase.auth.signInWithPassword({ email, password })
    router.push(role === 'student' ? '/student/dashboard' : '/company/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(var(--kb-surface-900))' }}>
      <BrandPanel />

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <motion.div variants={itemVariants} className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-white">কাজের বাজার</h1>
            <p className="text-[hsl(var(--kb-brand-400))] mt-1 text-sm">KaajerBazar — Work Marketplace</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-slate-400 text-sm mb-6">Join thousands of students and companies already on the platform.</p>
          </motion.div>

          {/* Role card selector */}
          <motion.div variants={itemVariants}>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-3">I am a…</p>
            <div className="flex gap-3 mb-6">
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

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Shared fields */}
            <FieldInput
              id="full-name" type="text" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name" required icon={User} label="Full name"
            />
            <FieldInput
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required icon={Mail} label="Email address"
            />
            <FieldInput
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)" required icon={Lock} label="Password"
            />

            {/* Role-specific fields */}
            <AnimatePresence mode="wait">
              {role === 'student' && (
                <motion.div
                  key="student-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  {STUDENT_FIELDS.map((f) => (
                    <FieldInput
                      key={f.id}
                      id={f.id}
                      type={f.type}
                      value={studentData[f.key]}
                      onChange={setField(setStudentData)(f.key)}
                      placeholder={f.placeholder}
                      required={f.required}
                      min={f.min}
                      max={f.max}
                      icon={f.icon}
                    />
                  ))}
                </motion.div>
              )}
              {role === 'company' && (
                <motion.div
                  key="company-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  {COMPANY_FIELDS.map((f) => (
                    <FieldInput
                      key={f.id}
                      id={f.id}
                      type={f.type}
                      value={companyData[f.key]}
                      onChange={setField(setCompanyData)(f.key)}
                      placeholder={f.placeholder}
                      required={f.required}
                      icon={f.icon}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <motion.button
                id="register-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full kb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
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

          <motion.p variants={itemVariants} className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[hsl(var(--kb-brand-400))] hover:text-[hsl(var(--kb-brand-500))] font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
