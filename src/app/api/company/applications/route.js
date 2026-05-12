// src/app/api/company/applications/route.js
// GET  /api/company/applications?projectId=<uuid>  — list applicants for a project
// PATCH /api/company/applications                   — update a single application status
//
// Only the company that owns the project may call these endpoints.

import { parseJsonBody, requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

// ── GET ───────────────────────────────────────────────────────────────────────
// NOTE: In Next.js dev mode with React Strict Mode, useEffect fires twice —
// this causes doubled requests in the terminal log. This is dev-only behaviour
// and does NOT happen in production builds.
export async function GET(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })
    }

    const { supabase, user } = auth
    const { data: project } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .single()

    if (!project || project.company_id !== user.id) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
    }

    // Parse pagination params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 per page
    const offset = (validPage - 1) * validLimit

    // ⚡ Step 1: Fetch applications for this project
    const { data: applications, error, count } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        cover_note,
        portfolio_item_url,
        ai_match_score,
        ai_match_reason,
        created_at,
        student_id,
        student_profiles (
          username,
          university,
          kaajerscore,
          users_profiles ( full_name, email )
        )
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .range(offset, offset + validLimit - 1)

    if (error) {
      console.error('[company/applications GET] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
    }

    // Build applicant ID list for targeted badge query
    const applicantIds = ((applications ?? []).map((a) => a.student_id))
    
    // ⚡ Step 2: Fetch approved badges ONLY for these applicants (not all in DB)
    let allBadges = []
    if (applicantIds.length > 0) {
      const { data: badges, error: badgeError } = await supabase
        .from('skill_verifications')
        .select('student_id, skill_category')
        .eq('status', 'approved')
        .in('student_id', applicantIds)
      
      if (badgeError) {
        console.error('[company/applications GET] Badge fetch error:', badgeError)
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
      }
      allBadges = badges ?? []
    }

    // Build badge map from filtered results
    const applicantIdSet = new Set(applicantIds)
    const badgeMap = {}
    for (const badge of allBadges) {
      if (!applicantIdSet.has(badge.student_id)) continue
      if (!badgeMap[badge.student_id]) badgeMap[badge.student_id] = []
      badgeMap[badge.student_id].push(badge.skill_category)
    }

    const enriched = (applications ?? []).map((app) => ({
      ...app,
      verified_skills: badgeMap[app.student_id] ?? [],
    }))

    return NextResponse.json({
      applications: enriched,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: count,
        pages: Math.ceil((count || 0) / validLimit),
      },
    })
  } catch (err) {
    console.error('[company/applications GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Body: { applicationId: string, action: 'select' | 'reject' }
export async function PATCH(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const { applicationId, action } = parsed.body

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
