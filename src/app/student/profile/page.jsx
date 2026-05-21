import { redirect } from 'next/navigation'

export default function RedirectToDashboard() {
  redirect('/student/dashboard')
}
