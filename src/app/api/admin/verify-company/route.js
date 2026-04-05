// src/app/api/admin/verify-company/route.js
// Story 1.2: Admin approves or rejects a company's trade license
//
// Actions:
//   - 'approve': Sets verified=true, verification_status='verified'
//   - 'reject':  Sets verification_status='rejected', requires feedback

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = await createServerSupabaseClient()
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 1: Verify user is authenticated
  // ═══════════════════════════════════════════════════════════════════
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be authenticated to verify companies' },
      { status: 401 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 2: Verify user is an admin
  // ═══════════════════════════════════════════════════════════════════
  const { data: profile, error: profileError } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can verify companies' },
      { status: 403 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 3: Validate request body
  // ═══════════════════════════════════════════════════════════════════
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    )
  }
  
  const { company_id, action, feedback } = body
  
  // Validate company_id
  if (!company_id || typeof company_id !== 'string') {
    return NextResponse.json(
      { error: 'company_id is required' },
      { status: 400 }
    )
  }
  
  // Validate action
  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'action must be either "approve" or "reject"' },
      { status: 400 }
    )
  }
  
  // Reject requires feedback
  if (action === 'reject' && (!feedback || feedback.trim().length < 10)) {
    return NextResponse.json(
      { error: 'Rejection requires feedback (at least 10 characters)' },
      { status: 400 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 4: Verify company exists and is pending
  // ═══════════════════════════════════════════════════════════════════
  const { data: company, error: companyError } = await supabase
    .from('company_profiles')
    .select('id, verification_status, legal_name')
    .eq('id', company_id)
    .single()
  
  if (companyError || !company) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 }
    )
  }
  
  if (company.verification_status !== 'pending') {
    return NextResponse.json(
      { error: `Company is already ${company.verification_status}. Cannot change status.` },
      { status: 400 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 5: Update company verification status
  // ═══════════════════════════════════════════════════════════════════
  const updateData = action === 'approve'
    ? {
        verified: true,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        verification_feedback: null,
      }
    : {
        verified: false,
        verification_status: 'rejected',
        verification_feedback: feedback.trim(),
        verified_at: null,
        verified_by: user.id,
      }
  
  const { error: updateError } = await supabase
    .from('company_profiles')
    .update(updateData)
    .eq('id', company_id)
  
  if (updateError) {
    console.error('Failed to update company status:', updateError)
    return NextResponse.json(
      { error: 'Failed to update company status. Please try again.' },
      { status: 500 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 6: Return success response
  // ═══════════════════════════════════════════════════════════════════
  const message = action === 'approve'
    ? `${company.legal_name} has been verified and can now post projects.`
    : `${company.legal_name} has been rejected. They will see your feedback.`
  
  return NextResponse.json({
    success: true,
    action,
    company_id,
    message,
  })
}
