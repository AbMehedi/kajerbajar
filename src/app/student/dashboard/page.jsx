// src/app/student/dashboard/page.jsx
// D1: Student dashboard — upgraded with icon StatCards, quick actions, applications table.

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import SkillBadges from "./SkillBadges";
import DashboardShell from "@/components/layout/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { Target, Wallet, GraduationCap, ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";

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

  // ⚡ Run all independent DB queries in parallel
  const [
    { data: profile },
    { data: studentProfile },
    { data: myApplications },
    { data: verifications },
  ] = await Promise.all([
    supabase
      .from("users_profiles")
      .select("full_name, role, email")
      .eq("id", user.id)
      .single(),

    supabase
      .from("student_profiles")
      .select("username, university, kaajerscore, wallet_balance")
      .eq("id", user.id)
      .single(),

    supabase
      .from("applications")
      .select("id, status, created_at, projects ( title )")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("skill_verifications")
      .select("id, skill_category, status, ai_brief, submission_text, submission_file_url, submitted_at, admin_feedback, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profile?.role !== "student") redirect("/unauthorized");

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ""}
      activePath="/student/dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm">
            @{studentProfile?.username}
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="KaajerScore"
            value={(studentProfile?.kaajerscore ?? 0).toFixed(1)}
            unit="/ 100"
            color="purple"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Wallet Balance"
            value={`৳${(studentProfile?.wallet_balance ?? 0).toFixed(2)}`}
            color="green"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="University"
            value={studentProfile?.university ?? "—"}
            color="blue"
          />
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/student/projects"
            className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-purple-500/40 transition-colors group"
          >
            <div>
              <p className="text-white font-semibold text-sm">Browse Projects</p>
              <p className="text-slate-500 text-xs mt-0.5">Find your next gig</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
          <Link
            href="/student/skill-test"
            className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-purple-500/40 transition-colors group"
          >
            <div>
              <p className="text-white font-semibold text-sm">Submit a Skill</p>
              <p className="text-slate-500 text-xs mt-0.5">Get a verified badge</p>
            </div>
            <FlaskConical className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>

        {/* ── Skill Badges ── */}
        <SkillBadges verifications={verifications ?? []} />

        {/* ── Bottom section ── */}
        <div className="mt-6">
          {/* My Applications */}
          <div className="glass rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">📁 My Applications</h3>
              <Link
                href="/student/projects"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Browse →
              </Link>
            </div>

            {!myApplications || myApplications.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No applications yet"
                description="Browse open projects and apply to get started."
                actionLabel="Browse Projects"
                actionHref="/student/projects"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-white/8">
                      <th className="text-left pb-2 font-medium">Project</th>
                      <th className="text-left pb-2 font-medium">Date</th>
                      <th className="text-right pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myApplications.map((app) => (
                      <tr key={app.id} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="text-slate-200 font-medium truncate max-w-[140px]">
                            {app.projects?.title ?? "Unknown Project"}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short",
                          })}
                        </td>
                        <td className="py-2.5 text-right">
                          <ApplicationStatusBadge status={app.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Application status badge ───────────────────────────────────────────────────

function ApplicationStatusBadge({ status }) {
  const styles = {
    pending:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    selected: "bg-green-500/15 text-green-400 border-green-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const labels = {
    pending:  "Pending",
    selected: "Selected ✓",
    rejected: "Rejected",
  };
  const cls = styles[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}
