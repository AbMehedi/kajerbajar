// src/app/admin/skill-test-queue/page.jsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SkillReviewQueue from "../dashboard/SkillReviewQueue";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = {
  title: "Skill Queue — Admin",
};

export default async function AdminSkillQueue() {
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

  const { data: pendingSkills } = await supabase
    .from("skill_verifications")
    .select(`
      id,
      skill_category,
      status,
      ai_brief,
      submission_text,
      submission_file_url,
      submitted_at,
      created_at,
      student_id,
      users_profiles!skill_verifications_student_id_fkey (full_name, email),
      student_profiles!skill_verifications_student_id_fkey (username, university)
    `)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  return (
    <DashboardShell
      role="admin"
      fullName={profile?.full_name ?? ""}
      activePath="/admin/skill-test-queue"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Skill Verification Queue</h1>
          <p className="text-slate-400 text-sm">Review student submissions and award skill badges</p>
        </div>

        {pendingSkills && pendingSkills.length > 0 ? (
          <SkillReviewQueue submissions={pendingSkills} />
        ) : (
          <div className="glass rounded-xl">
            <EmptyState
              icon="🔍"
              title="No pending skills"
              description="The skill verification queue is currently empty."
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
