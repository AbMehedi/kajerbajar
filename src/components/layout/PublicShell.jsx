'use client'

// src/components/layout/PublicShell.jsx
// A minimal public-facing header/layout for pages accessible to everyone
// (profile pages, verify-certificate, search directory).

import Link from 'next/link'
import { Search, ShieldCheck } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function PublicShell({ children, activePath }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--kb-surface-900))] text-[hsl(var(--kb-text-primary))]">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--kb-border))] bg-[hsl(var(--kb-surface-900))]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="text-[hsl(var(--kb-text-primary))] font-bold text-base tracking-tight hover:text-[hsl(var(--kb-brand-400))] transition-colors">
            কাজের বাজার
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-2">
            <Link
              href="/search"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePath === '/search'
                  ? 'bg-[hsl(var(--kb-brand-500))/0.14] text-[hsl(var(--kb-brand-400))]'
                  : 'text-[hsl(var(--kb-text-secondary))] hover:text-[hsl(var(--kb-text-primary))] hover:bg-[hsl(var(--kb-surface-700))]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Directory
            </Link>
            <Link
              href="/verify-certificate"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePath === '/verify-certificate'
                  ? 'bg-[hsl(var(--kb-brand-500))/0.14] text-[hsl(var(--kb-brand-400))]'
                  : 'text-[hsl(var(--kb-text-secondary))] hover:text-[hsl(var(--kb-text-primary))] hover:bg-[hsl(var(--kb-surface-700))]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Cert
            </Link>
            
            <div className="ml-1 flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className="kb-btn-primary text-sm px-3.5 py-1.5 rounded-lg">
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
