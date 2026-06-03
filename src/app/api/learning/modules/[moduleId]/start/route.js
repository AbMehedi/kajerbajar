// src/app/api/learning/modules/[moduleId]/start/route.js
// POST /api/learning/modules/[moduleId]/start
//
// Starts a new learning module attempt for the authenticated student.
// - Validates no active pending submission exists
// - Calls generateLearningBrief() for a unique AI brief
// - Creates a module_submissions record
// - Returns the brief + deadline

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { generateLearningBrief } from '@/lib/ai'

export async function POST(request, { params }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await params

  // Fetch the module definition (renamed to moduleData to avoid ESLint no-assign-module-variable)
  const { data: moduleData, error: moduleError } = await supabase
    .from('learning_modules')
    .select('id, skill_category, skill_name, difficulty_level, deadline_hours, is_active')
    .eq('id', moduleId)
    .single()

  if (moduleError || !moduleData) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }
  if (!moduleData.is_active) {
    return NextResponse.json({ error: 'This module is not currently active' }, { status: 400 })
  }

  // Check: student must not have any active pending submission
  const { data: activePending } = await supabase
    .from('module_submissions')
    .select('id, module_id, deadline_at, learning_modules(skill_name, difficulty_level)')
    .eq('student_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (activePending) {
    return NextResponse.json({
      error: 'You already have an active module in progress. Complete or wait for it to be reviewed before starting a new one.',
      active_submission: activePending,
    }, { status: 409 })
  }

  // Check: student must not be in cooldown for this level
  const { data: recentFail } = await supabase
    .from('module_submissions')
    .select('id, cooldown_until, attempt_number')
    .eq('student_id', user.id)
    .eq('module_id', moduleId)
    .in('status', ['fail'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentFail?.cooldown_until && new Date(recentFail.cooldown_until) > new Date()) {
    return NextResponse.json({
      error: 'You are in cooldown for this module level.',
      cooldown_until: recentFail.cooldown_until,
    }, { status: 429 })
  }

  // Check: student must not have already passed this level
  const { data: existingPass } = await supabase
    .from('verified_skills')
    .select('id')
    .eq('student_id', user.id)
    .eq('skill_name', moduleData.skill_name)
    .eq('level', moduleData.difficulty_level)
    .maybeSingle()

  if (existingPass) {
    return NextResponse.json({
      error: `You have already passed ${moduleData.skill_name} — ${moduleData.difficulty_level}!`,
    }, { status: 400 })
  }

  // Generate unique AI brief
  let briefObj
  try {
    briefObj = await generateLearningBrief(
      moduleData.skill_name,
      moduleData.skill_category,
      moduleData.difficulty_level,
      moduleData.deadline_hours,
    )
  } catch (err) {
    console.error('[start module] AI brief generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate project brief. Please try again.' }, { status: 500 })
  }

  // Calculate deadline
  const deadlineAt = new Date(Date.now() + moduleData.deadline_hours * 60 * 60 * 1000).toISOString()

  // Determine attempt number (count previous fail submissions for this module)
  const { count: previousFails } = await supabase
    .from('module_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('module_id', moduleId)
    .eq('status', 'fail')

  const attemptNumber = (previousFails ?? 0) + 1

  // Use service role to insert (bypass RLS for the insert, student_id is explicitly set)
  const adminClient = createServiceRoleClient()
  const { data: submission, error: insertError } = await adminClient
    .from('module_submissions')
    .insert({
      student_id:     user.id,
      module_id:      moduleId,
      ai_brief:       JSON.stringify(briefObj),  // store as JSON string
      status:         'pending',
      attempt_number: attemptNumber,
      deadline_at:    deadlineAt,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[start module] DB insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create submission record.' }, { status: 500 })
  }

  return NextResponse.json({
    submission_id:  submission.id,
    brief:          briefObj,          // parsed object — frontend renders this
    deadline_at:    deadlineAt,
    moduleData:     moduleData,
    attempt_number: attemptNumber,
  })
}
