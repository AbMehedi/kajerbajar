// src/app/company/dashboard/page.jsx
// Story 1.2: Company dashboard with trade license upload
// Uses .gradient-brand and .glass from globals.css

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TradeLicenseUpload from './TradeLicenseUpload'

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
    .select('legal_name, industry, verified, verification_status, verification_feedback, trade_license_url')
    .eq('id', user.id)
    .single()

  // Determine verification state for UI
  const verificationStatus = companyProfile?.verification_status || 'not_submitted'

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

        {/* ═══════════════════════════════════════════════════════════════════
            Verification Status Banners (Story 1.2)
        ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Not submitted: Show upload prompt */}
        {verificationStatus === 'not_submitted' && (
          <div className="bg-blue-500/10 border border-blue-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-blue-300 font-semibold mb-2">📄 Upload Trade License</h3>
            <p className="text-slate-400 text-sm mb-4">
              To post projects and hire students, please upload your trade license for verification.
            </p>
            <TradeLicenseUpload userId={user.id} />
          </div>
        )}

        {/* Pending: Waiting for admin review */}
        {verificationStatus === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-yellow-300 font-semibold mb-2">⏳ Verification Pending</h3>
            <p className="text-slate-400 text-sm">
              Your trade license is under review. You&apos;ll be able to post projects once approved.
              This usually takes 1-2 business days.
            </p>
          </div>
        )}

        {/* Rejected: Show feedback + re-upload option */}
        {verificationStatus === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-red-300 font-semibold mb-2">❌ Verification Rejected</h3>
            <p className="text-slate-400 text-sm mb-2">
              <strong>Reason:</strong> {companyProfile?.verification_feedback || 'No feedback provided.'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Please upload a corrected document to try again.
            </p>
            <TradeLicenseUpload userId={user.id} />
          </div>
        )}

        {/* Verified: Success banner */}
        {verificationStatus === 'verified' && (
          <div className="bg-green-500/10 border border-green-500/30 mb-6 p-4 rounded-lg">
            <h3 className="text-green-300 font-semibold mb-2">✅ Company Verified</h3>
            <p className="text-slate-400 text-sm">
              Your company is verified! You can now post projects and hire students.
            </p>
          </div>
        )}

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">📋 Your Projects</h3>
            <p className="text-slate-500 text-sm">
              {verificationStatus === 'verified' 
                ? 'Your posted projects will appear here after Phase 3.'
                : 'Complete verification to post projects.'}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">👥 Applicants</h3>
            <p className="text-slate-500 text-sm">
              Applicants for your projects will appear here after Phase 3.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
