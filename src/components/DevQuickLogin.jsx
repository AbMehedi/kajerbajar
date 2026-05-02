// src/components/DevQuickLogin.jsx
// Dev-only component: Quick login button to switch between roles
// Only visible in development (NODE_ENV === 'development')

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TEST_USERS = [
  { email: 'student@test.com', password: 'Student123!', role: 'student' },
  { email: 'company@test.com', password: 'Company123!', role: 'company' },
  { email: 'admin@test.com', password: 'Admin123!', role: 'admin' },
]

export default function DevQuickLogin() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Only show in development - move this AFTER hooks to satisfy Rules of Hooks
  if (process.env.NODE_ENV !== 'development') return null

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const handleQuickLogin = async (email, password) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Redirect to appropriate dashboard and refresh to clear router cache
      const role = TEST_USERS.find((u) => u.email === email)?.role
      router.push(`/${role}/dashboard`)
      router.refresh()
      setIsOpen(false)
    } catch (err) {
      console.error('Quick login failed:', err)
      alert(`Failed to login: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
        title="Dev: Quick login as any role"
      >
        🔑 Dev Login
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 w-48">
          <p className="text-xs text-gray-600 px-2 py-1 font-semibold">Quick Login (Dev Only)</p>
          {TEST_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => handleQuickLogin(user.email, user.password)}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <span className="font-medium">{user.role}</span>
              <span className="text-xs text-gray-500 block">{user.email}</span>
            </button>
          ))}
          <div className="border-t mt-2 pt-2 px-2 text-xs text-gray-500">
            <p>💡 Click any role to login instantly</p>
          </div>
        </div>
      )}
    </div>
  )
}
