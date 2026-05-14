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

### Phase 4: Escrow & Project Execution 🟢 (Completed)

_Goal: Secure payments and manage active work._

- [x] **Database Setup**: Create `project_deliverables` table and `project-deliverables` storage bucket.
- [x] **Escrow Deposit**: Companies deposit funds into the platform ledger before work starts. (`POST /api/projects/[id]/start`)
- [x] **Student Workspace Hub**: Project list page grouped by status + per-project workspace. (`/student/workspace`, `/student/workspace/[id]`)
- [x] **Company Workspace Hub**: Project list page grouped by status + per-project workspace. (`/company/workspace`, `/company/workspace/[id]`)
- [x] **Payment Release**: Logic to transfer funds from Escrow to Student Wallet upon approval. (`POST /api/projects/[id]/release`)

### Phase 5: Communication, Certification & Reputation ⏳ (Current Phase)

_Goal: Build long-term value for students and facilitate project collaboration._

- [x] **Workspace Messaging**: Real-time chat between students and companies inside project workspaces.
- [x] **Review System**: Mutual double-blind 1-5 star reviews between students and companies upon payment release.
- [x] **KaajerScore Profile Integration**: Display the average star rating and reviews on the student's profile.
- [ ] **Automated Certificates**: Generate PDF certificates for successfully completed projects.

### Phase 6: Final Polish & Launch ⚪ (Upcoming)

_Goal: Final refinements for production readiness._

- [ ] **Real-time Notifications**: In-app and email alerts for applications and payments.
- [ ] **SEO & Performance**: Metadata optimization and image compression.
- [ ] **Deployment**: Production setup on Vercel.

---

## 🛠️ Current Task List (Phase 5 Focus)

| Task ID | Description                                          | Status | Priority |
| :------ | :--------------------------------------------------- | :----- | :------- |
| T5.1    | Database Migration (`project_reviews`, `chat_messages`) | ✅ Done | High     |
| T5.2    | Workspace Chat API (`/api/projects/[id]/chat`)       | ✅ Done | High     |
| T5.3    | Workspace Chat UI (Supabase Realtime integration)    | ✅ Done | High     |
| T5.4    | Double-Blind Review API (`/api/projects/[id]/review`)| ✅ Done | High     |
| T5.5    | Workspace Review Form & UI Enforcement               | ✅ Done | High     |
| T5.6    | Student Profile: KaajerScore & Archive display       | ✅ Done | Med      |
| T5.7    | Automated Certificates generation (PDF)              | ⚪ Todo | Med      |

---

> [!NOTE]
> **Currently working on Phase 5** — Wrapping up the final Phase 5 feature: Automated PDF Certificates for completed projects.
