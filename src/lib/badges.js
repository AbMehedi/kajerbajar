// src/lib/badges.js
import { createServiceRoleClient } from '@/lib/supabase-server'

/**
 * Automatically evaluates and assigns marketplace badges for a student
 * based on their wallet earnings and average review rating.
 * 
 * @param {string} studentId - UUID of the student
 */
export async function evaluateStudentBadge(studentId) {
  const adminClient = createServiceRoleClient()

  try {
    // 1. Get student's wallet balance
    const { data: student, error: studentError } = await adminClient
      .from('student_profiles')
      .select('wallet_balance')
      .eq('id', studentId)
      .single()

    if (studentError || !student) return

    // 2. Get average rating
    const { data: reviews } = await adminClient
      .from('project_reviews')
      .select('rating')
      .eq('reviewee_id', studentId)

    let avgRating = 0
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
      avgRating = sum / reviews.length
    } else {
      // If no reviews, assume 5.0 for baseline to allow initial earning-based unlock if they somehow have earnings without reviews
      avgRating = 5.0
    }

    const earnings = student.wallet_balance || 0
    let targetBadge = null

    if (earnings >= 500000 && avgRating >= 4.9) {
      targetBadge = 'top_rated_plus'
    } else if (earnings >= 100000 && avgRating >= 4.8) {
      targetBadge = 'top_rated'
    } else if (earnings >= 20000 && avgRating >= 4.5) {
      targetBadge = 'rising_talent'
    }

    if (targetBadge) {
      const { data: existing } = await adminClient
        .from('student_badges')
        .select('badge_type, is_active')
        .eq('student_id', studentId)
        .eq('is_active', true)
        .maybeSingle()

      if (!existing || existing.badge_type !== targetBadge) {
        if (existing) {
          await adminClient
            .from('student_badges')
            .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: 'Upgraded to higher tier' })
            .eq('student_id', studentId)
            .eq('is_active', true)
        }

        await adminClient
          .from('student_badges')
          .insert({
            student_id: studentId,
            badge_type: targetBadge,
            is_active: true
          })
          
        console.log(`[evaluateStudentBadge] Assigned \${targetBadge} to \${studentId}`)
      }
    }
  } catch (err) {
    console.error('[evaluateStudentBadge] Error evaluating badge for', studentId, err)
  }
}
