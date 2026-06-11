// src/app/api/learning/modules/[moduleId]/route.js
// GET /api/learning/modules/[moduleId]
//
// Handles two use cases:
//   1. moduleId = "categoryId__skillName" (double-underscore) → skill info lookup
//      Returns: modules for this skill, student's active submission, verified skills, cooldowns
//
//   2. moduleId = UUID → direct module lookup (returns single module row)
//
// The frontend uses format 1 to build the module selection page.

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await params
  const decoded = decodeURIComponent(moduleId)

  // ── Use case 1: skill info lookup (categoryId__skillName) ─────────────────
  if (decoded.includes('__')) {
    const separatorIndex = decoded.indexOf('__')
    const categoryId = decoded.slice(0, separatorIndex)
    const skillName  = decoded.slice(separatorIndex + 2)

    // Fetch the module rows for this skill
    const { data: modules, error: modulesError } = await supabase
      .from('learning_modules')
      .select('id, skill_category, skill_name, difficulty_level, deadline_hours, is_active')
      .eq('skill_category', categoryId)
      .eq('skill_name', skillName)
      .eq('is_active', true)
      .order('deadline_hours', { ascending: true })

    if (modulesError) {
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
    }

    // Check for active pending submission
    const { data: activeSubmission } = await supabase
      .from('module_submissions')
      .select('id, module_id, status, deadline_at, ai_brief, created_at, learning_modules(skill_name, difficulty_level, skill_category)')
      .eq('student_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    // Verified skills for this skill
    const { data: verifiedSkills } = await supabase
      .from('verified_skills')
      .select('id, skill_name, level, earned_at')
      .eq('student_id', user.id)
      .eq('skill_name', skillName)

    // Cooldowns for this skill's modules
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

    return NextResponse.json({
      skill_name:        skillName,
      skill_category:    categoryId,
      modules:           modules ?? [],
      active_submission: activeSubmission ?? null,
      verified_skills:   verifiedSkills ?? [],
      cooldown_map:      cooldownMap,
    })
  }

  // ── Use case 2: direct UUID module lookup ─────────────────────────────────
  const { data: module, error } = await supabase
    .from('learning_modules')
    .select('id, skill_category, skill_name, difficulty_level, deadline_hours, is_active')
    .eq('id', decoded)
    .single()

  if (error || !module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json({ module })
}
