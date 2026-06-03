// src/app/student/learn/page.jsx
// Learning Home — /student/learn
// Shows 5 skill category cards, student's verified skills, and active module (if any)

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import { BookOpen, Clock, ChevronRight, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Learn & Verify Skills — KaajerBazar',
  description: 'Complete learning modules to verify your skills and build your profile.',
}

const CATEGORIES = [
  { id: 'tech',      label: 'Tech & Development', icon: '💻', description: 'Web, mobile, backend & infrastructure', color: 'from-blue-600/20 to-blue-500/5',   border: 'border-blue-500/30',   badge: 'text-blue-400' },
  { id: 'design',    label: 'Design & Creative',  icon: '🎨', description: 'UI/UX, visual design & creative tools', color: 'from-purple-600/20 to-purple-500/5', border: 'border-purple-500/30', badge: 'text-purple-400' },
  { id: 'content',   label: 'Content & Writing',  icon: '✍️', description: 'Writing, editing & content creation',  color: 'from-green-600/20 to-green-500/5',  border: 'border-green-500/30',  badge: 'text-green-400' },
  { id: 'marketing', label: 'Digital Marketing',  icon: '📈', description: 'SEO, ads, social & growth',            color: 'from-orange-600/20 to-orange-500/5', border: 'border-orange-500/30', badge: 'text-orange-400' },
  { id: 'data',      label: 'Data & Research',    icon: '📊', description: 'Data analysis, ML & research',         color: 'from-cyan-600/20 to-cyan-500/5',     border: 'border-cyan-500/30',   badge: 'text-cyan-400' },
]

const LEVEL_COLORS = {
  rookie:  'bg-green-500/15 text-green-300 border-green-500/30',
  skilled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  expert:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
}

export default async function LearnHome() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles').select('full_name, role').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch verified skills
  const { data: verifiedSkills } = await supabase
    .from('verified_skills')
    .select('id, skill_name, skill_category, level, earned_at')
    .eq('student_id', user.id)
    .order('earned_at', { ascending: false })

  // Fetch active pending submission
  const { data: activeSubmission } = await supabase
    .from('module_submissions')
    .select('id, status, deadline_at, submitted_at, learning_modules(skill_name, difficulty_level, skill_category)')
    .eq('student_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  // Count pending review (submitted but not yet decided)
  const { count: pendingReviewCount } = await supabase
    .from('module_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('status', 'pending')
    .not('submitted_at', 'is', null)

  const skills = verifiedSkills ?? []
  const catCounts = {}
  for (const s of skills) {
    catCounts[s.skill_category] = (catCounts[s.skill_category] || 0) + 1
  }

  return (
    <DashboardShell role="student" fullName={profile?.full_name ?? ''} activePath="/student/learn">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-purple-400" /> Learn & Verify
            </h1>
            <p className="text-slate-400">Complete skill modules to earn verified badges on your profile.</p>
          </div>
          <Link href="/student/learn/submissions"
            className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors">
            My Submissions
          </Link>
        </div>

        {/* ── Active Module Banner ── */}
        {activeSubmission && !activeSubmission.submitted_at && (
          <div className="glass rounded-xl border border-amber-500/30 p-5 flex items-center justify-between gap-4 bg-amber-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Active Module: {activeSubmission.learning_modules?.skill_name} — {' '}
                  <span className="capitalize">{activeSubmission.learning_modules?.difficulty_level}</span>
                </p>
                <p className="text-amber-300/70 text-xs mt-0.5">
                  Deadline: {new Date(activeSubmission.deadline_at).toLocaleString('en-GB')}
                </p>
              </div>
            </div>
            <Link
              href={`/student/learn/${activeSubmission.learning_modules?.skill_category}/${encodeURIComponent(activeSubmission.learning_modules?.skill_name ?? '')}`}
              className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors">
              Continue →
            </Link>
          </div>
        )}

        {/* ── Verified Skills ── */}
        {skills.length > 0 && (
          <div className="glass rounded-xl border border-white/10 p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Your Verified Skills ({skills.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${LEVEL_COLORS[s.level] ?? 'bg-white/10 text-white border-white/20'}`}>
                  {s.skill_name}
                  <span className="opacity-70 text-xs capitalize">— {s.level}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Pending Review Banner ── */}
        {(pendingReviewCount ?? 0) > 0 && (
          <div className="glass rounded-xl border border-blue-500/30 p-4 flex items-center gap-3 bg-blue-500/5">
            <span className="text-blue-400 text-lg">⏳</span>
            <p className="text-blue-300 text-sm">
              <strong>{pendingReviewCount}</strong> submission{pendingReviewCount !== 1 ? 's' : ''} awaiting admin review. You&apos;ll get notified when reviewed.
            </p>
          </div>
        )}

        {/* ── Category Cards ── */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Choose a Skill Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/student/learn/${cat.id}`}
                className={`group glass rounded-xl border ${cat.border} p-6 bg-gradient-to-br ${cat.color} hover:scale-[1.02] hover:shadow-lg transition-all duration-200`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{cat.icon}</span>
                  {catCounts[cat.id] > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLORS.rookie} font-medium`}>
                      {catCounts[cat.id]} verified
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-base mb-1">{cat.label}</h3>
                <p className="text-slate-400 text-xs mb-3">{cat.description}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${cat.badge} group-hover:gap-2 transition-all`}>
                  Explore skills <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── How it Works ── */}
        <div className="glass rounded-xl border border-white/10 p-6">
          <h2 className="text-white font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Pick a Skill', desc: 'Choose any skill and difficulty level' },
              { step: '2', title: 'Get Your Brief', desc: 'AI generates a unique project brief just for you' },
              { step: '3', title: 'Build & Submit', desc: 'Complete the project within the deadline' },
              { step: '4', title: 'Get Verified', desc: 'Admin reviews and adds skill to your profile' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold flex items-center justify-center mx-auto mb-2">
                  {item.step}
                </div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardShell>
  )
}
