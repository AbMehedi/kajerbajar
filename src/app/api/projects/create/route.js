// src/app/api/projects/create/route.js
// Story 3.1: POST /api/projects/create — verified company posts a micro-project
//
// Five-step pattern:
//   1. Auth     — must be logged in                    → 401
//   2. Role     — must have role 'company'             → 403
//   3. Verified — verification_status must be verified → 403
//   4. Validate — required fields present & valid      → 400
//   5. Insert   — INSERT into projects, return id      → 201

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient()

    // ─── Step 1: Auth ──────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── Step 2: Role ──────────────────────────────────────────────
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'company') {
      return NextResponse.json(
        { error: 'Only company accounts can post projects.' },
        { status: 403 }
      )
    }

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
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

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
      console.error('[projects/create] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create project. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ project_id: newProject.id }, { status: 201 })
  } catch (err) {
    console.error('[projects/create] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
