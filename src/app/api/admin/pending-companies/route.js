// src/app/api/admin/pending-companies/route.js
// Story 1.2: Admin fetches list of companies awaiting verification
//
// Returns: Array of companies with verification_status = 'pending'
// Each company includes: id, legal_name, email, trade_license_url, license_uploaded_at

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireAuthAndRole({
    unauthorizedMessage: 'You must be authenticated to view pending companies',
    allowedRoles: ['admin'],
    forbiddenMessage: 'Only admins can view pending company verifications',
  })
  if (auth.errorResponse) return auth.errorResponse

  const { supabase } = auth
  
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
