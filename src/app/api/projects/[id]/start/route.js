// src/app/api/projects/[id]/start/route.js
// POST /api/projects/[id]/start
//
// Called by a company to officially start a project after selecting a student.
// This locks the budget in the escrow_ledger and transitions the project
// from 'open' → 'in_progress' with escrow_status 'held'.
//
// Guards:
//   - Must be authenticated as 'company'
//   - Must own the project
//   - Project must be 'open' with at least one 'selected' applicant
//   - Escrow must not already be held

import { requireAuthAndRole } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const { id: projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS for the atomic operation
    const adminClient = await createAdminSupabaseClient()

    // 1. Fetch the project with company ownership check
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id, company_id, title, budget_bdt, status, escrow_status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.company_id !== user.id) {
      return NextResponse.json({ error: 'Access denied — you do not own this project' }, { status: 403 })
    }

    if (project.status !== 'open') {
      return NextResponse.json({
        error: `Project cannot be started — current status is '${project.status}'`
      }, { status: 409 })
    }

    if (project.escrow_status === 'held') {
      return NextResponse.json({ error: 'Escrow is already held for this project' }, { status: 409 })
    }

    // 2. Verify at least one 'selected' applicant exists
    const { data: selectedApp, error: appError } = await adminClient
      .from('applications')
      .select('id, student_id')
      .eq('project_id', projectId)
      .eq('status', 'selected')
      .limit(1)
      .single()

    if (appError || !selectedApp) {
      return NextResponse.json({
        error: 'You must select an applicant before starting the project'
      }, { status: 400 })
    }

    // 3. Atomic update: transition project status and escrow
    const { error: updateError } = await adminClient
      .from('projects')
      .update({
        status: 'in_progress',
        escrow_status: 'held',
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('[projects/start POST] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to start project' }, { status: 500 })
    }

    // 4. Record the escrow deposit in the ledger
    const { error: ledgerError } = await adminClient
      .from('escrow_ledger')
      .insert({
        project_id: projectId,
        event_type: 'deposit',
        amount_bdt: project.budget_bdt,
        from_party: 'company',
        to_party: 'escrow',
      })

    if (ledgerError) {
      console.error('[projects/start POST] Ledger error:', ledgerError)
      // Non-fatal: project is started, just log the ledger failure
    }

    return NextResponse.json({
      success: true,
      message: `Project "${project.title}" started — ৳${project.budget_bdt} held in escrow`,
      project_id: projectId,
      student_id: selectedApp.student_id,
    })
  } catch (err) {
    console.error('[projects/start POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
