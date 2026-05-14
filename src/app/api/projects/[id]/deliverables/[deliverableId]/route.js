// src/app/api/projects/[id]/deliverables/[deliverableId]/route.js
// PATCH /api/projects/[id]/deliverables/[deliverableId]
//
// Company reviews a deliverable — approve or reject with feedback.
// Body: { action: 'approve' | 'reject', feedback?: string }

import { requireAuthAndRole, parseJsonBody } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const { id: projectId, deliverableId } = await params
    const adminClient = await createAdminSupabaseClient()

    // Validate company owns this project
    const { data: project } = await adminClient
      .from('projects')
      .select('company_id, status')
      .eq('id', projectId)
      .single()

    if (!project || project.company_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (project.status !== 'in_progress') {
      return NextResponse.json({ error: 'Project is not in progress' }, { status: 409 })
    }

    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const { action, feedback } = parsed.body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { error: updateError } = await adminClient
      .from('project_deliverables')
      .update({
        status: newStatus,
        company_feedback: feedback?.trim() ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', deliverableId)
      .eq('project_id', projectId)

    if (updateError) {
      console.error('[deliverables PATCH] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[deliverables PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
