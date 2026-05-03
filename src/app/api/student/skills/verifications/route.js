// src/app/api/student/skills/verifications/route.js
// GET /api/student/skills/verifications
// Returns all skill verifications for the logged-in student

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

    if (profile?.role !== 'student') {
      return NextResponse.json({ error: 'Students only' }, { status: 403 })
    }

    const { data: verifications, error } = await supabase
      .from('skill_verifications')
      .select('id, skill_category, status, ai_brief, submission_text, submission_file_url, submitted_at, admin_feedback, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ verifications }, { status: 200 })
  } catch (err) {
    console.error('[student/skills/verifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
