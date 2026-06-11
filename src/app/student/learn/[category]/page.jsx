// src/app/student/learn/[category]/page.jsx
// src/app/student/learn/[category]/page.jsx
// Category Page — /student/learn/[category]
// Lists all skills in the category with verified level badges per student.

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import CustomSkillInput from './CustomSkillInput'
import { ChevronRight, ChevronLeft, CheckCircle2, Clock } from 'lucide-react'

const CATEGORIES = {
  tech:      { label: 'Tech & Development', icon: '💻', skills: ['React', 'Next.js', 'Vue.js', 'Node.js', 'Python', 'Django', 'FastAPI', 'PHP', 'Java', 'Flutter', 'React Native', 'PostgreSQL', 'TypeScript', 'DevOps'] },
  design:    { label: 'Design & Creative',  icon: '🎨', skills: ['Figma', 'UI/UX Design', 'Adobe XD', 'Photoshop', 'Illustrator', 'Motion Graphics', 'Brand Identity'] },
  content:   { label: 'Content & Writing',  icon: '✍️', skills: ['Blog Writing', 'Copywriting', 'Technical Writing', 'Script Writing', 'Social Media Content', 'SEO Writing'] },
  marketing: { label: 'Digital Marketing',  icon: '📈', skills: ['SEO', 'Social Media Marketing', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Content Strategy'] },
  data:      { label: 'Data & Research',    icon: '📊', skills: ['Data Analysis', 'Machine Learning', 'Excel/Sheets', 'Python (Data)', 'Power BI', 'Market Research'] },
}

const LEVEL_COLORS = {
  rookie:  'bg-green-500/15 text-green-300 border-green-500/30',
  skilled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  expert:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
}

const LEVEL_ORDER = ['rookie', 'skilled', 'expert']

export async function generateMetadata({ params }) {
  const { category } = await params
  const cat = CATEGORIES[category]
  return {
    title: cat ? `${cat.label} — Learn & Verify | KaajerBazar` : 'Category Not Found',
  }
}

export default async function CategoryPage({ params }) {
  const { category } = await params
  const cat = CATEGORIES[category]
  if (!cat) notFound()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles').select("full_name, role, avatar_url").eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/unauthorized')

  // Fetch verified skills for this category
  const { data: verifiedSkills } = await supabase
    .from('verified_skills')
    .select('skill_name, level')
    .eq('student_id', user.id)
    .eq('skill_category', category)

  // Build a map: { skillName -> Set(levels passed) }
  const verifiedMap = {}
  for (const v of (verifiedSkills ?? [])) {
    if (!verifiedMap[v.skill_name]) verifiedMap[v.skill_name] = new Set()
    verifiedMap[v.skill_name].add(v.level)
  }

  // Fetch active pending submission (if any)
  const { data: activeSubmission } = await supabase
    .from('module_submissions')
    .select('id, status, deadline_at, submitted_at, learning_modules(skill_name, difficulty_level, skill_category)')
    .eq('student_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  // Fetch all active skills in this category from the database (to include custom skills)
  const { data: dbModules } = await supabase
    .from('learning_modules')
    .select('skill_name')
    .eq('skill_category', category)
    .eq('is_active', true)

  const dynamicSkills = (dbModules ?? []).map(m => m.skill_name)

  // Combine hardcoded skills with dynamic skills and remove duplicates
  const allSkills = Array.from(new Set([...cat.skills, ...dynamicSkills]))
    .sort((a, b) => a.localeCompare(b))

  return (
    <DashboardShell avatarUrl={profile?.avatar_url} role="student" fullName={profile?.full_name ?? ''}
      activePath="/student/learn">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/student/learn" className="hover:text-white transition-colors flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Learn & Verify
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{cat.label}</span>
        </div>

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {cat.icon} {cat.label}
          </h1>
          <p className="text-slate-400">Select a skill to see available modules and your progress.</p>
        </div>

        {/* ── Active Module Banner ── */}
        {activeSubmission && !activeSubmission.submitted_at && (
          <div className="glass rounded-xl border border-amber-500/30 p-5 flex items-center justify-between gap-4 bg-amber-500/5 mb-6">
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
              className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors"
            >
              Continue →
            </Link>
          </div>
        )}

        {/* ── Skill Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allSkills.map((skill) => {
            const passed = verifiedMap[skill] ?? new Set()
            const allPassed = LEVEL_ORDER.every((l) => passed.has(l))

            return (
              <Link
                key={skill}
                href={`/student/learn/${category}/${encodeURIComponent(skill)}`}
                className={`group glass rounded-xl border p-5 flex items-center justify-between transition-all hover:scale-[1.01] hover:border-purple-500/40 ${
                  allPassed ? 'border-green-500/30 bg-green-500/5' : 'border-white/10'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-white font-semibold">{skill}</p>
                    {allPassed && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                  </div>

                  {/* Level badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {LEVEL_ORDER.map((level) => (
                      passed.has(level) ? (
                        <span key={level}
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${LEVEL_COLORS[level]}`}>
                          ✓ {level}
                        </span>
                      ) : (
                        <span key={level}
                          className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-500 capitalize">
                          {level}
                        </span>
                      )
                    ))}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0 ml-3" />
              </Link>
            )
          })}
        </div>

        {/* ── Custom Skill ── */}
        <CustomSkillInput category={category} />

      </div>
    </DashboardShell>
  )
}
