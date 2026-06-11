'use client'

// src/components/ui/StatCard.jsx
// Reusable stat card with icon, glow border, Framer Motion hover.
// Used by student, company, and admin dashboards.
//
// Props:
//   icon       {ReactNode}   — lucide-react icon element
//   label      {string}
//   value      {string|number}
//   unit       {string}       — optional suffix, e.g. "/ 100"
//   color      {'purple'|'blue'|'green'|'orange'|'amber'}

import { motion } from 'framer-motion'

const COLOR_MAP = {
  purple: {
    border:  'border-purple-500/30',
    icon:    'bg-purple-500/15 text-purple-400',
    glow:    '0 0 20px hsl(267 84% 61% / 0.18)',
    value:   'text-white',
  },
  blue: {
    border:  'border-blue-500/30',
    icon:    'bg-blue-500/15 text-blue-400',
    glow:    '0 0 20px hsl(217 91% 60% / 0.18)',
    value:   'text-white',
  },
  green: {
    border:  'border-green-500/30',
    icon:    'bg-green-500/15 text-green-400',
    glow:    '0 0 20px hsl(142 71% 45% / 0.18)',
    value:   'text-white',
  },
  orange: {
    border:  'border-orange-500/30',
    icon:    'bg-orange-500/15 text-orange-400',
    glow:    '0 0 20px hsl(24 95% 53% / 0.18)',
    value:   'text-white',
  },
  amber: {
    border:  'border-amber-500/30',
    icon:    'bg-amber-500/15 text-amber-400',
    glow:    '0 0 20px hsl(38 92% 50% / 0.18)',
    value:   'text-white',
  },
}

export default function StatCard({ icon, label, value, unit = '', color = 'purple' }) {
  const styles = COLOR_MAP[color] ?? COLOR_MAP.purple

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: styles.glow }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass rounded-xl p-5 border ${styles.border} flex flex-col gap-3`}
    >
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.icon}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className={`text-2xl font-bold ${styles.value}`}>
          {value}
          {unit && <span className="text-slate-500 text-sm font-normal ml-1">{unit}</span>}
        </p>
      </div>
    </motion.div>
  )
}
