// src/app/student/dashboard/page.jsx
// Member B owns this file.
// Uses .gradient-brand and .glass from globals.css — change colours there, not here.

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Student Dashboard — KaajerBazar",
  description: "Your KaajerBazar student workspace",
};

export default async function StudentDashboard() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/unauthorized");

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("username, university, kaajerscore, wallet_balance")
    .eq("id", user.id)
    .single();

  // Story 3.2: Fetch latest 5 applications for this student (joined with project title)
  const { data: myApplications } = await supabase
    .from("applications")
    .select("id, status, created_at, projects ( title )")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="gradient-brand min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">কাজের বাজার</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{profile?.full_name}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {profile?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          @{studentProfile?.username}
        </p>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="KaajerScore"
            value={(studentProfile?.kaajerscore ?? 0).toFixed(1)}
            unit="/ 100"
          />
          <StatCard
            label="Wallet Balance"
            value={`৳${(studentProfile?.wallet_balance ?? 0).toFixed(2)}`}
          />
          <StatCard
            label="University"
            value={studentProfile?.university ?? "—"}
          />
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlaceholderCard
            title="✅ Verified Skills"
            body="Your verified skills will appear here after Phase 2."
          />

          {/* Story 3.2: My Applications (real data) */}
          <div className="glass rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">📁 My Applications</h3>
              <a
                href="/student/projects"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Browse Projects →
              </a>
            </div>

            {!myApplications || myApplications.length === 0 ? (
              <p className="text-slate-500 text-sm">
                You haven&apos;t applied to any projects yet.{" "}
                <a href="/student/projects" className="text-purple-400 hover:underline">
                  Browse open projects
                </a>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {myApplications.map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <p className="text-slate-200 text-sm font-medium truncate min-w-0">
                      {app.projects?.title ?? "Unknown Project"}
                    </p>
                    <ApplicationStatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, unit = "" }) {
  return (
    <div className="glass rounded-xl p-5">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">
        {value}
        {unit && <span className="text-slate-500 text-sm ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function PlaceholderCard({ title, body }) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-slate-500 text-sm">{body}</p>
    </div>
  );
}

// Client component for logout (must be inline or extracted to a separate file)
// For Phase 1 simplicity, we use a form action pattern
function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
      >
        Logout
      </button>
    </form>
  );
}

// Story 3.2: Colour-coded badge for application status
function ApplicationStatusBadge({ status }) {
  const styles = {
    pending:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    selected: 'bg-green-500/15 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels = {
    pending:  'Pending',
    selected: 'Selected ✓',
    rejected: 'Rejected',
  }
  const cls = styles[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  return (
    <span
      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
