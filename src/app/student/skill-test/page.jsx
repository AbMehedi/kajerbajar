import { redirect } from 'next/navigation'

// Old skill-test page — now redirects to the new Learning Module system
export default function RedirectToLearn() {
  redirect('/student/learn')
}
