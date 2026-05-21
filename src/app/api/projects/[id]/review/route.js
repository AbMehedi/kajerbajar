// src/app/api/projects/[id]/review/route.js
// POST /api/projects/[id]/review
// Submit a 1-5 star review and comment for a completed project.

import { requireAuthAndRole, parseJsonBody } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { recalculateKaajerScore } from '@/lib/kaajerscore'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const auth = await requireAuthAndRole({
      allowedRoles: ['student', 'company'],
    })
    if (auth.errorResponse) return auth.errorResponse

    const { user, role } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // 1. Verify project access and completion status
    const { data: project } = await adminClient
      .from('projects')
      .select('id, company_id, status')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'completed') {
      return NextResponse.json({ error: 'Reviews can only be left on completed projects' }, { status: 400 })
    }

    // Determine reviewee_id based on who is leaving the review
    let revieweeId = null
    if (role === 'company') {
      if (project.company_id !== user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

      // Fetch the assigned student
      const { data: app } = await adminClient
        .from('applications')
        .select('student_id')
        .eq('project_id', projectId)
        .eq('status', 'selected')
        .single()
      if (!app) return NextResponse.json({ error: 'Assigned student not found' }, { status: 400 })
      
      revieweeId = app.student_id
    } else {
      // Student is reviewing the company
      const { data: app } = await adminClient
        .from('applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('student_id', user.id)
        .eq('status', 'selected')
        .single()
      if (!app) return NextResponse.json({ error: 'Access denied — not assigned' }, { status: 403 })

      // DOUBLE-BLIND ENFORCEMENT: Ensure company has already left a review
      const { data: companyReview } = await adminClient
        .from('project_reviews')
        .select('id')
        .eq('project_id', projectId)
        .eq('reviewer_id', project.company_id)
        .single()

      if (!companyReview) {
        return NextResponse.json({ error: 'You cannot leave feedback until the company leaves their feedback first.' }, { status: 400 })
      }

      revieweeId = project.company_id
    }

    // 2. Parse payload
    const parsed = await parseJsonBody(request)
    if (parsed.errorResponse) return parsed.errorResponse
    const { rating, comment } = parsed.body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 })
    }

    // 3. Check if review already exists
    const { data: existingReview } = await adminClient
      .from('project_reviews')
      .select('id')
      .eq('project_id', projectId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this project' }, { status: 400 })
    }

    // 4. Insert review
    const { error: insertError } = await adminClient
      .from('project_reviews')
      .insert({
        project_id: projectId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: Math.floor(rating),
        comment: comment?.trim() || null,
      })

    if (insertError) {
      console.error('[review POST] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    // 5. Recalculate KaajerScore (all 3 components) when student submits their review.
    // This is when the double-blind lock is lifted, making ratings count towards the score.
    if (role === 'student') {
      await recalculateKaajerScore(user.id)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[review POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
