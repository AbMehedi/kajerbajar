// src/app/api/admin/skills/pending/route.js
// GET /api/admin/skills/pending
// Returns all submitted skill verifications awaiting admin review

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['admin'],
      forbiddenMessage: 'Admins only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase } = auth

    const { data: submissions, error } = await supabase
      .from('skill_verifications')
      .select(`
        id,
        skill_category,
        status,
        ai_brief,
        submission_text,
        submitted_at,
        created_at,
        student_id,
        users_profiles!skill_verifications_student_id_fkey (full_name, email),
        student_profiles!skill_verifications_student_id_fkey (username, university)
      `)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ submissions }, { status: 200 })
  } catch (err) {
    console.error('[admin/skills/pending]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
