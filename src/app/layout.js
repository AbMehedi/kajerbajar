/**
 * layout.js  (Root Layout)
 * ============================================================
 * PURPOSE:
 *   This is the single wrapper that wraps EVERY page in the app.
 *   Think of it as the "picture frame" — it stays the same while
 *   the page content ({children}) changes on each navigation.
 *
 * WHAT GOES HERE:
 *   ✅ HTML <head> metadata (title, description, Open Graph)
 *   ✅ Global font loading
 *   ✅ Global stylesheet import
 *   ✅ Components that appear on every page (e.g. Toaster)
 *
 * WHAT DOES NOT GO HERE:
 *   ❌ Navigation bar — that's in each role's own layout
 *      (student, company, admin each have their own layout.js)
 *   ❌ Page-specific data fetching
 *   ❌ Client-only logic — this file runs on the SERVER
 *
 * XP NOTE:
 *   We load fonts here once instead of per-page to avoid
 *   layout shift (FOUT). Font variables are passed to <body>
 *   so any CSS can use var(--font-sans) or var(--font-mono).
 * ============================================================
 */

import localFont from 'next/font/local'
import './globals.css'
import DevQuickLogin from '@/components/DevQuickLogin'

/* ── Fonts ─────────────────────────────────────────────────────
 * Geist is Vercel's clean, modern font family.
 * variable: '--font-sans' / '--font-mono' → used in globals.css
 * weight: '100 900' means the variable font covers all weights.
 */
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',       // referenced in globals.css html { font-family: var(--font-sans) }
  weight: '100 900',
  display: 'swap',               // prevent invisible text during font load
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',       // use in code blocks / monospace spots
  weight: '100 900',
  display: 'swap',
})

/* ── Site-wide Metadata ─────────────────────────────────────────
 * Next.js reads this object and injects <title> and <meta> tags.
 * Each page can OVERRIDE these by exporting its own `metadata`.
 * See: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata = {
  title: {
    default: 'KaajerBazar — কাজের বাজার',
    // Page-level metadata can use template: 'Page Name | KaajerBazar'
    template: '%s | KaajerBazar',
  },
  description:
    'A micro-project marketplace connecting Bangladeshi university students with startups.',
  keywords: ['freelance', 'Bangladesh', 'students', 'projects', 'marketplace', 'kaajerbazar'],
  openGraph: {
    title: 'KaajerBazar — কাজের বাজার',
    description: 'Bangladesh\'s student-startup micro-project marketplace.',
    type: 'website',
  },
}

/* ── Root Layout Component ──────────────────────────────────────
 * {children} = whatever page the user is currently on.
 * We apply both font CSS variables to <body> so they cascade
 * down to every element.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <DevQuickLogin />

        {/*
         * 🔔 FUTURE: Add <Toaster /> here in Phase 2 when we need
         * global toast notifications (e.g. "Skill submitted!").
         * Example: import { Toaster } from '@/components/ui/toaster'
         */}
      </body>
    </html>
  )
}
