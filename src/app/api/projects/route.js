import { requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(request) {
	const auth = await requireAuthAndRole({
		allowedRoles: ['student', 'company', 'admin'],
	})
	if (auth.errorResponse) return auth.errorResponse

	const { supabase } = auth
	const { searchParams } = new URL(request.url)
	const skill = searchParams.get('skill')

	let query = supabase
		.from('projects')
		.select(
			'id, title, description, required_skills, budget_bdt, duration_weeks, deadline, status, created_at, company_profiles(legal_name)'
		)
		.eq('status', 'open')
		.order('created_at', { ascending: false })

	if (skill) query = query.contains('required_skills', [skill])

	const { data, error } = await query
	if (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch projects' },
			{ status: 500 }
		)
	}

	return NextResponse.json({ projects: data })
}
