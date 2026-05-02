// src/app/api/admin/review-skill/route.js
// POST /api/admin/review-skill
// Admin approves, rejects, or requests revision on a skill verification

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_ACTIONS = ['approve', 'reject', 'revision']

export async function POST(request) {
  try {
    // 1. Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Role check — admin only
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 })
    }

    // 3. Validate body
    const { verificationId, action, feedback } = await request.json()

    if (!verificationId) {
      return NextResponse.json({ error: 'verificationId is required' }, { status: 400 })
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // 4. Fetch the verification
    const { data: verification, error: fetchError } = await supabase
      .from('skill_verifications')
      .select('id, student_id, skill_category, status')
      .eq('id', verificationId)
      .single()

    if (fetchError || !verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    // Use admin client for privileged operations
    const adminSupabase = await createAdminSupabaseClient()

    // 5. Execute the action
    if (action === 'approve') {
      // Update verification status
      const { error: updateError } = await adminSupabase
        .from('skill_verifications')
        .update({
          status: 'approved',
          admin_feedback: feedback || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verificationId)

      if (updateError) throw updateError

      // Grant badge (upsert so duplicate approvals don't cause errors)
      const { error: badgeError } = await adminSupabase
        .from('badges')
        .upsert({
          student_id: verification.student_id,
          skill_name: verification.skill_category,
          verification_id: verificationId,
          granted_by: user.id,
        }, { onConflict: 'student_id,skill_name' })

      if (badgeError) throw badgeError
    }

    if (action === 'reject' || action === 'revision') {
      const newStatus = action === 'reject' ? 'rejected' : 'revision_requested'
      const { error: updateError } = await adminSupabase
        .from('skill_verifications')
        .update({
          status: newStatus,
          admin_feedback: feedback || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verificationId)

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true, action }, { status: 200 })
  } catch (err) {
    console.error('[admin/review-skill]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
