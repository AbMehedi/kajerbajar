// src/app/api/company/upload-license/route.js
// Story 1.2: Company uploads trade license for verification
// 
// Flow:
//   1. Company uploads PDF to Supabase Storage (client-side)
//   2. This endpoint saves the file URL to company_profiles
//   3. Sets verification_status = 'pending'
//   4. Admin sees it in their queue

import { parseJsonBody, requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'
import { notifyAllAdmins } from '@/lib/server-notifications'

export async function POST(request) {
  const auth = await requireAuthAndRole({
    unauthorizedMessage: 'You must be authenticated to upload a trade license',
    allowedRoles: ['company'],
    forbiddenMessage: 'Only companies can upload trade licenses',
  })
  if (auth.errorResponse) return auth.errorResponse

  const { supabase, user } = auth
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 3: Validate request body
  // ═══════════════════════════════════════════════════════════════════
  const parsed = await parseJsonBody(request, 'Invalid JSON in request body')
  if (parsed.errorResponse) return parsed.errorResponse
  const body = parsed.body
  
  const { file_url } = body
  
  if (!file_url || typeof file_url !== 'string') {
    return NextResponse.json(
      { error: 'file_url is required and must be a string' },
      { status: 400 }
    )
  }
  
  // Basic URL validation (must be from our Supabase storage)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!file_url.startsWith(supabaseUrl)) {
    return NextResponse.json(
      { error: 'file_url must be a valid Supabase Storage URL' },
      { status: 400 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 4: Update company profile with license URL
  // ═══════════════════════════════════════════════════════════════════
  const { createServiceRoleClient } = require('@/lib/supabase-server')
  const serviceRoleClient = createServiceRoleClient()
  
  const { data: updatedProfile, error: updateError } = await serviceRoleClient
    .from('company_profiles')
    .update({
      trade_license_url: file_url,
      verification_status: 'pending',
      license_uploaded_at: new Date().toISOString(),
      // Clear any previous rejection feedback
      verification_feedback: null,
    })
    .eq('id', user.id)
    .select()
    .single()
  
  if (updateError) {
    console.error('Failed to update company profile:', updateError)
    return NextResponse.json(
      { error: 'Failed to save trade license. Please try again.' },
      { status: 500 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 5: Notify all admins about the new trade license submission
  // ═══════════════════════════════════════════════════════════════════
  const companyName = updatedProfile?.legal_name || 'A company'

  notifyAllAdmins({
    type:     'admin_company_verification',
    title:    `🏢 New Trade License: ${companyName}`,
    body:     `${companyName} submitted a trade license for verification. Review it in the Company Queue.`,
    data:     { link: '/admin/company-queue' },
    priority: 'important',
  })

  // ═══════════════════════════════════════════════════════════════════
  // Step 6: Return success response
  // ═══════════════════════════════════════════════════════════════════
  return NextResponse.json({
    success: true,
    message: 'Trade license uploaded successfully. Pending admin review.',
    verification_status: 'pending',
    license_uploaded_at: updatedProfile.license_uploaded_at,
  })
}
