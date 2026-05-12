// src/app/admin/skill-test-queue/page.jsx
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase-server";
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

  // Use admin client (service role) to bypass RLS — the skill_verifications admin
  // RLS policy requires migration_003 which may not have been applied yet.
  const adminSupabase = await createAdminSupabaseClient();

  const { data: pendingSkills, error: skillsError } = await adminSupabase
    .from("skill_verifications")
    .select(`
      id,
      skill_category,
      status,
      ai_brief,
      submission_text,
      submission_file_url,
      created_at,
      student_id,
      student_profiles (
        username,
        university,
        users_profiles ( full_name, email )
      )
    `)
    // Exclude already-reviewed records; require submission content.
    .not("status", "in", '("approved","rejected","revision_requested")')
    .or("submission_text.not.is.null,submission_file_url.not.is.null")
    .order("created_at", { ascending: true });

  if (skillsError) {
    console.error("[admin/skill-test-queue] DB error:", skillsError);
  }


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
