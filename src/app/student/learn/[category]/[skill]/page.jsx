// src/app/student/learn/[category]/[skill]/page.jsx
// Module Page (server shell) — /student/learn/[category]/[skill]
// Fetches server data, passes to ModuleClient for interactivity.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import ModuleClient from './ModuleClient'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORY_LABELS = {
  tech:      'Tech & Development',
  design:    'Design & Creative',
  content:   'Content & Writing',
  marketing: 'Digital Marketing',
  data:      'Data & Research',
}

export async function generateMetadata({ params }) {
  const { skill, category } = await params
  return {
    title: `${decodeURIComponent(skill)} — Learn | KaajerBazar`,
    description: `Verify your ${decodeURIComponent(skill)} skills in the ${CATEGORY_LABELS[category] ?? category} category.`,
  }
}

export default async function ModulePage({ params }) {
  const { category, skill: skillEncoded } = await params
  const skillName = decodeURIComponent(skillEncoded)

  const catLabel = CATEGORY_LABELS[category]
  if (!catLabel) notFound()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles').select("full_name, role, avatar_url").eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch the learning_modules rows for this skill + category
  const { data: modules } = await supabase
    .from('learning_modules')
    .select('id, skill_category, skill_name, difficulty_level, deadline_hours, is_active')
    .eq('skill_category', category)
    .eq('skill_name', skillName)
    .eq('is_active', true)
    .order('deadline_hours', { ascending: true })

  // Fetch active pending submission (if any)
  const { data: activeSubmission } = await supabase
    .from('module_submissions')
    .select('id, status, deadline_at, submitted_at, ai_brief, attempt_number, module_id, learning_modules(skill_name, difficulty_level, skill_category, deadline_hours)')
    .eq('student_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  // Fetch verified skills for this skill
  const { data: verifiedSkills } = await supabase
    .from('verified_skills')
    .select('id, skill_name, level, earned_at')
    .eq('student_id', user.id)
    .eq('skill_name', skillName)

  // Fetch cooldown map for this student on this skill's modules
  const moduleIds = (modules ?? []).map((m) => m.id)
  let cooldownMap = {}
  if (moduleIds.length > 0) {
    const { data: recentFails } = await supabase
      .from('module_submissions')
      .select('module_id, cooldown_until, learning_modules(difficulty_level)')
      .eq('student_id', user.id)
      .in('module_id', moduleIds)
      .eq('status', 'fail')
      .not('cooldown_until', 'is', null)
      .order('created_at', { ascending: false })

    for (const fail of (recentFails ?? [])) {
      const level = fail.learning_modules?.difficulty_level
      if (level && fail.cooldown_until) {
        if (!cooldownMap[level] || new Date(fail.cooldown_until) > new Date(cooldownMap[level])) {
          cooldownMap[level] = fail.cooldown_until
        }
      }
    }
  }

  // Handle revision submissions — allow resubmission
  const { data: revisionSubmission } = await supabase
    .from('module_submissions')
    .select('id, status, deadline_at, submitted_at, ai_brief, attempt_number, module_id, learning_modules(skill_name, difficulty_level, skill_category, deadline_hours)')
    .eq('student_id', user.id)
    .eq('status', 'revision')
    .maybeSingle()

  // Use revision as active if no regular pending
  const resolvedActive = activeSubmission ?? revisionSubmission

  return (
    <DashboardShell avatarUrl={profile?.avatar_url} role="student" fullName={profile?.full_name ?? ''}
      activePath="/student/learn">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <Link href="/student/learn" className="hover:text-white transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Learn
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/student/learn/${category}`} className="hover:text-white transition-colors">
            {catLabel}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{skillName}</span>
        </div>

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{skillName}</h1>
          <p className="text-slate-400 text-sm">{catLabel} · Pick a difficulty level to start your module</p>
        </div>

        {/* ── Module Client ── */}
        <ModuleClient
          skillName={skillName}
          category={category}
          modules={modules ?? []}
          initialData={{
            active_submission: resolvedActive ?? null,
            verified_skills:   verifiedSkills ?? [],
            cooldown_map:      cooldownMap,
          }}
        />

      </div>
    </DashboardShell>
  )
}
