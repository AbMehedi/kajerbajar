// src/app/student/dashboard/page.jsx
// D1: Student dashboard — consolidated with Profile and Certificates

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/layout/DashboardShell";
import StatCard from "@/components/ui/StatCard";
import { Target, Wallet, GraduationCap, ArrowRight, FlaskConical, Award, User, BookOpen, Search } from "lucide-react";
import Link from "next/link";
import ProjectHistoryClient from "./ProjectHistoryClient";
import CertificatesSection from "./CertificatesSection";

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
    { data: reviews },
    { data: myReviews },
    { data: certificates },
    { data: verifiedSkills },
    { data: studentBadge },
  ] = await Promise.all([
    supabase
      .from("users_profiles")
      .select("full_name, role, email, avatar_url")
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

    // New: verified skills from the Learning Module system
    supabase
      .from("verified_skills")
      .select("id, skill_name, skill_category, level, earned_at")
      .eq("student_id", user.id)
      .order("earned_at", { ascending: false }),

    // New: active marketplace badge (if any)
    supabase
      .from("student_badges")
      .select("badge_type, is_active")
      .eq("student_id", user.id)
      .eq("is_active", true)
      .order("awarded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Resilient fetch for new columns in case of PGRST204 (stale schema cache)
  let about_text = null;
  let portfolio_url = null;
  try {
    const { data: extraData, error: extraError } = await supabase
      .from("student_profiles")
      .select("about_text, portfolio_url")
      .eq("id", user.id)
      .single();
    if (!extraError && extraData) {
      about_text = extraData.about_text;
      portfolio_url = extraData.portfolio_url;
    }
  } catch (e) {
    console.log("Could not fetch new student_profile columns:", e);
  }

  // Merge extra data
  if (studentProfile) {
    studentProfile.about_text = about_text;
    studentProfile.portfolio_url = portfolio_url;
  };

  if (profile?.role !== "student") redirect("/unauthorized");

  const completedProjects = myApplications?.filter(a => a.status === 'selected' && a.projects?.status === 'completed') || [];
  const completedCount = completedProjects.length;
  const feedbackCount = reviews?.length || 0;
  
  const unlockedProjectIds = new Set(myReviews?.map(r => r.project_id) || [])

  // Verified skills helpers
  const skills = verifiedSkills ?? []
  const LEVEL_COLORS = {
    rookie:  'bg-green-500/15 text-green-300 border-green-500/30',
    skilled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    expert:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }
  const BADGE_LABELS = {
    rising_talent:   { label: '🌟 Rising Star',    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    top_rated:       { label: '⭐ Top Rated',        color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    top_rated_plus:  { label: '🏆 Top Rated Plus',  color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  }
  const activeBadge = studentBadge ?? null

  return (
    <DashboardShell avatarUrl={profile?.avatar_url}
      role="student"
      fullName={profile?.full_name ?? ""}
      activePath="/student/dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
          <div className="flex items-start gap-5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-purple-500/20 shrink-0 border border-white/10" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20 shrink-0">
                {profile?.full_name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-bold text-white">{profile?.full_name}</h1>
                {activeBadge && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${BADGE_LABELS[activeBadge.badge_type]?.color ?? 'bg-white/10 text-white border-white/20'}`}>
                    {BADGE_LABELS[activeBadge.badge_type]?.label ?? activeBadge.badge_type}
                  </span>
                )}
              </div>
              <p className="text-purple-400 font-medium">@{studentProfile?.username}</p>
              <p className="text-slate-400 text-sm mt-1">{studentProfile?.university ?? 'No university added'}</p>

              {studentProfile?.bio && (
                <p className="text-slate-300 text-sm mt-4 max-w-2xl leading-relaxed">
                  {studentProfile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0 md:absolute right-0 top-0 items-end">
            <Link href="/student/profile/edit" className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-colors">
              Edit Profile
            </Link>
            {studentProfile?.portfolio_url && (
              <a href={studentProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-white/20 hover:bg-white/5 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Portfolio
              </a>
            )}
          </div>
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
            href="/student/learn"
            className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-purple-500/40 transition-colors group"
          >
            <div>
              <p className="text-white font-semibold text-sm">Learn & Verify</p>
              <p className="text-slate-500 text-xs mt-0.5">Earn verified skill badges</p>
            </div>
            <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
          <Link
            href="/search"
            className="glass rounded-xl p-5 flex items-center justify-between border border-white/10 hover:border-purple-500/40 transition-colors group"
          >
            <div>
              <p className="text-white font-semibold text-sm">Directory Search</p>
              <p className="text-slate-500 text-xs mt-0.5">Find peers & companies</p>
            </div>
            <Search className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>

        {/* ── Verified Skills Section ── */}
        <div className="glass rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Verified Skills
              {skills.length > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-normal">
                  {skills.length}
                </span>
              )}
            </h2>
            <Link href="/student/learn" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Go to Learn →
            </Link>
          </div>
          {skills.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No verified skills yet.</p>
              <Link href="/student/learn" className="text-purple-400 text-sm hover:underline mt-1 inline-block">
                Start a learning module →
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
                    LEVEL_COLORS[s.level] ?? 'bg-white/10 text-white border-white/20'
                  }`}
                >
                  {s.skill_name}
                  <span className="opacity-60 text-xs capitalize">— {s.level}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── New Dashboard Cards: Learning Module ── */}
        <div className="grid grid-cols-1 gap-4">
          {/* Card 1: Learning Module Quick Access */}
          <Link href="/student/learn" className="glass rounded-xl border border-white/10 hover:border-purple-500/40 p-5 transition-colors group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Learning Modules</h3>
                <p className="text-slate-500 text-sm">
                  <span className="text-white font-bold">{skills.length}</span> verified skills
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>

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

          <CertificatesSection
            certificates={certificates ?? []}
            completedProjects={completedProjects}
          />
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
