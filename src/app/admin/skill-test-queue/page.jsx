// src/app/admin/skill-test-queue/page.jsx
// Old admin skill queue — redirects to the new Learning Module queue
import { redirect } from 'next/navigation'

export default function RedirectToLearningQueue() {
  redirect('/admin/learning/queue')
}
