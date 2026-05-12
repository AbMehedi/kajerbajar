// src/app/api/skills/verify/submit/route.js
// POST /api/skills/verify/submit
// Student submits their completed work for a skill verification.
// Accepts optional file metadata (path saved after direct browser→Storage upload).

import { parseJsonBody, requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only students can submit skill verification work',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    // 2. Parse body — text is optional IF a file is attached
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse

    const {
      verificationId,
      submissionText,
      submissionFilePath,  // storage path e.g. "userId/verificationId/project.zip"
    } = parsed.body

    if (!verificationId) {
      return NextResponse.json({ error: 'verificationId is required' }, { status: 400 })
    }

    const hasText = submissionText?.trim().length >= 50
    const hasFile = Boolean(submissionFilePath)

    if (!hasText && !hasFile) {
      return NextResponse.json({
        error: 'Please provide a description (min 50 characters) or attach a file — ideally both.',
      }, { status: 400 })
    }

    // 3. Check the verification belongs to this student and is open
    const { data: verification, error: fetchError } = await supabase
      .from('skill_verifications')
      .select('id, status, student_id')
      .eq('id', verificationId)
      .eq('student_id', user.id)
      .single()

    if (fetchError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const allowedStatuses = ['pending', 'revision_requested']
    if (!allowedStatuses.includes(verification.status)) {
      return NextResponse.json({
        error: 'This verification has already been submitted or is not open for resubmission',
      }, { status: 409 })
    }

    // 4. Save submission — use 'pending' status (schema CHECK constraint does not include
    //    'submitted'; migration_003 adds it but may not have been applied yet).
    //    The submitted_at timestamp + submission_text/file presence marks it as submitted.
    const { data: updated, error: updateError } = await supabase
      .from('skill_verifications')
      .update({
        submission_text:     hasText ? submissionText.trim() : null,
        submission_file_url: submissionFilePath  || null,
        status:              'pending',
        submitted_at:        new Date().toISOString(),
      })
      .eq('id', verificationId)
      .select()
      .single()

    if (updateError) {
      console.error('[verify/submit] DB error:', updateError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({ verification: updated }, { status: 200 })
  } catch (err) {
    console.error('[verify/submit] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
