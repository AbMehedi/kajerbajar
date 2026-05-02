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

### Phase 3: Project Marketplace ⚪ (Upcoming)

_Goal: Enable companies to post work and students to apply._

- [ ] **Project Posting Flow**: Company interface to create projects with budget, duration, and required skills.
- [ ] **Project Discovery**: Student view to browse and filter open projects.
- [ ] **AI-Powered Matching**: Calculate "Match Score" between student skills and project requirements.
- [ ] **Application System**: Students can apply with cover notes; companies can review and select candidates.

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
| T005    | Company: Project Creation Form                       | To Do  | High     |
| T006    | Student: Project Discovery & Browse page             | To Do  | High     |
| T007    | AI Match Score between student skills & project      | To Do  | Medium   |
| T008    | Application System (student apply, company select)   | To Do  | High     |

---

> [!NOTE]
> **Phase 2 is fully complete.** Next up is Phase 3 — the Project Marketplace. Start with T005 (Company Project Creation).
