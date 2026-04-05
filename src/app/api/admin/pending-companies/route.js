// src/app/api/admin/pending-companies/route.js
// Story 1.2: Admin fetches list of companies awaiting verification
//
// Returns: Array of companies with verification_status = 'pending'
// Each company includes: id, legal_name, email, trade_license_url, license_uploaded_at

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 1: Verify user is authenticated
  // ═══════════════════════════════════════════════════════════════════
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'You must be authenticated to view pending companies' },
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
      { error: 'Only admins can view pending company verifications' },
      { status: 403 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 3: Fetch pending companies with their user info
  // ═══════════════════════════════════════════════════════════════════
  const { data: pendingCompanies, error: fetchError } = await supabase
    .from('company_profiles')
    .select(`
      id,
      legal_name,
      industry,
      website,
      trade_license_url,
      verification_status,
      license_uploaded_at,
      users_profiles!inner (
        email,
        full_name
      )
    `)
    .eq('verification_status', 'pending')
    .order('license_uploaded_at', { ascending: true }) // FIFO: oldest first
  
  if (fetchError) {
    console.error('Failed to fetch pending companies:', fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch pending companies' },
      { status: 500 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // Step 4: Transform response for cleaner API
  // ═══════════════════════════════════════════════════════════════════
  const companies = pendingCompanies.map(company => ({
    id: company.id,
    legal_name: company.legal_name,
    industry: company.industry,
    website: company.website,
    email: company.users_profiles.email,
    contact_name: company.users_profiles.full_name,
    trade_license_url: company.trade_license_url,
    submitted_at: company.license_uploaded_at,
  }))
  
  return NextResponse.json({
    success: true,
    count: companies.length,
    companies,
  })
}
