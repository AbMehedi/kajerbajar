// src/app/company/projects/new/page.jsx
// Story 3.1: Server Component — Post a new micro-project
//
// Guards:
//   1. User must be authenticated → redirect /login
//   2. User must have role 'company' → redirect /unauthorized
//   3. Company must be 'verified' → show locked state (not a redirect)

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostProjectForm from '@/components/PostProjectForm'
import DashboardShell from '@/components/layout/DashboardShell'

export const metadata = {
  title: 'Post a Project — KaajerBazar',
  description: 'Post a micro-project for students to discover and apply to.',
}

export default async function PostProjectPage() {
  const supabase = await createServerSupabaseClient()

  // ─── Guard 1: Auth ─────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ─── Guard 2: Role ─────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'company') redirect('/unauthorized')

  // ─── Guard 3: Verification (soft — show locked UI) ─────────
  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('legal_name, verification_status')
    .eq('id', user.id)
    .single()

  const isVerified = companyProfile?.verification_status === 'verified'

  return (
    <DashboardShell avatarUrl={profile?.avatar_url}
      role="company"
      fullName={companyProfile?.legal_name ?? profile?.full_name ?? ""}
      activePath="/company/projects/new"
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* ── Page Title ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Post a Micro-Project</h1>
          <p className="text-slate-400 text-sm">
            Describe your project and connect with skilled students.
          </p>
        </div>

        {/* ── Locked state for unverified companies ── */}
        {!isVerified ? (
          <div className="glass rounded-2xl p-10 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-3xl mx-auto">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Verification Required
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                Your company must be{' '}
                <span className="text-yellow-300 font-medium">verified</span> before
                you can post projects. Upload your trade license and wait for admin
                approval — it usually takes 1–2 business days.
              </p>
            </div>

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              {companyProfile?.verification_status === 'pending'
                ? 'Verification pending — under review'
                : companyProfile?.verification_status === 'rejected'
                  ? 'Verification rejected — resubmit your license'
                  : 'No license submitted yet'}
            </div>

            <Link
              href="/company/dashboard"
              className="inline-block mt-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          /* ── The actual form ── */
          <div className="glass rounded-xl p-6">
            <PostProjectForm />
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
