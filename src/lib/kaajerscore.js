// src/lib/kaajerscore.js
// KaajerScore Reputation Engine
//
// KaajerScore is a trust score (0–100) built from three weighted components:
//   30% — Skill Verification Average  (approved skills / total closed verifications)
//   50% — Average Project Ratings     (average star rating from unlocked reviews, scaled to 0–100)
//   20% — Project Completion Rate     (completed projects / total assigned projects)
//
// Score is NULL for brand-new students with zero activity.
// Stored in student_profiles.kaajerscore as a decimal.

import { createServiceRoleClient } from '@/lib/supabase-server'

/**
 * Recalculate and persist the KaajerScore for a given student.
 * Uses a pure service-role client internally to guarantee RLS bypass —
 * callers must NOT pass a cookie-session client (which acts as the user).
 *
 * @param {string} studentId — UUID of the student
 */
export async function recalculateKaajerScore(studentId) {
  const adminClient = createServiceRoleClient()
  try {
    // ── Component 1: Skill Verification Average (30%) ───────────────────────
    // Count ALL closed verifications (approved + rejected) and approved ones.
    const { data: verifications } = await adminClient
      .from('skill_verifications')
      .select('status')
      .eq('student_id', studentId)
      .in('status', ['approved', 'rejected'])

    const totalClosed = verifications?.length ?? 0
    const totalApproved = verifications?.filter((v) => v.status === 'approved').length ?? 0

    // Skill component: 0–100 (percentage of closed verifications that were approved)
    const skillScore = totalClosed > 0 ? (totalApproved / totalClosed) * 100 : null

    // ── Component 2: Average Project Ratings Received (50%) ──────────────────
    // Only include unlocked reviews (i.e., projects where the student has also reviewed).
    // Step 1: Get all project_ids where student has left a review.
    const { data: myReviews } = await adminClient
      .from('project_reviews')
      .select('project_id')
      .eq('reviewer_id', studentId)

    const unlockedProjectIds = myReviews?.map((r) => r.project_id) ?? []

    let ratingScore = null
    if (unlockedProjectIds.length > 0) {
      const { data: receivedRatings } = await adminClient
        .from('project_reviews')
        .select('rating')
        .eq('reviewee_id', studentId)
        .in('project_id', unlockedProjectIds)

      if (receivedRatings && receivedRatings.length > 0) {
        const sum = receivedRatings.reduce((acc, r) => acc + r.rating, 0)
        const avgStars = sum / receivedRatings.length // 1–5
        ratingScore = ((avgStars - 1) / 4) * 100 // Scale 1–5 → 0–100
      }
    }

    // ── Component 3: Project Completion Rate (20%) ───────────────────────────
    // Count projects where student was selected, regardless of outcome.
    const { data: assignedApps } = await adminClient
      .from('applications')
      .select('project_id, projects ( status )')
      .eq('student_id', studentId)
      .eq('status', 'selected')

    const assigned = assignedApps ?? []
    const closedProjects = assigned.filter(
      (a) => a.projects?.status === 'completed' || a.projects?.status === 'cancelled'
    )
    const completedProjects = assigned.filter((a) => a.projects?.status === 'completed')

    let completionScore = null
    if (closedProjects.length > 0) {
      completionScore = (completedProjects.length / closedProjects.length) * 100
    } else if (assigned.length > 0) {
      // Has active assignments but none are closed yet — treat as 100% for now
      completionScore = 100
    }

    // ── Determine final KaajerScore ──────────────────────────────────────────
    // If all three components are null, student has no activity → score = null
    const hasAnyActivity = skillScore !== null || ratingScore !== null || completionScore !== null

    let finalScore = null
    if (hasAnyActivity) {
      // Use 0 for null components so we don't artificially inflate partial scores
      const s = skillScore ?? 0
      const r = ratingScore ?? 0
      const c = completionScore ?? 0

      // Weighted sum
      const weighted = s * 0.30 + r * 0.50 + c * 0.20

      // Round to 1 decimal place, clamp to [0, 100]
      finalScore = Math.min(100, Math.max(0, Math.round(weighted * 10) / 10))
    }

    // ── Persist to student_profiles ──────────────────────────────────────────
    const { error } = await adminClient
      .from('student_profiles')
      .update({ kaajerscore: finalScore })
      .eq('id', studentId)

    if (error) {
      console.error('[recalculateKaajerScore] DB update error:', error)
    }

    return { finalScore, skillScore, ratingScore, completionScore }
  } catch (err) {
    console.error('[recalculateKaajerScore] Unexpected error:', err)
  }
}
