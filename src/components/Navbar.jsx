'use client'

// src/components/Navbar.jsx
// Member B owns this file.
// Role-aware navigation bar — conditionally renders links based on user role.
//
// XP NOTE: NAV_LINKS is a data object, not JSX. To add a new page to a role's
// navigation → add one line to the array. No JSX copy-pasting needed.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ── Navigation link definitions ───────────────────────────────────────────────
// Add new routes here — the component renders them automatically.
const NAV_LINKS = {
  student: [
    { href: '/student/dashboard',  label: 'Dashboard'       },
    { href: '/student/projects',   label: 'Browse Projects' },
    { href: '/student/skill-test', label: 'Skill Tests'     },
  ],
  company: [
    { href: '/company/dashboard',    label: 'Dashboard'      },
    { href: '/company/post-project', label: 'Post a Project' },
  ],
  admin: [
    { href: '/admin/dashboard',        label: 'Dashboard'     },
    { href: '/admin/skill-test-queue', label: 'Skill Queue'   },
    { href: '/admin/company-queue',    label: 'Company Queue' },
  ],
}

export default function Navbar() {
  const router = useRouter()
  const [role, setRole]         = useState(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users_profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        setRole(profile?.role ?? null)
        setFullName(profile?.full_name ?? '')
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Don't render anything until we know the user's auth state
  // (prevents flash of wrong nav links)
  if (loading) return null

  const links = role ? (NAV_LINKS[role] ?? []) : []

  return (
    <nav className="glass border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="text-white font-bold text-lg">
          কাজের বাজার
        </Link>

        {/* Role-specific nav links */}
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth controls */}
        <div className="flex items-center gap-3">
          {role ? (
            <>
              <span className="text-slate-500 text-xs">
                {fullName} ({role})
              </span>
              <button
                id="navbar-logout"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                id="navbar-login"
                href="/login"
                className="text-slate-400 hover:text-white text-sm"
              >
                Login
              </Link>
              <Link
                id="navbar-register"
                href="/register"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
