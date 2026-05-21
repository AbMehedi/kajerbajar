// src/app/student/dashboard/page.jsx
// D1: Student dashboard — consolidated with Profile and Certificates

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import SkillBadges from "./SkillBadges";
import DashboardShell from "@/components/layout/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { Target, Wallet, GraduationCap, ArrowRight, FlaskConical, Award, ShieldCheck, Download, User } from "lucide-react";
import Link from "next/link";
import ProjectHistoryClient from "./ProjectHistoryClient";

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

  const [
    { data: profile },
    { data: studentProfile },
    { data: myApplications },
    { data: verifications },
    { data: reviews },
    { data: myReviews },
    { data: certificates },
  ] = await Promise.all([
    supabase
      .from("users_profiles")
      .select("full_name, role, email")
      .eq("id", user.id)
      .single(),

    supabase
      .from("student_profiles")
      .select("username, university, kaajerscore, wallet_balance, bio")
      .eq("id", user.id)
      .single(),

    supabase
      .from("applications")
      .select("id, status, created_at, projects ( id, title, status, budget_bdt, company_profiles ( legal_name ) )")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("skill_verifications")
      .select("id, skill_category, status, ai_brief, submission_text, submission_file_url, submitted_at, admin_feedback, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
      
    supabase
      .from("project_reviews")
      .select("project_id, rating, comment, created_at, reviewer:users_profiles!reviewer_id(full_name)")
      .eq("reviewee_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("project_reviews")
      .select("project_id")
      .eq("reviewer_id", user.id),

    supabase
      .from("certificates")
      .select("id, project_id, issued_at")
      .eq("student_id", user.id),
  ]);

  if (profile?.role !== "student") redirect("/unauthorized");

  const completedProjects = myApplications?.filter(a => a.status === 'selected' && a.projects?.status === 'completed') || [];
  const completedCount = completedProjects.length;
  const feedbackCount = reviews?.length || 0;
  
  const unlockedProjectIds = new Set(myReviews?.map(r => r.project_id) || [])

  return (
    <DashboardShell
      role="student"
      fullName={profile?.full_name ?? ""}
      activePath="/student/dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20 shrink-0">
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{profile?.full_name}</h1>
              <p className="text-purple-400 font-medium">@{studentProfile?.username}</p>
              <p className="text-slate-400 text-sm mt-1">{studentProfile?.university ?? 'No university added'}</p>

              {studentProfile?.bio && (
                <p className="text-slate-300 text-sm mt-4 max-w-2xl leading-relaxed">
                  {studentProfile.bio}
                </p>
              )}
            </div>
          </div>

          <Link href="/student/profile/edit" className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors md:absolute right-0 top-0">
            Edit Profile
          </Link>
        </div>

        {/* ── About Me ── */}
        {studentProfile?.about_text && (
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl max-w-full">
            <h3 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" /> About Me
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {studentProfile.about_text}
            </p>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="KaajerScore"
            value={
              studentProfile?.kaajerscore !== null && studentProfile?.kaajerscore !== undefined
                ? studentProfile.kaajerscore.toFixed(1)
                : 'No score yet'
            }
            unit={
              studentProfile?.kaajerscore !== null && studentProfile?.kaajerscore !== undefined
                ? '/ 100'
                : ''
            }
            color="purple"
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Total Income"
            value={`৳${(studentProfile?.wallet_balance ?? 0).toFixed(0)}`}
            color="green"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="Jobs Completed"
            value={completedCount.toString()}
            color="blue"
          />
          <StatCard
            icon={<FlaskConical className="w-5 h-5" />}
            label="Feedback Received"
            value={feedbackCount.toString()}
            color="yellow"
          />
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Link
            href="/search"
            className="glass rounded-xl p-5 flex flex-col justify-center border border-white/10 hover:border-purple-500/40 transition-colors group"
          >
            <p className="text-white font-semibold text-sm">Directory Search</p>
            <p className="text-slate-500 text-xs mt-0.5">Find peers & companies</p>
          </Link>
        </div>

        {/* ── Skill Badges ── */}
        <SkillBadges verifications={verifications ?? []} />

        {/* ── Certificates ── */}
        <div className="glass rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Earned Certificates</h2>
              <p className="text-slate-400 text-sm">Verified completion certificates</p>
            </div>
          </div>

          {(!certificates || certificates.length === 0) ? (
            <div className="text-center py-10 border border-white/5 rounded-xl bg-white/5">
              <Award className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-white font-medium">No certificates yet.</p>
              <p className="text-slate-400 text-sm mt-1">Complete projects to earn certificates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => {
                const project = completedProjects.find(p => p.projects?.id === cert.project_id)?.projects
                const projectTitle = project?.title || 'Unknown Project'
                const displayId = `KB-${cert.id.slice(0, 8).toUpperCase()}`
                
                return (
                  <div key={cert.id} className="border border-white/10 bg-white/4 rounded-xl p-5 hover:bg-white/5 transition-colors">
                    <h3 className="text-white font-semibold mb-1 truncate" title={projectTitle}>{projectTitle}</h3>
                    <p className="text-slate-400 text-xs mb-3">
                      Issued: {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-slate-500 text-xs font-mono bg-white/5 px-2 py-1 rounded inline-block mb-4 border border-white/10">
                      ID: {displayId}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                      <a 
                        href={`/api/projects/${cert.project_id}/certificate`} 
                        download
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                      <Link 
                        href={`/verify-certificate?id=${cert.id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Verify
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Project History Search ── */}
        <ProjectHistoryClient 
          applications={myApplications ?? []} 
          reviews={reviews ?? []}
          unlockedProjectIds={unlockedProjectIds}
        />

      </div>
    </DashboardShell>
  );
}
