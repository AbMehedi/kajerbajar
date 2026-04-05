// src/app/api/company/upload-license/route.js
// Story 1.2: Company uploads trade license for verification
// 
// Flow:
//   1. Company uploads PDF to Supabase Storage (client-side)
//   2. This endpoint saves the file URL to company_profiles
//   3. Sets verification_status = 'pending'
//   4. Admin sees it in their queue

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
      { error: 'You must be authenticated to upload a trade license' },
      { status: 401 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 2: Verify user is a company
  // ═══════════════════════════════════════════════════════════════════
  const { data: profile, error: profileError } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError || profile?.role !== 'company') {
    return NextResponse.json(
      { error: 'Only companies can upload trade licenses' },
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
  const { data: updatedProfile, error: updateError } = await supabase
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
  // Step 5: Return success response
  // ═══════════════════════════════════════════════════════════════════
  return NextResponse.json({
    success: true,
    message: 'Trade license uploaded successfully. Pending admin review.',
    verification_status: 'pending',
    license_uploaded_at: updatedProfile.license_uploaded_at,
  })
}
