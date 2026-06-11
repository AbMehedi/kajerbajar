'use client'

// src/components/layout/MobileSidebarDrawer.jsx
// Slide-in mobile sidebar drawer.

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import LogoutButton from '@/components/LogoutButton'

export default function MobileSidebarDrawer({
  isOpen,
  onClose,
  navItems,
  roleLabel,
  roleBadgeClass,
  fullName,
  avatarUrl,
  initials,
  activePath,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-50 w-[var(--kb-sidebar-width)] border-r border-white/10 bg-[hsl(var(--kb-surface-900))]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          >
            <div className="flex h-full flex-col px-4 py-6">
              <div className="mb-6">
                <div className="text-lg font-semibold text-white">কাজের বাজার</div>
                <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] ${roleBadgeClass}`}>
                  {roleLabel}
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activePath
                    ? activePath === item.href || activePath.startsWith(`${item.href}/`)
                    : false
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ` +
                        (isActive
                          ? 'border-l-2 border-[hsl(var(--kb-brand-500))] bg-[hsl(var(--kb-brand-500))/0.12] text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white')
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--kb-brand-500))] to-[hsl(var(--kb-brand-700))] text-sm font-semibold text-white flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-white">
                      {fullName || 'Kaajer User'}
                    </div>
                    <div className="text-xs text-slate-400">{roleLabel}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
