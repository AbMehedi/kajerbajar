import { createServiceRoleClient } from '@/lib/supabase-server'
import { notifyUser } from '@/lib/server-notifications'

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
    }
    // Note: if no reviews, avgRating stays 0 — students with no reviews cannot earn a badge.

    const earnings = student.wallet_balance || 0
    let targetBadge = null

    if (earnings >= 500000 && avgRating >= 4.9) {
      targetBadge = 'top_rated_plus'
    } else if (earnings >= 100000 && avgRating >= 4.8) {
      targetBadge = 'top_rated'
    } else if (earnings >= 20000 && avgRating >= 4.5) {
      targetBadge = 'rising_talent'
    }

    // Fetch current active badge (if any)
    const { data: existing } = await adminClient
      .from('student_badges')
      .select('badge_type, is_active')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .maybeSingle()

    if (targetBadge) {
      // Only update if the badge has changed
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
          
        const BADGE_LABELS = {
          rising_talent: '🌟 Rising Star',
          top_rated: '⭐ Top Rated',
          top_rated_plus: '🏆 Elite',
        }
        const badgeName = BADGE_LABELS[targetBadge] || targetBadge

        await notifyUser({
          userId: studentId,
          type: 'system',
          title: 'You Earned a New Badge!',
          body: `Congratulations! Your KaajerBazar performance has earned you the ${badgeName} badge. Keep up the great work!`,
          data: { link: '/student/dashboard' },
          priority: 'normal',
        })
          
        console.log(`[evaluateStudentBadge] Assigned ${targetBadge} to ${studentId}`)
      }
    } else if (existing) {
      // Student no longer qualifies for any badge — revoke the current one
      await adminClient
        .from('student_badges')
        .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: 'No longer meets badge criteria' })
        .eq('student_id', studentId)
        .eq('is_active', true)
      console.log(`[evaluateStudentBadge] Revoked ${existing.badge_type} from ${studentId}`)
    }
  } catch (err) {
    console.error('[evaluateStudentBadge] Error evaluating badge for', studentId, err)
  }
}
