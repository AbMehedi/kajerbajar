// src/app/student/skill-test/page.jsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SkillVerification from "../dashboard/SkillVerification";
import SkillBadges from "../dashboard/SkillBadges";

export const metadata = {
  title: "Skill Verification — Student",
  description: "Get verified badges for your skills",
};

export default async function StudentSkillTest() {
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

  if (profile?.role !== "student") redirect("/unauthorized");

  const { data: verifications } = await supabase
    .from("skill_verifications")
    .select("id, skill_category, status, ai_brief, submission_text, submission_file_url, submitted_at, admin_feedback, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ""}
      activePath="/student/skill-test"
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Skill Verification</h1>
          <p className="text-slate-400 text-sm">
            Complete AI-generated briefs to earn verified badges and boost your KaajerScore.
          </p>
        </div>

        {/* Skill Badges Overview */}
        <div className="mb-8">
          <SkillBadges verifications={verifications ?? []} />
        </div>

        {/* Skill Verification Form/Queue */}
        <div className="glass rounded-xl overflow-hidden">
          <SkillVerification initialVerifications={verifications ?? []} />
        </div>
      </div>
    </DashboardShell>
  );
}
