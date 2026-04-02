// src/app/admin/dashboard/page.jsx
// Member C owns this file.
// Uses .gradient-brand and .glass from globals.css

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin Dashboard',   // layout.js template adds "| KaajerBazar"
}

// Colour classes for stat cards — keyed by intent, not by raw colour name.
// To change "students = purple" → change the value here, nowhere else.
const STAT_COLORS = {
  students:     'border-purple-500/30 text-purple-300',
  companies:    'border-blue-500/30   text-blue-300',
  pending:      'border-yellow-500/30 text-yellow-300',
}

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/unauthorized')

  // Fetch all stats in parallel — one round-trip to the DB
  const [
    { count: studentCount },
    { count: companyCount },
    { count: pendingVerifCount },
  ] = await Promise.all([
    supabase.from('student_profiles')   .select('*', { count: 'exact', head: true }),
    supabase.from('company_profiles')   .select('*', { count: 'exact', head: true }),
    supabase.from('skill_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div className="gradient-brand min-h-screen">

      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">KaajerBazar Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{profile?.full_name}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Live stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Students"        value={studentCount     ?? 0} colorKey="students"  />
          <StatCard label="Total Companies"       value={companyCount     ?? 0} colorKey="companies" />
          <StatCard label="Pending Verifications" value={pendingVerifCount ?? 0} colorKey="pending"   />
        </div>

        {/* Placeholder queue sections — filled in Phase 2 & 3 */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlaceholderCard title="🔍 Skill Test Queue"         note="Available in Phase 2" />
          <PlaceholderCard title="🏢 Company Verification Queue" note="Available in Phase 3" />
        </div>
      </main>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, colorKey }) {
  return (
    <div className={`glass rounded-xl p-5 border ${STAT_COLORS[colorKey]}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  )
}

function PlaceholderCard({ title, note }) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{note}</p>
    </div>
  )
}
