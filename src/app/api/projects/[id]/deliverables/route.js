// src/app/api/projects/[id]/deliverables/route.js
// GET  /api/projects/[id]/deliverables  — list deliverables (student or company)
// POST /api/projects/[id]/deliverables  — student submits a deliverable

import { requireAuthAndRole, parseJsonBody } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company'],
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user, role } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // Validate access to this project
    if (role === 'company') {
      const { data: project } = await adminClient
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

      if (!project || project.company_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (role === 'student') {
      // Student must be the selected applicant
      const { data: app } = await adminClient
        .from('applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('student_id', user.id)
        .eq('status', 'selected')
        .single()

      if (!app) {
        return NextResponse.json({ error: 'Access denied — you are not the assigned student' }, { status: 403 })
      }
    }

    const { data: deliverables, error } = await adminClient
      .from('project_deliverables')
      .select('id, submission_text, submission_file_url, status, company_feedback, created_at, reviewed_at, student_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[deliverables GET] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 })
    }

    return NextResponse.json({ deliverables: deliverables ?? [] })
  } catch (err) {
    console.error('[deliverables GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Body: {
//   submission_text?:     string
//   submission_file_url?: string  — Supabase Storage path (from upload-url endpoint)
//   file_name?:           string  — original filename for display
//   file_size_bytes?:     number
//   file_mime_type?:      string
// }
export async function POST(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Students only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // 1. Verify the student is the selected applicant on this in_progress project
    const { data: project } = await adminClient
      .from('projects')
      .select('id, status, title')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'in_progress') {
      return NextResponse.json({
        error: 'Deliverables can only be submitted for in-progress projects'
      }, { status: 409 })
    }

    const { data: app } = await adminClient
      .from('applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('student_id', user.id)
      .eq('status', 'selected')
      .single()

    if (!app) {
      return NextResponse.json({
        error: 'You are not the assigned student for this project'
      }, { status: 403 })
    }

    // 2. Parse body
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const {
      submission_text,
      submission_file_url,
      file_name,
      file_size_bytes,
      file_mime_type,
    } = parsed.body

    if (!submission_text?.trim() && !submission_file_url) {
      return NextResponse.json({
        error: 'Please provide a description or attach a file for the deliverable'
      }, { status: 400 })
    }

    // 3. Insert deliverable
    const { data: deliverable, error: insertError } = await adminClient
      .from('project_deliverables')
      .insert({
        project_id:          projectId,
        student_id:          user.id,
        submission_text:     submission_text?.trim() ?? null,
        submission_file_url: submission_file_url ?? null,
        file_name:           file_name           ?? null,
        file_size_bytes:     file_size_bytes      ?? null,
        file_mime_type:      file_mime_type       ?? null,
        status:              'pending',
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('[deliverables POST] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit deliverable' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deliverable }, { status: 201 })
  } catch (err) {
    console.error('[deliverables POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
