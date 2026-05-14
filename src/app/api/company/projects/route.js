// src/app/api/company/projects/route.js
// GET /api/company/projects
// Returns the authenticated company's projects, each with total applicant count.
// Used by: ApplicationsPanel.jsx (company dashboard)

import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['company'],
      forbiddenMessage: 'Companies only',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    // Fetch company's projects with applicant count via PostgREST aggregate
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        budget_bdt,
        deadline,
        created_at,
        escrow_status,
        applications ( count )
      `)
      .eq('company_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[company/projects] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Flatten the nested count into a scalar field
    const projectsWithCount = (projects ?? []).map((p) => ({
      ...p,
      applicant_count: p.applications?.[0]?.count ?? 0,
      applications: undefined,
    }))

    return NextResponse.json({ projects: projectsWithCount })
  } catch (err) {
    console.error('[company/projects] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
