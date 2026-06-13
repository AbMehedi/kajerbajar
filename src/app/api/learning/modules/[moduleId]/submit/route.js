// src/app/api/learning/modules/[moduleId]/submit/route.js
// POST /api/learning/modules/[moduleId]/submit
//
// Submits work for an active learning module.
// Accepts: submission_description (text) + optional file upload
// - Auto-fails if deadline has passed
// - Uploads file to module-submissions Supabase bucket
// - Updates module_submissions record (submitted_at, file_url, description)
// - Status stays "pending" — awaiting admin review

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { notifyAllAdmins } from '@/lib/server-notifications'

export async function POST(request, { params }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await params

  // Parse multipart form data
  const formData = await request.formData()
  const submissionDescription = formData.get('submission_description')?.toString()?.trim() || null
  const submissionId = formData.get('submission_id')?.toString()
  const file = formData.get('file') // may be null if text-only submission

  if (!submissionId) {
    return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
  }

  // Fetch the submission
  const { data: submission, error: fetchError } = await supabase
    .from('module_submissions')
    .select('id, student_id, module_id, status, deadline_at, attempt_number')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .eq('module_id', moduleId)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found or access denied' }, { status: 404 })
  }

  if (submission.status !== 'pending') {
    return NextResponse.json({
      error: `Cannot submit — current status is "${submission.status}". Only pending submissions can be submitted.`
    }, { status: 400 })
  }

  // Validate deadline — auto-fail if past deadline
  const now = new Date()
  const deadlineAt = new Date(submission.deadline_at)
  const isLate = now > deadlineAt

  const adminClient = createServiceRoleClient()

  if (isLate) {
    // Auto-fail due to missed deadline
    const { count: previousFails } = await adminClient
      .from('module_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('module_id', moduleId)
      .eq('status', 'fail')

    const totalFails = (previousFails ?? 0) + 1
    const cooldownMs = totalFails >= 3 ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString()

    await adminClient
      .from('module_submissions')
      .update({
        status:         'fail',
        admin_feedback: 'Automatically failed — submission deadline was missed.',
        reviewed_at:    new Date().toISOString(),
        attempt_number: totalFails,   // keep attempt_number consistent with manual fail
        cooldown_until: cooldownUntil,
      })
      .eq('id', submissionId)

    return NextResponse.json({
      error: 'Submission deadline has passed. This attempt has been automatically failed.',
      auto_failed: true,
    }, { status: 400 })
  }

  // Require at least a description or a file
  if (!submissionDescription && !file) {
    return NextResponse.json({ error: 'Please provide a description or attach a file.' }, { status: 400 })
  }

  // Upload file to module-submissions bucket if provided
  let fileUrl = null
  if (file && file.size > 0) {
    const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50 MB.' }, { status: 400 })
    }

    const fileExt    = file.name.split('.').pop()
    const filePath   = `${user.id}/${submissionId}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await adminClient.storage
      .from('module-submissions')
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert:      true,
      })

    if (uploadError) {
      console.error('[submit module] Storage upload error:', uploadError)
      return NextResponse.json({ error: 'File upload failed. Please try again.' }, { status: 500 })
    }

    fileUrl = filePath
  }

  // Update submission record
  const { error: updateError } = await adminClient
    .from('module_submissions')
    .update({
      submission_description: submissionDescription,
      submission_file_url:    fileUrl,
      submitted_at:           new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (updateError) {
    console.error('[submit module] DB update error:', updateError)
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  // ── Notify all admins about the new submission ──
  const { data: studentProfile } = await adminClient
    .from('users_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: moduleInfo } = await adminClient
    .from('learning_modules')
    .select('skill_name, difficulty_level')
    .eq('id', moduleId)
    .single()

  const studentName = studentProfile?.full_name || 'A student'
  const skillLabel = moduleInfo
    ? `${moduleInfo.skill_name} (${moduleInfo.difficulty_level})`
    : 'a skill module'

  notifyAllAdmins({
    type:     'admin_skill_submission',
    title:    `📝 New Skill Submission: ${skillLabel}`,
    body:     `${studentName} submitted work for ${skillLabel}. Review it in the Skill Test Queue.`,
    data:     { link: '/admin/learning/queue' },
    priority: 'important',
  })

  return NextResponse.json({
    message:    'Submission received! Awaiting admin review.',
    submission_id: submissionId,
    submitted_at:  new Date().toISOString(),
  })
}
