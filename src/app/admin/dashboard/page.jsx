// src/app/admin/dashboard/page.jsx
// D3: Admin dashboard — icon StatCards + Framer Motion stagger + SectionHeader.

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import AdminStatCards from "./AdminStatCards";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — KaajerBazar",
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

  // Fetch only counts for the stat cards
  const [
    { count: studentCount },
    { count: companyCount },
    { count: pendingVerifCount },
    { count: pendingCompanyCount },
  ] = await Promise.all([
    supabase.from("student_profiles").select("*", { count: "exact", head: true }),
    supabase.from("company_profiles").select("*", { count: "exact", head: true }),
    supabase.from("skill_verifications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("company_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
  ]);

  const stats = [
    { iconName: "users",    label: "Total Students",     value: studentCount ?? 0,      color: "purple" },
    { iconName: "building", label: "Total Companies",    value: companyCount ?? 0,      color: "blue"   },
    { iconName: "clock",    label: "Pending Skills",     value: pendingVerifCount ?? 0, color: "amber"  },
    { iconName: "alert",    label: "Pending Companies",  value: pendingCompanyCount ?? 0, color: "orange" },
  ]

  return (
    <DashboardShell
      role="admin"
      fullName={profile?.full_name ?? ""}
      activePath="/admin/dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Platform overview and moderation queue</p>
        </div>

        {/* ── Animated stat cards (client component for Framer Motion) ── */}
        <AdminStatCards stats={stats} />

        {/* ── Quick actions ── */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/company-queue"
              className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-amber-500/40 transition-colors group"
            >
              <div>
                <p className="text-white font-semibold text-sm">Company Queue</p>
                <p className="text-slate-500 text-xs mt-0.5">Review pending trade licenses</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
            <Link
              href="/admin/skill-test-queue"
              className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-amber-500/40 transition-colors group"
            >
              <div>
                <p className="text-white font-semibold text-sm">Skill Verification Queue</p>
                <p className="text-slate-500 text-xs mt-0.5">Review student submissions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
