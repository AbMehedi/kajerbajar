import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const auth = await requireAuthAndRole({
    allowedRoles: ['student', 'company', 'admin'],
  })
  if (auth.errorResponse) return auth.errorResponse

  const { supabase } = auth
  const { id } = params

  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, title, description, required_skills, budget_bdt, duration_weeks, deadline, status, created_at, company_id, company_profiles(legal_name, industry, description)'
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    console.error('[projects GET] DB error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ project: data })
}
