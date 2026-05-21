import { parseJsonBody, requireAuthAndRole } from '@/lib/api'
import { NextResponse } from 'next/server'

// Simple UUID-v4 shape check (Supabase UUIDs always match this pattern)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student'],
      forbiddenMessage: 'Only student accounts can apply to projects.',
    })
    if (auth.errorResponse) return auth.errorResponse

    const { supabase, user } = auth

    // ─── Step 1: Validate body ─────────────────────────────────────
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const body = parsed.body

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

    // ─── Step 2: Duplicate check ───────────────────────────────────
    const { data: existing, error: dupError } = await supabase
      .from('applications')
      .select('id')
      .eq('project_id', project_id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (dupError) {
      console.error('[applications POST] Duplicate-check error:', dupError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied to this project.' },
        { status: 409 }
      )
    }

    // ─── Step 3: Insert application ────────────────────────────────
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
      console.error('[applications POST] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { application_id: newApplication.id },
      { status: 201 }
    )
  } catch (err) {
    console.error('[applications POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
