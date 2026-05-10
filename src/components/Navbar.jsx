// src/components/Navbar.jsx
// Public navigation bar for marketing/auth pages only.

import Link from 'next/link'

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
]

export default function Navbar() {
  return (
    <nav className="glass border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="text-white font-bold text-lg">
          কাজের বাজার
        </Link>

        {/* Public nav links */}
        <div className="hidden md:flex items-center gap-6">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative text-slate-300 hover:text-white text-sm transition-colors"
            >
              <span>{link.label}</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-purple-400 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        {/* Auth controls */}
        <div className="flex items-center gap-3">
          <Link
            id="navbar-login"
            href="/login"
            className="kb-btn-ghost text-sm"
          >
            Sign In
          </Link>
          <Link
            id="navbar-register"
            href="/register"
            className="kb-btn-primary text-sm"
          >
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  )
}
