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
          <PlaceholderCard
            title="📁 Active Projects"
            body="Your active projects will appear here after Phase 3."
          />
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
