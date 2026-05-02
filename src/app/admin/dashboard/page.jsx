// src/app/admin/dashboard/page.jsx
// Story 1.2: Admin dashboard with company verification queue
// Uses .gradient-brand and .glass from globals.css

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CompanyVerificationQueue from "./CompanyVerificationQueue";
import SkillReviewQueue from "./SkillReviewQueue";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Admin Dashboard",
};

// Colour classes for stat cards
const STAT_COLORS = {
  students: "border-purple-500/30 text-purple-300",
  companies: "border-blue-500/30   text-blue-300",
  pending: "border-yellow-500/30 text-yellow-300",
  pendingCompanies: "border-orange-500/30 text-orange-300",
};

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/unauthorized");

  // Fetch all stats in parallel
  const [
    { count: studentCount },
    { count: companyCount },
    { count: pendingVerifCount },
    { count: pendingCompanyCount },
    { data: pendingCompanies },
    { data: pendingSkills },
  ] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("company_profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("skill_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("company_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    // Pending companies for company queue
    supabase
      .from("company_profiles")
      .select(
        "id, legal_name, industry, trade_license_url, license_uploaded_at",
      )
      .eq("verification_status", "pending")
      .order("license_uploaded_at", { ascending: true }),
    // Pending skill submissions for skill queue
    supabase
      .from("skill_verifications")
      .select(
        `
        id, skill_category, status, ai_brief, submission_text, submitted_at, created_at, student_id,
        users_profiles!skill_verifications_student_id_fkey (full_name, email),
        student_profiles!skill_verifications_student_id_fkey (username, university)
      `,
      )
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true }),
  ]);

  return (
    <div className="gradient-brand min-h-screen">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-bold text-lg">KaajerBazar Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm font-medium">
            {profile?.full_name}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>

        {/* Live stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={studentCount ?? 0}
            colorKey="students"
          />
          <StatCard
            label="Total Companies"
            value={companyCount ?? 0}
            colorKey="companies"
          />
          <StatCard
            label="Pending Skills"
            value={pendingVerifCount ?? 0}
            colorKey="pending"
          />
          <StatCard
            label="Pending Companies"
            value={pendingCompanyCount ?? 0}
            colorKey="pendingCompanies"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            Company Verification Queue (Story 1.2)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            🏢 Company Verification Queue
          </h2>

          {pendingCompanies && pendingCompanies.length > 0 ? (
            <CompanyVerificationQueue companies={pendingCompanies} />
          ) : (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-slate-400">
                No companies pending verification
              </p>
            </div>
          )}
        </div>

        {/* Skill Review Queue - Phase 2 */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            🔍 Skill Verification Queue
          </h2>
          <SkillReviewQueue submissions={pendingSkills ?? []} />
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, colorKey }) {
  return (
    <div className={`glass rounded-xl p-5 border ${STAT_COLORS[colorKey]}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  );
}
