import { requireAuthAndRole, parseJsonBody } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(request) {
	const auth = await requireAuthAndRole({
		allowedRoles: ['student', 'company', 'admin'],
	})
	if (auth.errorResponse) return auth.errorResponse

	const { supabase } = auth
	const { searchParams } = new URL(request.url)
	const skill = searchParams.get('skill')
	const page = parseInt(searchParams.get('page') || '1', 10)
	const limit = parseInt(searchParams.get('limit') || '20', 10)

	// Validate pagination params
	const validPage = Math.max(1, page)
	const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 per page

	const offset = (validPage - 1) * validLimit

	let query = supabase
		.from('projects')
		.select(
			'id, title, description, required_skills, budget_bdt, duration_weeks, deadline, status, created_at, company_profiles(legal_name)',
			{ count: 'exact' }
		)
		.eq('status', 'open')
		.order('created_at', { ascending: false })
		.range(offset, offset + validLimit - 1)

	if (skill) query = query.contains('required_skills', [skill])

	const { data, error, count } = await query
	if (error) {
		return NextResponse.json(
			{ error: 'Failed to fetch projects' },
			{ status: 500 }
		)
	}

	return NextResponse.json({
		projects: data,
		pagination: {
			page: validPage,
			limit: validLimit,
			total: count,
			pages: Math.ceil((count || 0) / validLimit),
		},
	})
}

export async function POST(request) {
	try {
		const auth = await requireAuthAndRole({
			allowedRoles: ['company'],
			forbiddenMessage: 'Only company accounts can post projects.',
		})
		if (auth.errorResponse) return auth.errorResponse

		const { supabase, user } = auth

		// ─── Step 3: Verified ──────────────────────────────────────────
		const { data: companyProfile, error: companyError } = await supabase
			.from('company_profiles')
			.select('verification_status')
			.eq('id', user.id)
			.single()

		if (companyError || companyProfile?.verification_status !== 'verified') {
			return NextResponse.json(
				{ error: 'Your company must be verified before posting projects.' },
				{ status: 403 }
			)
		}

		// ─── Step 4: Validate ──────────────────────────────────────────
		const parsed = await parseJsonBody(request)
		if (parsed.errorResponse) return parsed.errorResponse
		const body = parsed.body

		const {
			title,
			description,
			required_skills,
			budget_bdt,
			duration_weeks,
			deadline,
			deliverable_format,
		} = body

		if (!title || typeof title !== 'string' || !title.trim()) {
			return NextResponse.json({ error: 'Project title is required.' }, { status: 400 })
		}
		if (!description || typeof description !== 'string' || !description.trim()) {
			return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
		}
		if (!Array.isArray(required_skills) || required_skills.length === 0) {
			return NextResponse.json({ error: 'At least one required skill must be specified.' }, { status: 400 })
		}
		if (!budget_bdt || typeof budget_bdt !== 'number' || budget_bdt <= 0) {
			return NextResponse.json({ error: 'A valid budget (BDT) is required.' }, { status: 400 })
		}
		if (!duration_weeks || typeof duration_weeks !== 'number' || duration_weeks <= 0) {
			return NextResponse.json({ error: 'A valid duration in weeks is required.' }, { status: 400 })
		}
		if (!deadline || typeof deadline !== 'string' || !deadline.trim()) {
			return NextResponse.json({ error: 'Project deadline is required.' }, { status: 400 })
		}

		// ─── Step 5: Insert ────────────────────────────────────────────
		const insertPayload = {
			company_id: user.id,
			title: title.trim(),
			description: description.trim(),
			required_skills,
			budget_bdt,
			duration_weeks,
			deadline,
			status: 'open',
		}

		if (deliverable_format && typeof deliverable_format === 'string' && deliverable_format.trim()) {
			insertPayload.deliverable_format = deliverable_format.trim()
		}

		const { data: newProject, error: insertError } = await supabase
			.from('projects')
			.insert(insertPayload)
			.select('id')
			.single()

		if (insertError) {
			console.error('[projects POST] Insert error:', insertError)
			return NextResponse.json(
				{ error: 'Failed to create project. Please try again.' },
				{ status: 500 }
			)
		}

		return NextResponse.json({ project_id: newProject.id }, { status: 201 })
	} catch (err) {
		console.error('[projects POST] Unexpected error:', err)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
