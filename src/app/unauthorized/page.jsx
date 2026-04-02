// src/app/unauthorized/page.jsx
// Member B owns this file.
// Shown when a logged-in user visits a route that belongs to a different role.
// Uses .gradient-brand from globals.css — change page bg colour there.

export const metadata = {
  title: 'Unauthorized — KaajerBazar',
}

export default function UnauthorizedPage() {
  return (
    <div className="gradient-brand min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8 max-w-sm text-balance">
          You don&apos;t have permission to view this page. Make sure you&apos;re signed in with the correct account type.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/login"
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Go to Login
          </a>
          <a
            href="/"
            className="glass text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  )
}
