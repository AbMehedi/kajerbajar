'use client'

// src/components/ui/EmptyState.jsx
// Centered empty state with icon, title, description, optional CTA.
// Replaces plain <p className="text-slate-500"> across all dashboards.
//
// Props:
//   icon         {string}  — emoji or single character
//   title        {string}
//   description  {string}
//   actionLabel  {string?}  — button/link text
//   actionHref   {string?}  — if provided renders <a>, else no action

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EmptyState({ icon = '📭', title, description, actionLabel, actionHref }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <p className="text-white font-semibold text-base mb-1">{title}</p>
      {description && (
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="kb-btn-primary text-sm px-5 py-2.5 rounded-lg font-semibold"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  )
}
