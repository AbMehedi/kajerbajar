// src/app/api/projects/[id]/release/route.js
// POST /api/projects/[id]/release
//
// Called by a company to approve work and release escrow to the student's wallet.
// Transitions: project status → 'completed', escrow_status → 'released'
// Side-effect: calls increment_wallet RPC to credit the student

import { requireAuthAndRole } from '@/lib/api'
import { createAdminSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { recalculateKaajerScore } from '@/lib/kaajerscore'
import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/server-notifications'

// Platform commission rate (10%)
const COMMISSION_RATE = 0.10

export async function POST(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()
    const serviceClient = createServiceRoleClient()

    // 1. Fetch and validate the project
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id, company_id, title, budget_bdt, status, escrow_status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.company_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (project.status !== 'in_progress') {
      return NextResponse.json({
        error: `Cannot release payment — project status is '${project.status}'`
      }, { status: 409 })
    }

    if (project.escrow_status !== 'held') {
      return NextResponse.json({
        error: 'Escrow is not currently held for this project'
      }, { status: 409 })
    }

    // 2. Find the selected student
    const { data: selectedApp } = await adminClient
      .from('applications')
      .select('student_id')
      .eq('project_id', projectId)
      .eq('status', 'selected')
      .single()

    if (!selectedApp) {
      return NextResponse.json({ error: 'No selected student found for this project' }, { status: 400 })
    }

    const commission = Math.round(project.budget_bdt * COMMISSION_RATE * 100) / 100
    const studentPayout = Math.round((project.budget_bdt - commission) * 100) / 100

    // 3. Mark project as completed with escrow released
    const { error: updateError } = await adminClient
      .from('projects')
      .update({
        status: 'completed',
        escrow_status: 'released',
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('[projects/release POST] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to release payment' }, { status: 500 })
    }

    // 4. Credit student wallet (call the existing RPC)
    const { error: walletError } = await serviceClient
      .rpc('increment_wallet', {
        student_id: selectedApp.student_id,
        amount: studentPayout,
      })

    if (walletError) {
      console.error('[projects/release POST] Wallet RPC error:', walletError)
      // Revert the project status to prevent an inconsistent state where
      // the project is marked 'completed' but the student was never paid.
      await adminClient
        .from('projects')
        .update({ status: 'in_progress', escrow_status: 'held' })
        .eq('id', projectId)
      return NextResponse.json(
        { error: 'Payment to student wallet failed. The project status has been reverted. Please try again.' },
        { status: 500 }
      )
    }

    // 4b. Recalculate KaajerScore (affects Component 3: Completion Rate)
    // Non-fatal — score update should not block payment confirmation.
    await recalculateKaajerScore(selectedApp.student_id).catch((err) => {
      console.error('[projects/release POST] KaajerScore update error:', err)
    })

    // 5. Record escrow ledger entries
    await serviceClient.from('escrow_ledger').insert([
      {
        project_id: projectId,
        event_type: 'release',
        amount_bdt: studentPayout,
        from_party: 'escrow',
        to_party: 'student',
      },
      {
        project_id: projectId,
        event_type: 'commission',
        amount_bdt: commission,
        from_party: 'escrow',
        to_party: 'platform',
      },
    ])

    // 6. Generate Certificate Record
    const { error: certError } = await serviceClient.from('certificates').insert([
      {
        project_id: projectId,
        student_id: selectedApp.student_id,
        // pdf_url is left null since we generate on-the-fly
      }
    ])
    if (certError) {
      console.error('[projects/release POST] Failed to insert certificate:', certError)
      // Non-fatal, but logged
    }

    try {
      await createNotification({
        userId: selectedApp.student_id,
        type: 'payment',
        title: 'Payment Released!',
        body: `৳${studentPayout} has been released to your wallet for "${project.title}".`,
        data: { link: `/student/workspace/${projectId}` },
        sendEmail: true
      })
    } catch (notifErr) {
      console.error('[projects/release POST] Failed to send notification:', notifErr)
    }

    return NextResponse.json({
      success: true,
      message: `Payment released — ৳${studentPayout} sent to student (৳${commission} platform fee)`,
      student_payout: studentPayout,
      commission,
    })
  } catch (err) {
    console.error('[projects/release POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
