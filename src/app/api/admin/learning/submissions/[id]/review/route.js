// src/app/api/admin/learning/submissions/[id]/review/route.js
// POST /api/admin/learning/submissions/[id]/review
// Admin only — review a module submission.
//
// Body: { decision: "pass" | "fail" | "revision", feedback?: string }
//
// PASS:     update status → pass, insert verified_skills, send pass notification
// FAIL:     update status → fail, increment attempt_number check:
//             attempt < 3  → cooldown_until = NOW() + 24 hours
//             attempt >= 3 → cooldown_until = NOW() + 7 days, send lockout notification
// REVISION: update status → revision, do NOT increment attempt_number, no cooldown

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { createNotification } from '@/lib/server-notifications'

export async function POST(request, { params }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: submissionId } = await params
  const body = await request.json()
  const { decision, feedback } = body

  if (!['pass', 'fail', 'revision'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision. Must be "pass", "fail", or "revision".' }, { status: 400 })
  }

  const adminClient = createServiceRoleClient()

  // Fetch submission with module info
  const { data: submission, error: fetchError } = await adminClient
    .from('module_submissions')
    .select(`
      id,
      student_id,
      module_id,
      status,
      attempt_number,
      learning_modules (
        skill_name,
        skill_category,
        difficulty_level
      )
    `)
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (submission.status !== 'pending') {
    return NextResponse.json({
      error: `Submission has already been reviewed (status: ${submission.status})`
    }, { status: 400 })
  }

  const skillName  = submission.learning_modules?.skill_name
  const skillCat   = submission.learning_modules?.skill_category
  const level      = submission.learning_modules?.difficulty_level
  const studentId  = submission.student_id
  const now        = new Date().toISOString()

  // ── PASS ──────────────────────────────────────────────────────────────────
  if (decision === 'pass') {
    await adminClient
      .from('module_submissions')
      .update({
        status:        'pass',
        admin_feedback: feedback || null,
        reviewed_at:   now,
        reviewed_by:   user.id,
      })
      .eq('id', submissionId)

    // Insert into verified_skills (upsert — idempotent)
    await adminClient
      .from('verified_skills')
      .upsert({
        student_id:           studentId,
        skill_name:           skillName,
        skill_category:       skillCat,
        level:                level,
        earned_at:            now,
        module_submission_id: submissionId,
      }, {
        onConflict: 'student_id,skill_name,level',
        ignoreDuplicates: false,
      })

    // Notify student
    await createNotification({
      userId:    studentId,
      type:      'skill_pass',
      title:     `🎉 Skill Verified: ${skillName} — ${capitalize(level)}!`,
      body:      `Congratulations! You passed the ${skillName} (${capitalize(level)}) module. Your verified skill has been added to your profile.`,
      data:      { link: '/student/learn/submissions' },
      sendEmail: true,
    })

    return NextResponse.json({ message: 'Submission passed. Skill added to verified_skills.' })
  }

  // ── FAIL ──────────────────────────────────────────────────────────────────
  if (decision === 'fail') {
    const newAttemptNumber = (submission.attempt_number ?? 1) + 1
    const isLockout = newAttemptNumber >= 3

    const cooldownMs    = isLockout ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString()

    await adminClient
      .from('module_submissions')
      .update({
        status:         'fail',
        admin_feedback: feedback || null,
        reviewed_at:    now,
        reviewed_by:    user.id,
        attempt_number: newAttemptNumber,
        cooldown_until: cooldownUntil,
      })
      .eq('id', submissionId)

    if (isLockout) {
      // 7-day lockout notification
      await createNotification({
        userId:    studentId,
        type:      'skill_locked',
        title:     `🔒 ${skillName} — ${capitalize(level)} Locked for 7 Days`,
        body:      `You have made ${newAttemptNumber} failed attempts at ${skillName} — ${capitalize(level)}. This module is now locked for 7 days. Keep practicing and come back stronger!`,
        data:      { link: '/student/learn' },
        sendEmail: true,
      })
    } else {
      // Standard fail notification (retry in 24h)
      await createNotification({
        userId:    studentId,
        type:      'skill_fail',
        title:     `📝 ${skillName} Submission Needs Work`,
        body:      `Your ${skillName} — ${capitalize(level)} submission was not approved. ${feedback ? `Feedback: ${feedback}` : 'Review the brief and try again.'} You can retry after 24 hours.`,
        data:      { link: '/student/learn/submissions' },
        sendEmail: false,
      })
    }

    return NextResponse.json({
      message:        `Submission failed. Cooldown set until ${cooldownUntil}`,
      cooldown_until: cooldownUntil,
      is_lockout:     isLockout,
    })
  }

  // ── REVISION ──────────────────────────────────────────────────────────────
  if (decision === 'revision') {
    // No attempt_number increment, no cooldown
    await adminClient
      .from('module_submissions')
      .update({
        status:         'revision',
        admin_feedback: feedback || null,
        reviewed_at:    now,
        reviewed_by:    user.id,
        // Reset submitted_at so student can resubmit
        submitted_at:   null,
        submission_description: null,
        submission_file_url:    null,
      })
      .eq('id', submissionId)

    await createNotification({
      userId:    studentId,
      type:      'skill_revision',
      title:     `🔄 Revision Requested: ${skillName} — ${capitalize(level)}`,
      body:      `Your ${skillName} — ${capitalize(level)} submission needs revision. ${feedback ? `Admin feedback: ${feedback}` : 'Please review and resubmit.'} Your deadline has been extended — resubmit when ready.`,
      data:      { link: '/student/learn/submissions' },
      sendEmail: false,
    })

    return NextResponse.json({ message: 'Revision requested. Student notified.' })
  }
}

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
