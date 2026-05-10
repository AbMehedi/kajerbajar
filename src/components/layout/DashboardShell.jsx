'use client'

// src/components/layout/DashboardShell.jsx
// Shared dashboard layout shell with sidebar + mobile drawer.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  Briefcase,
  Users,
  GraduationCap,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import MobileSidebarDrawer from './MobileSidebarDrawer'

const NAV_ITEMS = {
  student: [
    { href: '/student/dashboard',  label: 'Dashboard',      icon: Home           },
    { href: '/student/projects',   label: 'Browse Projects', icon: Search         },
    { href: '/student/skill-test', label: 'Skill Tests',     icon: GraduationCap  },
  ],
  company: [
    { href: '/company/dashboard',    label: 'Dashboard',   icon: Home     },
    { href: '/company/projects/new', label: 'Post Project', icon: Briefcase },
  ],
  admin: [
    { href: '/admin/dashboard',        label: 'Dashboard',     icon: Home        },
    { href: '/admin/skill-test-queue', label: 'Skill Queue',   icon: ShieldCheck  },
    { href: '/admin/company-queue',    label: 'Company Queue', icon: Building2    },
  ],
}

const ROLE_BADGE_STYLES = {
  student: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  company: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  admin: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
}

const sidebarVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

function getInitials(name) {
  const safeName = name?.trim()
  if (!safeName) return 'K'
  const parts = safeName.split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'K'
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export default function DashboardShell({ children, role, fullName, activePath }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = useMemo(() => NAV_ITEMS[role] ?? [], [role])
  const roleLabel = role ? role.toUpperCase() : 'USER'
  const roleBadgeClass = ROLE_BADGE_STYLES[role] ?? 'border-white/20 text-slate-300 bg-white/5'
  const initials = getInitials(fullName)

  return (
    <div className="min-h-screen bg-[hsl(var(--kb-surface-900))] text-white">
      <MobileSidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={navItems}
        roleLabel={roleLabel}
        roleBadgeClass={roleBadgeClass}
        fullName={fullName}
        initials={initials}
        activePath={activePath}
      />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--kb-surface-900))]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            Menu
          </button>
          <span className="text-sm font-semibold">কাজের বাজার</span>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-500/80 text-xs font-semibold text-white flex items-center justify-center">
            {initials}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 border-r border-white/10 glass"
        style={{ width: 'var(--kb-sidebar-width)' }}
      >
        <div className="flex h-full w-full flex-col px-4 py-6">
          <div className="mb-6">
            <div className="text-lg font-semibold text-white">কাজের বাজার</div>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${roleBadgeClass}`}>
              <Users className="h-3 w-3" />
              {roleLabel}
            </div>
          </div>

          <motion.div variants={sidebarVariants} initial="hidden" animate="show" className="flex-1">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activePath
                  ? activePath === item.href || activePath.startsWith(`${item.href}/`)
                  : false
                return (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      className={
                        `group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ` +
                        (isActive
                          ? 'border-l-2 border-purple-500 bg-purple-500/10 text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white')
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-500/80 text-sm font-semibold text-white flex items-center justify-center">
                {initials}
              </div>
              <div>
                <div className="text-sm text-white">{fullName || 'Kaajer User'}</div>
                <div className="text-xs text-slate-400">{roleLabel}</div>
              </div>
            </div>
            <div className="mt-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content — padding is owned by each page's own wrapper */}
      <main className="min-h-screen md:pl-[var(--kb-sidebar-width)]">
        {children}
      </main>
    </div>
  )
}
