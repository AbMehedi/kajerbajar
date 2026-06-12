'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Navbar from '@/components/Navbar'
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Star,
  Crown,
  CheckCircle2,
  Zap,
  Code2,
  Palette,
  PenTool,
  BarChart3,
  Megaphone,
  Clock,
  FileCheck,
  BadgeCheck,
  Lock,
  Wallet,
  ChevronDown,
  ChevronRight,
  Target,
  Layers,
  Shield,
  MonitorSmartphone,
} from 'lucide-react'

// ── Mounted guard ──────────────────────────────────────────────────────────────
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

// ── Animated counter ───────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = 16
    const increment = target / (1600 / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ tag, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12"
    >
      <p className="text-xs text-[hsl(var(--kb-brand-400))] uppercase tracking-widest font-semibold mb-2">{tag}</p>
      <h2 className="text-2xl md:text-3xl font-extrabold text-white">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm mt-3 max-w-2xl mx-auto">{subtitle}</p>}
    </motion.div>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }) {
  const styles = {
    purple: { border: 'hover:border-[hsl(var(--kb-brand-500))/0.6] hover:shadow-[0_20px_60px_-30px_hsl(var(--kb-brand-500)/0.45)]', icon: 'text-[hsl(var(--kb-brand-400))] bg-[hsl(var(--kb-brand-500))/0.12]', bar: 'from-[hsl(var(--kb-brand-500))/0.7]' },
    blue:   { border: 'hover:border-blue-500/50 hover:shadow-blue-500/10', icon: 'text-blue-300 bg-blue-500/10', bar: 'from-blue-500/60' },
    green:  { border: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10', icon: 'text-emerald-300 bg-emerald-500/10', bar: 'from-emerald-500/60' },
    amber:  { border: 'hover:border-amber-500/50 hover:shadow-amber-500/10', icon: 'text-amber-300 bg-amber-500/10', bar: 'from-amber-500/60' },
    rose:   { border: 'hover:border-rose-500/50 hover:shadow-rose-500/10', icon: 'text-rose-300 bg-rose-500/10', bar: 'from-rose-500/60' },
    cyan:   { border: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10', icon: 'text-cyan-300 bg-cyan-500/10', bar: 'from-cyan-500/60' },
  }[color] || styles.purple

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className={`relative glass rounded-2xl p-6 border border-white/10 transition-shadow duration-300 hover:shadow-xl ${styles.border}`}
    >
      <div className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r ${styles.bar} to-transparent`} />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${styles.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ── Skill category data ────────────────────────────────────────────────────────
const SKILL_CATEGORIES = [
  {
    name: 'Tech & Development',
    icon: Code2,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    skills: ['React', 'Next.js', 'Vue.js', 'Node.js', 'Python', 'Django', 'FastAPI', 'PHP', 'Java', 'Flutter', 'React Native', 'PostgreSQL', 'TypeScript', 'DevOps'],
  },
  {
    name: 'Design & Creative',
    icon: Palette,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD', 'Photoshop', 'Illustrator', 'Motion Graphics', 'Brand Identity'],
  },
  {
    name: 'Content & Writing',
    icon: PenTool,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    skills: ['Blog Writing', 'Copywriting', 'Technical Writing', 'Script Writing', 'Social Media Content', 'SEO Writing'],
  },
  {
    name: 'Digital Marketing',
    icon: Megaphone,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    skills: ['SEO', 'Social Media Marketing', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Content Strategy'],
  },
  {
    name: 'Data & Research',
    icon: BarChart3,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    skills: ['Data Analysis', 'Machine Learning', 'Excel/Sheets', 'Python (Data)', 'Power BI', 'Web Scraping'],
  },
]

// ── Badge tiers ────────────────────────────────────────────────────────────────
const BADGE_TIERS = [
  {
    name: 'Rising Star',
    icon: TrendingUp,
    gradient: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    description: 'Proven foundational skills with consistent delivery.',
    criteria: [
      '4.5+ Average Client Rating',
      'Total earnings of at least ৳20,000',
      'Account in good standing (no disputes)',
    ],
    benefits: [
      'Rising Star Profile Highlight',
      'Priority ranking in beginner job search',
      'Access to exclusive community events',
    ],
  },
  {
    name: 'Top Rated',
    icon: Star,
    gradient: 'from-blue-400 to-indigo-500',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    description: 'Among the best — trusted by clients with verified expertise.',
    criteria: [
      '4.8+ Average Client Rating',
      'Total earnings of at least ৳100,000',
      '90%+ on-time delivery rate',
    ],
    benefits: [
      'Top Rated Profile Badge',
      'Premium 24/7 Support',
      'Exclusive high-paying job invites',
      '5% lower platform fee on all projects',
    ],
  },
  {
    name: 'Top Rated Plus',
    icon: Crown,
    gradient: 'from-amber-400 to-orange-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    description: 'The pinnacle — an industry expert and highly sought-after professional.',
    criteria: [
      '4.9+ Average Client Rating',
      'Total earnings of at least ৳500,000',
      '95%+ on-time delivery rate',
    ],
    benefits: [
      'Top Rated Plus VIP Profile Badge',
      'Dedicated Account Manager',
      '0% platform fee on repeat clients',
      'Early access to enterprise features & beta',
    ],
  },
]

// ── How It Works steps ─────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign Up & Build Profile',
    desc: 'Create your student or company account. Students add skills, university info, and a portfolio.',
    icon: Users,
    color: 'text-blue-400 bg-blue-500/10',
  },
  {
    step: '02',
    title: 'Verify Skills via AI Modules',
    desc: 'Take AI-generated mini project briefs, submit your work, and earn verified skill badges reviewed by admins.',
    icon: BookOpen,
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    step: '03',
    title: 'Browse & Apply for Projects',
    desc: 'Companies post micro-projects. Students with matching verified skills apply, and companies pick the best fit.',
    icon: Briefcase,
    color: 'text-amber-400 bg-amber-500/10',
  },
  {
    step: '04',
    title: 'Deliver & Get Paid',
    desc: 'Work within milestones, submit deliverables. Once approved, escrow funds are released safely to your wallet.',
    icon: Wallet,
    color: 'text-[hsl(var(--kb-brand-400))] bg-[hsl(var(--kb-brand-500))/0.12]',
  },
]

// ── Expandable FAQ ─────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-medium text-white group-hover:text-[hsl(var(--kb-brand-400))] transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25 }}
          className="pb-5"
        >
          <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const mounted = useMounted()
  const [expandedCategory, setExpandedCategory] = useState(null)

  return (
    <div className="gradient-brand min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(600px 600px at 20% 10%, hsl(42 92% 55% / 0.22), transparent 60%), radial-gradient(500px 500px at 80% 20%, hsl(42 92% 55% / 0.12), transparent 60%)',
          }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 24 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 border border-[hsl(var(--kb-brand-500))/0.35] bg-[hsl(var(--kb-brand-500))/0.12] rounded-full px-4 py-1.5 text-[hsl(var(--kb-brand-400))] text-xs font-semibold tracking-wide">
              <Sparkles className="w-4 h-4" />
              Bangladesh&apos;s #1 Verified Student Marketplace
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
              <span className="gradient-text">কাজের বাজার</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
              Hire verified students, fund escrow safely, and ship micro-projects faster.
              A complete ecosystem for students to learn, prove skills, and earn.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="kb-btn-primary text-sm font-semibold px-7 py-3.5 rounded-xl inline-flex items-center gap-2">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="kb-btn-ghost text-sm font-semibold px-7 py-3.5 rounded-xl">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Users', value: 5200, suffix: '+', icon: Users },
            { label: 'Companies', value: 180, suffix: '+', icon: Building2 },
            { label: 'Projects', value: 640, suffix: '+', icon: Briefcase },
            { label: 'Verified Students', value: 1200, suffix: '+', icon: GraduationCap },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-white mt-2">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[hsl(var(--kb-brand-500))/0.12] border border-[hsl(var(--kb-brand-500))/0.3] flex items-center justify-center text-[hsl(var(--kb-brand-400))]">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            tag="How It Works"
            title="From sign-up to payday in 4 steps"
            subtitle="Whether you're a student looking to earn or a company looking to hire — the process is simple and transparent."
          />
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative glass rounded-2xl border border-white/10 p-6 text-center group hover:border-white/20 transition-colors"
              >
                <div className="text-4xl font-black text-white/5 absolute top-3 right-4">{item.step}</div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLATFORM FEATURES ══════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            tag="Platform Features"
            title="Smart, secure, and verified"
            subtitle="Everything you need to hire, collaborate, and pay with confidence."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={ShieldCheck}
              title="Escrow Protection"
              desc="Funds are locked before work starts and released only when milestones are approved. Zero risk for both parties."
              color="purple"
            />
            <FeatureCard
              icon={GraduationCap}
              title="Verified Student Profiles"
              desc="Every student is ID-verified with AI skill tests and a KaajerScore to prove credibility."
              color="blue"
            />
            <FeatureCard
              icon={Building2}
              title="Company Trust Layer"
              desc="Work only with verified companies and transparent project histories. Admin-vetted onboarding."
              color="green"
            />
            <FeatureCard
              icon={BookOpen}
              title="AI Learning Modules"
              desc="AI generates unique project briefs per skill. Students complete real-world tasks to earn verified skill badges."
              color="amber"
            />
            <FeatureCard
              icon={Award}
              title="Reputation & Badges"
              desc="Rising Star → Top Rated → Top Rated Plus. Unlock lower fees, priority matching, and premium perks as you grow."
              color="rose"
            />
            <FeatureCard
              icon={Lock}
              title="Secure Wallet System"
              desc="Earnings are tracked in a secure wallet. Withdraw to bKash, Nagad, or bank transfer anytime."
              color="cyan"
            />
          </div>
        </div>
      </section>

      {/* ══ LEARNING MODULES ═══════════════════════════════════════════════════ */}
      <section className="py-16 px-6 relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(600px 400px at 50% 30%, hsl(220 60% 30% / 0.5), transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <SectionHeader
            tag="Learning & Skill Verification"
            title="Prove your skills with AI-powered modules"
            subtitle="Pick a skill, get an AI-generated project brief, submit your work within the deadline, and earn a verified badge — reviewed by human admins."
          />

          {/* How learning works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl border border-white/10 p-6 mb-10"
          >
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[hsl(var(--kb-brand-400))]" /> How Learning Modules Work
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Target, label: 'Choose Skill & Level', detail: 'Pick from 5 categories × 3 difficulty levels (Rookie → Skilled → Expert).' },
                { icon: Zap, label: 'AI Generates Brief', detail: 'Grok AI creates a unique, real-world project brief every time — never the same project twice.' },
                { icon: Clock, label: 'Complete Within Deadline', detail: 'Rookie: 24h, Skilled: 48h, Expert: 72h. Upload your deliverables before time runs out.' },
                { icon: FileCheck, label: 'Admin Reviews & Verifies', detail: 'A human admin reviews your work. Pass = verified skill badge. Fail = feedback + retry (3 attempts max).' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4 text-[hsl(var(--kb-brand-400))]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Difficulty Levels */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid sm:grid-cols-3 gap-4 mb-10"
          >
            {[
              { level: 'Rookie', hours: '24', color: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-400', desc: 'Foundation-level tasks for beginners. Perfect for first-time freelancers.' },
              { level: 'Skilled', hours: '48', color: 'border-blue-500/30 bg-blue-500/5', text: 'text-blue-400', desc: 'Intermediate challenges that require deeper expertise and polished output.' },
              { level: 'Expert', hours: '72', color: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400', desc: 'Advanced, real-world complexity. Proves production-ready capability.' },
            ].map((lvl) => (
              <div key={lvl.level} className={`rounded-xl border p-5 ${lvl.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${lvl.text}`}>{lvl.level}</span>
                  <span className="text-xs text-slate-500">{lvl.hours}h deadline</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{lvl.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Skill categories */}
          <div className="space-y-3">
            {SKILL_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isOpen = expandedCategory === cat.name
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="glass rounded-xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCategory(isOpen ? null : cat.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{cat.name}</p>
                        <p className="text-xs text-slate-500">{cat.skills.length} skills · 3 levels each</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/8 px-4 py-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {cat.skills.map((skill) => (
                          <span key={skill} className="text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ BADGE TIERS ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            tag="Reputation System"
            title="Earn badges, unlock exclusive perks"
            subtitle="Your reputation grows as you verify skills, deliver projects, and receive great reviews. Each tier unlocks real financial and career benefits."
          />

          <div className="grid md:grid-cols-3 gap-6">
            {BADGE_TIERS.map((tier, idx) => {
              const Icon = tier.icon
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`relative rounded-2xl border overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tier.border} glass hover:${tier.glow}`}
                >
                  {/* Top gradient bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${tier.gradient}`} />

                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tier.bg}`}>
                      <Icon className={`w-6 h-6 ${tier.text}`} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                    <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

                    {/* Criteria */}
                    <div className="mb-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Requirements
                      </h4>
                      <ul className="space-y-2">
                        {tier.criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" /> Benefits
                      </h4>
                      <ul className="space-y-2">
                        {tier.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.text}`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ FOR STUDENTS vs FOR COMPANIES ═══════════════════════════════════ */}
      <section className="py-16 px-6 relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background: 'radial-gradient(500px 400px at 30% 50%, hsl(150 50% 25% / 0.5), transparent 70%), radial-gradient(500px 400px at 70% 50%, hsl(220 50% 30% / 0.5), transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <SectionHeader
            tag="Who Is It For?"
            title="Built for students and companies alike"
          />
          <div className="grid md:grid-cols-2 gap-6">
            {/* Students */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass rounded-2xl border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 mb-4">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">For Students</h3>
              <ul className="space-y-3">
                {[
                  'Verify skills through AI-powered learning modules',
                  'Build a portfolio with real micro-projects from companies',
                  'Earn money safely with escrow-protected payments',
                  'Climb the reputation ladder: Rising Star → Top Rated → Top Rated Plus',
                  'Track earnings, reviews, and KaajerScore on your dashboard',
                  'Get downloadable completion certificates for each project',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Companies */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 mb-4">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">For Companies</h3>
              <ul className="space-y-3">
                {[
                  'Post micro-projects and get applications from verified students',
                  'Filter by verified skills, KaajerScore, and badge tier',
                  'Pay safely with built-in escrow — release only when satisfied',
                  'Leave reviews and build long-term relationships with talent',
                  'Admin-vetted company onboarding for trust and transparency',
                  'Access rising talent before your competitors do',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            tag="FAQ"
            title="Frequently Asked Questions"
          />
          <div className="glass rounded-2xl border border-white/10 px-6">
            <FAQItem
              q="Is KaajerBazar free for students?"
              a="Yes! Signing up and verifying your skills is completely free. A small platform fee is only deducted when you earn money from a completed project."
            />
            <FAQItem
              q="How does the AI Learning Module work?"
              a="When you click 'Start Module,' our AI (powered by Groq) generates a unique, real-world project brief tailored to your chosen skill and difficulty level. You complete it within the deadline (24h–72h), upload your deliverables, and a human admin reviews your submission. Pass = verified skill badge on your profile."
            />
            <FAQItem
              q="What happens if I fail a module?"
              a="You get up to 3 attempts per module. If you fail, the admin provides detailed feedback on what to improve. After a cooldown period, you can try again with a brand-new AI-generated project."
            />
            <FAQItem
              q="How does escrow work?"
              a="When a company accepts your application, they deposit the project budget into escrow. The money is locked and visible to both parties. Once you deliver and the company approves, funds are released to your wallet."
            />
            <FAQItem
              q="How do I unlock the Top Rated Plus badge?"
              a="You need a 4.9+ client rating and total earnings of at least ৳500,000. Top Rated Plus members enjoy 0% platform fee on repeat clients, a dedicated account manager, and early access to enterprise features."
            />
            <FAQItem
              q="Can companies post projects for free?"
              a="Companies can sign up and post projects for free. The platform fee is built into the project budget structure and is transparent upfront."
            />
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="glass rounded-3xl border border-[hsl(var(--kb-brand-500))/0.3] p-10 md:p-14 relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(400px 300px at 50% 0%, hsl(42 92% 55% / 0.3), transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                Ready to start your journey?
              </h2>
              <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
                Join thousands of Bangladeshi students and companies already using KaajerBazar to build careers, ship projects, and grow together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="kb-btn-primary text-sm font-semibold px-8 py-3.5 rounded-xl inline-flex items-center gap-2">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="kb-btn-ghost text-sm font-semibold px-8 py-3.5 rounded-xl">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/8 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-white font-bold text-lg mb-1">কাজের বাজার</div>
            <p className="text-slate-500 text-xs">Bangladesh&apos;s student-startup micro-project marketplace.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center" aria-label="Footer navigation">
            <Link href="/register" className="text-slate-400 hover:text-white text-sm transition-colors">Register</Link>
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
