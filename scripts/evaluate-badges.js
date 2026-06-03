import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function evaluateBadges() {
  console.log('--- Starting Badge Evaluation ---')

  // 1. Get all students with their wallet_balance
  const { data: students, error: studentErr } = await supabase
    .from('student_profiles')
    .select('id, wallet_balance, users_profiles(full_name)')

  if (studentErr) {
    console.error('Error fetching students:', studentErr)
    return
  }

  // 2. Fetch all ratings to calculate average client rating per student
  const { data: reviews, error: reviewsErr } = await supabase
    .from('project_reviews')
    .select('reviewee_id, rating')

  if (reviewsErr) {
    console.error('Error fetching reviews:', reviewsErr)
    return
  }

  // Calculate avg rating per student
  const studentRatings = {}
  reviews.forEach(r => {
    if (!studentRatings[r.reviewee_id]) {
      studentRatings[r.reviewee_id] = { sum: 0, count: 0 }
    }
    studentRatings[r.reviewee_id].sum += r.rating
    studentRatings[r.reviewee_id].count += 1
  })

  // 3. Evaluate each student
  for (const student of students) {
    const earnings = student.wallet_balance || 0
    const ratingData = studentRatings[student.id]
    const avgRating = ratingData ? (ratingData.sum / ratingData.count) : 0

    let targetBadge = null

    // Elite
    if (earnings >= 500000 && avgRating >= 4.9) {
      targetBadge = 'top_rated_plus' // DB enum for Elite
    }
    // Top Rated
    else if (earnings >= 100000 && avgRating >= 4.8) {
      targetBadge = 'top_rated'
    }
    // Rising Star
    else if (earnings >= 20000 && avgRating >= 4.5) {
      targetBadge = 'rising_talent' // DB enum for Rising Star
    }

    if (targetBadge) {
      // Check if they already have this badge active
      const { data: existing } = await supabase
        .from('student_badges')
        .select('badge_type, is_active')
        .eq('student_id', student.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!existing || existing.badge_type !== targetBadge) {
        // Revoke old badge if any
        if (existing) {
          await supabase
            .from('student_badges')
            .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: 'Upgraded to higher tier' })
            .eq('student_id', student.id)
            .eq('is_active', true)
        }

        // Insert new badge
        const { error: insertErr } = await supabase
          .from('student_badges')
          .insert({
            student_id: student.id,
            badge_type: targetBadge,
            is_active: true
          })

        if (!insertErr) {
          console.log(`✅ Granted ${targetBadge} to ${student.users_profiles?.full_name} (Earnings: ৳${earnings}, Rating: ${avgRating.toFixed(1)})`)
        } else {
          console.error(`❌ Failed to grant to ${student.users_profiles?.full_name}:`, insertErr)
        }
      } else {
        // Already has the correct badge
      }
    }
  }

  console.log('--- Evaluation Complete ---')
}

evaluateBadges()
