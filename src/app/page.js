'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { GraduationCap, Building2, ShieldCheck, ArrowRight, ChevronDown, Briefcase, Wallet } from 'lucide-react'

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
    purple: { border: 'hover:border-purple-500/60 hover:shadow-purple-500/10', icon: 'text-purple-400 bg-purple-500/10', bar: 'from-purple-500/60' },
    blue:   { border: 'hover:border-blue-500/60   hover:shadow-blue-500/10',   icon: 'text-blue-400   bg-blue-500/10',   bar: 'from-blue-500/60'   },
    green:  { border: 'hover:border-green-500/60  hover:shadow-green-500/10',  icon: 'text-green-400  bg-green-500/10',  bar: 'from-green-500/60'  },
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

// ── How it works step ─────────────────────────────────────────────────────────
function HowItStep({ icon: Icon, step, title, desc, color, isLast }) {
  const styles = {
    purple: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    blue:   'border-blue-500/40   bg-blue-500/10   text-blue-400',
    green:  'border-green-500/40  bg-green-500/10  text-green-400',
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55 }}
      className="relative flex flex-col items-center text-center px-4"
    >
      <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${styles}`}>
        <Icon className="w-7 h-7" />
      </div>
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] border-t-2 border-dashed border-white/10" />
      )}
      <div className={`text-xs font-bold tracking-widest uppercase mb-1 ${styles.split(' ')[2]}`}>Step {step}</div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-[180px]">{desc}</p>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const mounted = useMounted()

  return (
    <div className="gradient-brand min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ══ SECTION 1: HERO ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        {/* Floating orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(267 84% 61%) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(267 84% 61%) 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <span 
              className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 rounded-full px-4 py-1.5 text-purple-300 text-xs font-semibold tracking-wide mb-8"
              style={{ boxShadow: 'var(--kb-glow-sm)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              ✨ Beta · Phase 3 Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 24 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
          >
            কাজের <span className="gradient-text">বাজার</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 24 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed"
          >
            Bangladesh&apos;s premier platform connecting{' '}
            <span className="text-white font-medium">verified university students</span>{' '}
            with SME micro-projects — safely, transparently, and fast.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/register" 
              className="kb-btn-primary text-sm font-semibold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="kb-btn-ghost text-sm font-semibold px-7 py-3.5 rounded-xl cursor-pointer"
            >
              Sign In
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        {mounted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ══ SECTION 2: STATS BAR ═════════════════════════════════════════════ */}
      <section className="border-y border-white/8 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: 500, prefix: '',  suffix: '+',      label: 'Students Registered' },
            { value: 120, prefix: '',  suffix: '+',      label: 'Projects Posted'     },
            { value: 2,   prefix: '৳', suffix: 'M+ Paid', label: 'Earned by Students' },
          ].map(({ value, prefix, suffix, label }) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-1">
              <div className="text-3xl font-extrabold text-white">
                <AnimatedCounter target={value} prefix={prefix} suffix={suffix} />
              </div>
              <div className="text-slate-500 text-sm">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 3: HOW IT WORKS ══════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-16">
            <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">How KaajerBazar Works</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              From sign-up to earning money — the whole journey in three steps.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4 relative">
            <HowItStep icon={ShieldCheck} step={1} title="Register & Verify"   desc="Create an account, verify your student ID and submit skill proofs to earn badges."         color="purple" />
            <HowItStep icon={Briefcase}  step={2} title="Browse & Apply"       desc="Browse open micro-projects from verified SMEs and apply with your verified skill badges." color="blue"   />
            <HowItStep icon={Wallet}     step={3} title="Complete & Get Paid"  desc="Finish the project in the shared workspace and release escrow payment instantly."          color="green" isLast />
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: FEATURES ══════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold mb-3">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Built for Bangladesh</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard icon={GraduationCap} title="For Students"      desc="Build a verified portfolio of real-world projects before graduation. Your KaajerScore follows you to every job application." color="purple" />
            <FeatureCard icon={Building2}     title="For Startups & SMEs" desc="Access top university talent for quick, affordable micro-projects. All students are ID-verified and skill-tested."       color="blue"   />
            <FeatureCard icon={ShieldCheck}   title="Secure Escrow"     desc="Funds held safely until work is approved. No disputes, no hidden fees — just a clean 10% platform commission."             color="green"  />
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: FOOTER ════════════════════════════════════════════════ */}
      <footer className="border-t border-white/8 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-white font-bold text-lg mb-1">কাজের বাজার</div>
            <p className="text-slate-500 text-xs">Bangladesh&apos;s student-startup micro-project marketplace.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center" aria-label="Footer navigation">
            <Link href="/register" className="text-slate-400 hover:text-white text-sm transition-colors">Register</Link>
            <Link href="/login"    className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>© 2025 KaajerBazar · All rights reserved.</span>
          <span>Made with ❤️ in Bangladesh 🇧🇩</span>
        </div>
      </footer>
    </div>
  )
}
