'use client'

// src/app/(auth)/register/page.jsx
// Member B owns this file.
//
// Styles: uses .gradient-brand and .glass from globals.css
// Form input: uses <FormInput> from @/components/ui/FormInput
//
// XP NOTE: Instead of 9 identical <input className="..."> blocks,
// we use <FormInput> once. Student/company fields are data-driven
// arrays so adding a new field = adding one object, not copy-pasting JSX.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import FormInput from '@/components/ui/FormInput'

// ── Field definitions ─────────────────────────────────────────────────────────
// To add a new field to student or company registration, add an object here.
// No JSX duplication needed.

const STUDENT_FIELDS = [
  { id: 'username',        key: 'username',        type: 'text',   placeholder: 'Username (e.g. rafiq_ahan)',    required: true  },
  { id: 'university',      key: 'university',       type: 'text',   placeholder: 'University (optional)',         required: false },
  { id: 'graduation-year', key: 'graduationYear',   type: 'number', placeholder: 'Graduation year (optional)',    required: false, min: '2020', max: '2035' },
]

const COMPANY_FIELDS = [
  { id: 'legal-name', key: 'legalName', type: 'text', placeholder: 'Company legal name',        required: true  },
  { id: 'website',    key: 'website',   type: 'url',  placeholder: 'Website URL (optional)',    required: false },
  { id: 'industry',   key: 'industry',  type: 'text', placeholder: 'Industry (e.g. Tech, Finance)', required: false },
]

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole]       = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Shared form state
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')

  // Student-only state (keyed by STUDENT_FIELDS[].key)
  const [studentData, setStudentData] = useState({ username: '', university: '', graduationYear: '' })

  // Company-only state (keyed by COMPANY_FIELDS[].key)
  const [companyData, setCompanyData] = useState({ legalName: '', website: '', industry: '' })

  // Generic setter for data-driven field arrays
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
            username: studentData.username,
            university: studentData.university,
            graduation_year: studentData.graduationYear ? parseInt(studentData.graduationYear) : null,
          }
        : {
            legal_name: companyData.legalName,
            website: companyData.website,
            industry: companyData.industry,
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

    // Auto-login after registration
    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email, password })

    router.push(role === 'student' ? '/student/dashboard' : '/company/dashboard')
  }

  return (
    <div className="gradient-brand min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">কাজের বাজার</h1>
          <p className="text-purple-300 mt-1 text-sm">KaajerBazar — Work Marketplace</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>

          {/* Role toggle — Student / Company */}
          <div className="flex rounded-lg overflow-hidden border border-white/20 mb-6">
            {['student', 'company'].map((r) => (
              <button
                key={r}
                id={`role-${r}`}
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

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Shared fields */}
            <FormInput id="full-name" type="text"     value={fullName}  onChange={(e) => setFullName(e.target.value)}  placeholder="Full name"         required />
            <FormInput id="email"     type="email"    value={email}     onChange={(e) => setEmail(e.target.value)}     placeholder="Email address"     required />
            <FormInput id="password"  type="password" value={password}  onChange={(e) => setPassword(e.target.value)}  placeholder="Password (min 8 characters)" required minLength={8} />

            {/* Role-specific fields — driven by field definition arrays above */}
            {role === 'student' && STUDENT_FIELDS.map((f) => (
              <FormInput
                key={f.id}
                id={f.id}
                type={f.type}
                value={studentData[f.key]}
                onChange={setField(setStudentData)(f.key)}
                placeholder={f.placeholder}
                required={f.required}
                min={f.min}
                max={f.max}
              />
            ))}

            {role === 'company' && COMPANY_FIELDS.map((f) => (
              <FormInput
                key={f.id}
                id={f.id}
                type={f.type}
                value={companyData[f.key]}
                onChange={setField(setCompanyData)(f.key)}
                placeholder={f.placeholder}
                required={f.required}
              />
            ))}

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
