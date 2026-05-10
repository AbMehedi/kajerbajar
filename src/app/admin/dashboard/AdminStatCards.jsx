'use client'

// src/app/admin/dashboard/AdminStatCards.jsx
// Client wrapper for animated stat cards on the admin dashboard.
// Admin page.jsx is a Server Component, so Framer Motion stagger lives here.

import { motion } from 'framer-motion'
import StatCard from '@/components/ui/StatCard'
import { Users, Building2, Clock, AlertCircle } from 'lucide-react'

const ICON_MAP = {
  users: Users,
  building: Building2,
  clock: Clock,
  alert: AlertCircle,
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function AdminStatCards({ stats }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map(({ iconName, label, value, color }) => {
        const Icon = ICON_MAP[iconName] || AlertCircle
        return (
          <motion.div key={label} variants={cardVariants}>
            <StatCard
              icon={<Icon className="w-5 h-5" />}
              label={label}
              value={value}
              color={color}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
