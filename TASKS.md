# KaajerBazar (কাজের বাজার) - Project Roadmap & Task List

KaajerBazar is a premier student-startup micro-project marketplace in Bangladesh. This document tracks the development progress and upcoming tasks.

## 🏗️ Project Overview

- **Goal:** Connect university students with startups for micro-projects.
- **Tech Stack:** Next.js (App Router), Supabase (Auth, DB, Storage), Tailwind CSS, Shadcn UI.
- **Key Features:** Role-based dashboards, AI-assisted skill verification, Secure Escrow system, Automated certification.

---

## 🛤️ Development Phases

### Phase 1: Foundation & Authentication 🟢 (Completed)

_Goal: Establish the core infrastructure and secure access._

- [x] **Project Initialization**: Next.js, Tailwind, and Shadcn UI setup.
- [x] **Database Schema**: Comprehensive Postgres schema in Supabase (Users, Profiles, Projects, Escrow).
- [x] **Authentication Flow**: Login and Registration with role selection (Student/Company).
- [x] **Role-Based Access Control**: Middleware implementation to guard `/student`, `/company`, and `/admin` routes.
- [x] **Landing Page**: Premium hero section and feature overview.
- [x] **Dashboard Skeletons**: Basic layouts for all three user roles.

### Phase 2: Skill Verification & AI Integration 🟢 (Completed)

_Goal: Allow students to prove their expertise using AI-driven verification._

- [x] **Student Profile Completion**: `/student/profile/edit` page + `GET/POST /api/student/profile` API to update university, bio, graduation year, and portfolio URL.
- [x] **Skill Submission UI**: `SkillVerification.jsx` — students request an AI brief, then submit work via drag-and-drop file upload (ZIP, PDF, etc., up to 50 MB) and/or text description.
- [x] **File Upload Infrastructure**: Supabase `skill-submissions` bucket + signed upload URLs via `GET /api/skills/verify/upload-url`. Files go browser → Storage directly (no server bottleneck).
- [x] **AI Verification Logic**: `POST /api/skills/verify/start` calls Groq (Llama 3) to generate a 2-hour tailored project brief per skill. Fallback brief if AI is unavailable.
- [x] **Admin Verification Queue**: `SkillReviewQueue.jsx` — admins expand each submission to see the AI brief, student description, download attached files (signed 60s URL), and Approve / Request Revision / Reject.
- [x] **Skills Display**: `SkillBadges.jsx` — approved verifications render as green skill badges on the student dashboard.
- [x] **Badge Granting**: On Admin Approve, a record is upserted to the `badges` table via the service-role client.

### Phase 3: Project Marketplace 🟢 (Completed)

_Goal: Enable companies to post work and students to apply._

- [x] **Project Posting Flow**: Company interface to create projects with budget, duration, and required skills. (`POST /api/projects`)
- [x] **Project Discovery**: Student view to browse and filter open projects. (`/student/projects`)
- [x] **AI-Powered Matching**: Calculate "Match Score" between student skills and project requirements. (`calculateMatchScore` in `ai.js`, stored in `applications`)
- [x] **Application System**: Students can apply with cover notes; companies can review and select candidates. (`/api/applications` and `/api/company/applications`)

### Phase 4: Escrow & Project Execution ⚪ (Upcoming)

_Goal: Secure payments and manage active work._

- [ ] **Escrow Deposit**: Companies deposit funds into the platform ledger before work starts.
- [ ] **Active Workspace**: A shared view for students and companies to track project progress.
- [ ] **Milestone Submission**: Student submits deliverables for company review.
- [ ] **Payment Release**: Logic to transfer funds from Escrow to Student Wallet upon approval.

### Phase 5: Certification & Reputation ⚪ (Upcoming)

_Goal: Build long-term value for students._

- [ ] **Automated Certificates**: Generate PDF certificates for successfully completed projects.
- [ ] **KaajerScore Algorithm**: Reputation system based on completion rate, reviews, and skill levels.
- [ ] **Review System**: Mutual reviews between students and companies after project completion.

### Phase 6: Final Polish & Launch ⚪ (Upcoming)

_Goal: Final refinements for production readiness._

- [ ] **Real-time Notifications**: In-app and email alerts for applications and payments.
- [ ] **Messaging System**: Basic chat between students and companies for active projects.
- [ ] **SEO & Performance**: Metadata optimization and image compression.
- [ ] **Deployment**: Production setup on Vercel.

---

## 🛠️ Current Task List (Phase 3 Focus)

| Task ID | Description                                          | Status | Priority |
| :------ | :--------------------------------------------------- | :----- | :------- |
| T001    | ~~Student Profile Edit page~~                        | ✅ Done | —        |
| T002    | ~~Supabase Storage for Skill Files~~                 | ✅ Done | —        |
| T003    | ~~Admin Skill Review Dashboard~~                     | ✅ Done | —        |
| T004    | ~~AI Brief Generation (Groq/Llama 3)~~               | ✅ Done | —        |
| T005    | ~~Company: Project Creation Form~~                   | ✅ Done | —        |
| T006    | ~~Student: Project Discovery & Browse page~~         | ✅ Done | —        |
| T007.1  | ~~Implement `calculateMatchScore` in `ai.js`~~       | ✅ Done | —        |
| T007.2  | ~~Integrate AI scoring into `POST /api/applications`~~| ✅ Done | —        |
| T007.3  | ~~Display Match Score in Company `ApplicationsPanel`~~| ✅ Done | —        |
| T008    | ~~Application System (student apply, company select)~~ | ✅ Done | —        |

---

> [!NOTE]
> **Phase 3 is fully complete.** Marketplace features (posting, discovery, AI matching) are verified. Admin queues are restored and bypass RLS constraints for stability. Next: **Phase 4 — Escrow & Project Execution**.
