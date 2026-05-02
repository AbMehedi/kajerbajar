// src/app/api/applications/create/route.js
// Story 3.2: POST /api/applications/create — student applies to a micro-project
//
// Five-step pattern (mirrors projects/create):
//   1. Auth      — must be logged in                         → 401
//   2. Role      — users_profiles.role = 'student'           → 403
//   3. Validate  — project_id (UUID), cover_note (≤ 1000)   → 400
//   4. Duplicate — existing (project_id, student_id) row     → 409
//   5. Insert    — INSERT into applications, return id        → 201

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Simple UUID-v4 shape check (Supabase UUIDs always match this pattern)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

    if (profileError || userProfile?.role !== 'student') {
      return NextResponse.json(
        { error: 'Only student accounts can apply to projects.' },
        { status: 403 }
      )
    }

    // ─── Step 3: Validate ──────────────────────────────────────────
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { project_id, cover_note, portfolio_item_url } = body

    if (!project_id || !UUID_RE.test(project_id)) {
      return NextResponse.json({ error: 'A valid project_id (UUID) is required.' }, { status: 400 })
    }

    if (!cover_note || typeof cover_note !== 'string' || !cover_note.trim()) {
      return NextResponse.json({ error: 'cover_note is required.' }, { status: 400 })
    }

    if (cover_note.trim().length > 1000) {
      return NextResponse.json(
        { error: 'cover_note must be 1000 characters or fewer.' },
        { status: 400 }
      )
    }

    if (portfolio_item_url !== undefined && portfolio_item_url !== null && portfolio_item_url !== '') {
      try {
        new URL(portfolio_item_url)
      } catch {
        return NextResponse.json(
          { error: 'portfolio_item_url must be a valid URL.' },
          { status: 400 }
        )
      }
    }

    // ─── Step 4: Duplicate check ───────────────────────────────────
    const { data: existing, error: dupError } = await supabase
      .from('applications')
      .select('id')
      .eq('project_id', project_id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (dupError) {
      console.error('[applications/create] Duplicate-check error:', dupError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied to this project.' },
        { status: 409 }
      )
    }

    // ─── Step 5: Insert ────────────────────────────────────────────
    const insertPayload = {
      project_id,
      student_id: user.id,
      cover_note: cover_note.trim(),
      status: 'pending',
    }

    if (portfolio_item_url && typeof portfolio_item_url === 'string' && portfolio_item_url.trim()) {
      insertPayload.portfolio_item_url = portfolio_item_url.trim()
    }

    const { data: newApplication, error: insertError } = await supabase
      .from('applications')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError) {
      // Catch DB-level unique constraint violation as a fallback
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already applied to this project.' },
          { status: 409 }
        )
      }
      console.error('[applications/create] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ application_id: newApplication.id }, { status: 201 })
  } catch (err) {
    console.error('[applications/create] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
