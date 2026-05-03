// src/app/api/company/applications/route.js
// GET  /api/company/applications?projectId=<uuid>  — list applicants for a project
// PATCH /api/company/applications                   — update a single application status
//
// Only the company that owns the project may call these endpoints.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Companies only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })
    }

    // Verify the project belongs to this company
    const { data: project } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .single()

    if (!project || project.company_id !== user.id) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
    }

    // Fetch applications with student info and their approved skill badges
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        cover_note,
        portfolio_item_url,
        created_at,
        student_id,
        student_profiles (
          username,
          university,
          kaajerscore,
          users_profiles ( full_name, email )
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[company/applications GET] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
    }

    // For each applicant, fetch their approved skill badge count separately
    const applicantIds = (applications ?? []).map((a) => a.student_id)
    let badgeMap = {}
    if (applicantIds.length > 0) {
      const { data: badges } = await supabase
        .from('skill_verifications')
        .select('student_id, skill_category')
        .in('student_id', applicantIds)
        .eq('status', 'approved')

      for (const badge of badges ?? []) {
        if (!badgeMap[badge.student_id]) badgeMap[badge.student_id] = []
        badgeMap[badge.student_id].push(badge.skill_category)
      }
    }

    const enriched = (applications ?? []).map((app) => ({
      ...app,
      verified_skills: badgeMap[app.student_id] ?? [],
    }))

    return NextResponse.json({ applications: enriched })
  } catch (err) {
    console.error('[company/applications GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Body: { applicationId: string, action: 'select' | 'reject' }
export async function PATCH(request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Companies only' }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, action } = body

    if (!applicationId || !['select', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'applicationId and valid action (select|reject) are required' }, { status: 400 })
    }

    // Verify the application belongs to one of this company's projects
    const { data: application } = await supabase
      .from('applications')
      .select('id, project_id, projects ( company_id )')
      .eq('id', applicationId)
      .single()

    if (!application || application.projects?.company_id !== user.id) {
      return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 })
    }

    const newStatus = action === 'select' ? 'selected' : 'rejected'

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    if (error) {
      console.error('[company/applications PATCH] DB error:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[company/applications PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
