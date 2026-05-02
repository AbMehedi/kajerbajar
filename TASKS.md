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

### Phase 2: Skill Verification & AI Integration 🟡 (In Progress)

_Goal: Allow students to prove their expertise using AI-driven verification._

- [ ] **Student Profile Completion**: Extend registration to collect university, skills, and bio.
- [ ] **Skill Submission UI**: Interface for students to submit proofs (text/files) for verification.
- [ ] **AI Verification Logic**: Integration with LLM to generate verification briefs and match submissions.
- [ ] **Admin Verification Queue**: A dashboard for admins to approve/reject skill verification requests.
- [ ] **Skills Display**: Show verified badges on student dashboards.

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

## 🛠️ Current Task List

| Task ID | Description                                   | Status | Priority |
| :------ | :-------------------------------------------- | :----- | :------- |
| T001    | Implement Student Profile Edit/Complete page  | To Do  | High     |
| T002    | Set up Supabase Storage for Skill Proofs      | To Do  | High     |
| T003    | Build Admin Skill Review Dashboard            | To Do  | Medium   |
| T004    | Integrate AI API for Skill Matching           | To Do  | Medium   |
| T005    | Implement Project Creation Form for Companies | To Do  | High     |

---

> [!NOTE]
> This plan follows the Extreme Programming (XP) principles with iterative updates. Each phase will be refined as development progresses.
