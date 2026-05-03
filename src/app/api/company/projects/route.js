// src/app/api/company/projects/route.js
// GET /api/company/projects
// Returns the authenticated company's projects, each with total applicant count.
// Used by: ApplicationsPanel.jsx (company dashboard)

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Role guard
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Companies only' }, { status: 403 })
    }

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
