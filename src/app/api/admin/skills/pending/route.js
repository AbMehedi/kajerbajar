// src/app/api/admin/skills/pending/route.js
// GET /api/admin/skills/pending
// Returns all submitted skill verifications awaiting admin review

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 })
    }

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
