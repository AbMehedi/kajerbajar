// src/app/company/dashboard/page.jsx
// Member B owns this file.
// Uses .gradient-brand and .glass from globals.css — change colours there, not here.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Company Dashboard — KaajerBazar',
  description: 'Your KaajerBazar company workspace',
}

export default async function CompanyDashboard() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/unauthorized')

  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('legal_name, industry, verified')
    .eq('id', user.id)
    .single()

  return (
    <div className="gradient-brand min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">কাজের বাজার</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{companyProfile?.legal_name}</span>
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
        <h1 className="text-2xl font-bold text-white mb-1">
          {companyProfile?.legal_name}
        </h1>
        <p className="text-slate-400 text-sm mb-2">{companyProfile?.industry ?? 'Industry not set'}</p>

        {/* Verification banner */}
        {!companyProfile?.verified && (
          <div className="badge-warning mb-6 block p-3 rounded-lg text-sm !rounded-lg">
            ⏳ Your company is <strong>pending verification</strong> by an admin. You&apos;ll be able to post projects once approved.
          </div>
        )}
        {companyProfile?.verified && (
          <div className="badge-success mb-6 block p-3 rounded-lg text-sm !rounded-lg">
            ✅ Your company is <strong>verified</strong>. You can post projects.
          </div>
        )}

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">📋 Your Projects</h3>
            <p className="text-slate-500 text-sm">Your posted projects will appear here after Phase 3.</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">👥 Applicants</h3>
            <p className="text-slate-500 text-sm">Applicants for your projects will appear here after Phase 3.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
