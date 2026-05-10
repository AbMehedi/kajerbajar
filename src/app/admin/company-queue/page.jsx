// src/app/admin/company-queue/page.jsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import CompanyVerificationQueue from "../dashboard/CompanyVerificationQueue";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = {
  title: "Company Queue — Admin",
};

export default async function AdminCompanyQueue() {
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

  const { data: pendingCompanies } = await supabase
    .from("company_profiles")
    .select(`
      id,
      legal_name,
      industry,
      website,
      trade_license_url,
      verification_status,
      license_uploaded_at,
      users_profiles!inner (
        email,
        full_name
      )
    `)
    .eq("verification_status", "pending")
    .order("license_uploaded_at", { ascending: true });

  return (
    <DashboardShell
      role="admin"
      fullName={profile?.full_name ?? ""}
      activePath="/admin/company-queue"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Company Verification Queue</h1>
          <p className="text-slate-400 text-sm">Review pending trade licenses for SMEs</p>
        </div>

        {pendingCompanies && pendingCompanies.length > 0 ? (
          <CompanyVerificationQueue companies={pendingCompanies} />
        ) : (
          <div className="glass rounded-xl">
            <EmptyState
              icon="🏢"
              title="No pending companies"
              description="The verification queue is currently empty."
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
