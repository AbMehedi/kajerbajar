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
} from 'lucide-react'

// ── Mounted guard — prevents SSR opacity:0 hydration freeze ───────────────────
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

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }) {
  const styles = {
    purple: { border: 'hover:border-[hsl(var(--kb-brand-500))/0.6] hover:shadow-[0_20px_60px_-30px_hsl(var(--kb-brand-500)/0.45)]', icon: 'text-[hsl(var(--kb-brand-400))] bg-[hsl(var(--kb-brand-500))/0.12]', bar: 'from-[hsl(var(--kb-brand-500))/0.7]' },
    blue:   { border: 'hover:border-white/20 hover:shadow-[0_20px_60px_-30px_rgba(255,255,255,0.15)]', icon: 'text-slate-200 bg-white/6', bar: 'from-white/30' },
    green:  { border: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10', icon: 'text-emerald-300 bg-emerald-500/10', bar: 'from-emerald-500/60' },
  }[color]

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const mounted = useMounted()

  return (
    <div className="gradient-brand min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
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
              Verified student marketplace
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
              <span className="gradient-text">কাজের বাজার</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
              Hire verified students, fund escrow safely, and ship micro-projects faster.
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

      {/* ══ STATS ═══════════════════════════════════════════════════════════ */}
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

      {/* ══ FEATURES ═══════════════════════════════════════════════════════ */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs text-[hsl(var(--kb-brand-400))] uppercase tracking-widest font-semibold mb-2">Features</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Smart, secure, and verified</h2>
            <p className="text-slate-400 text-sm mt-2">Everything you need to hire, collaborate, and pay with confidence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={ShieldCheck}
              title="Escrow protection"
              desc="Funds are locked before work starts and released only when milestones are approved."
              color="purple"
            />
            <FeatureCard
              icon={GraduationCap}
              title="Verified student profiles"
              desc="Every student is ID-verified with skill tests and a KaajerScore to prove credibility."
              color="blue"
            />
            <FeatureCard
              icon={Building2}
              title="Company trust layer"
              desc="Work only with verified companies and transparent project histories."
              color="green"
            />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
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
