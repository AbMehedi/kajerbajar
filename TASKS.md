# KaajerBazar (কাজের বাজার) - Project Roadmap & Task List

KaajerBazar is a premier student-startup micro-project marketplace in Bangladesh. This document tracks the development progress of each feature phase and specifies remaining tasks.

---

## 🏗️ Project Status Summary

*   **Total Progress:** ~95% Complete.
*   **Completed Phases:** Phase 1, Phase 2, Phase 3, Phase 4, and Phase 5 are fully complete. Core features are developed, and related integration APIs are successfully tested.
*   **Current Phase:** Phase 6 (Final Polish & Launch readiness) is underway, with most backend integrations (Notifications, Emails, Milestones) completed.
*   **Documentation:** Detailed system specifications and schema catalogs are documented in the system documentation.

---

## 🛤️ Development Phases Progress

### Phase 1: Foundation & Authentication 🟢 (Completed)
*Goal: Establish core user models, secure access controls, and basic dashboards.*
*   [x] **Project Setup:** Next.js, Tailwind, and Shadcn UI setup.
*   [x] **Database Schema:** Users, student profiles, and company profiles creation.
*   [x] **Auth Flows:** Credentials login/registration + Google login callback hooks.
*   [x] **RBAC Middleware:** Guarding pages `/student`, `/company`, `/admin` using the middleware controller.
*   [x] **Dashboards:** Role-specific shells and navigation layout.

### Phase 2: Learning Modules & Automated Reputation 🟢 (Completed)
*Goal: Enable students to prove expertise using AI-generated mini-projects and automate reputation tiers.*
*   [x] **Profile Setup:** Student profile editing, including bio, portfolio URL, and university mapping.
*   [x] **AI Brief Generator:** Dynamic, story-based briefs generated using the Grok API.
*   [x] **Submission Lifecycle:** Submitting briefs, uploading files to private buckets, and automatic cooldown rules (24-hour lock on failure, 7-day lockout on 3 failed attempts).
*   [x] **Review Interface:** Admin queue to pass/fail submissions and provide textual feedback.
*   [x] **Badge Automation:** Instant evaluation of earnings and reviews to assign badges automatically.

### Phase 3: Project Marketplace 🟢 (Completed)
*Goal: Allow companies to list work and match with qualified students.*
*   [x] **Posting Flows:** Company UI to create projects with budgets, durations, and skills requirements.
*   [x] **Match Score:** Calculating similarity matches based on verified student skills.
*   [x] **Project Search:** Student discovery interface to browse, filter, and apply for projects.
*   [x] **Applicant Queue:** Company view to review submissions, inspect student badges, and hire candidates.

### Phase 4: Escrow & Workspace Execution 🟢 (Completed)
*Goal: Secure payments and coordinate workspace tasks.*
*   [x] **Escrow Deposits:** Virtual platforms to deposit funds before project initiation.
*   [x] **Milestone Management:** Real-time milestone tracker UI and APIs inside the workspace.
*   [x] **Deliverables Pipeline:** Student uploads, file storage, and status verification.
*   [x] **Funds Release:** Releasing funds to student wallets on approval, with a 10% platform commission deduction.

### Phase 5: Communication, Certification & Reputation 🟢 (Completed)
*Goal: Enhance collaboration, double-blind review fairness, and completion awards.*
*   [x] **Workspace Chat:** Instant real-time messaging using WebSockets.
*   [x] **Double-Blind Reviews:** Ratings and comments remain hidden until both parties review each other.
*   [x] **KaajerScore Overhaul:** Reputation formula calculation (30% skills, 50% ratings, 20% completion).
*   [x] **Automated Certificates:** PDF certificate generation on-the-fly inside the certificate API endpoint.

### Phase 6: Final Polish & Launch 🔄 (In Progress)
*Goal: Production refinements, mobile responsiveness, and deployment.*
*   [x] **In-App Notifications (T6.1):** Real-time bell dropdown in dashboard headers via the notifications dropdown.
*   [x] **Email Alerts (T6.2):** Automated transaction mailers via Resend.
*   [x] **SEO & Metadata (T6.3):** Meta headers configured on all main routes.
*   [x] **Project Progress Tracking (T6.6):** Project workflow and timeline stages visually complete.
*   [x] **Home Page Redesign (T6.7):** Clean landing layout presenting user stories.
*   [ ] **Mobile Responsiveness (T6.4):** Conduct responsive visual audits on workspace cards, dashboard layout grids, and forms.
*   [ ] **Production Deployment (T6.5):** Deploy project on Vercel, run schema scripts, configure env secrets, and execute E2E smoke tests.

---

## 📋 Detailed Task List (Phase 6 Focus)

| Task ID | Component / Area | Description | Priority | Status |
|:---|:---|:---|:---|:---|
| **T6.1** | Notifications | Real-time in-app bell dropdown & counter | High | ✅ Done |
| **T6.2** | Emails | Transactional mailers on status updates (Resend integration) | Med | ✅ Done |
| **T6.3** | SEO / Performance | Configured site-wide layout and page-level metadata headers | Med | ✅ Done |
| **T6.4** | Responsiveness | Audit layouts across mobile/tablet views (Dashboards, Workspace, Forms) | Med | ⚪ Todo |
| **T6.5** | Deployment | Launch live on Vercel, set env variables, and verify database tables | High | ⚪ Todo |
| **T6.6** | Milestones | Project workspace tracking and progress milestones | High | ✅ Done |
| **T6.7** | Landing Page | Polish home layout for desktop and mobile views | Med | ✅ Done |

---

## 🚀 Step-by-Step Launch Plan

### 1. Mobile Responsiveness Visual Audit (T6.4)
*   **Dashboard grids:** Inspect the student, company, and admin dashboards on simulated mobile screen dimensions. Ensure grid columns wrap nicely.
*   **Workspace layouts:** Verify that chat messages, deliverable forms, and milestone components remain usable and don't introduce horizontal scroll.
*   **Forms UI:** Ensure inputs and button sizes are touch-friendly.

### 2. Live Vercel Deployment (T6.5)
*   **GitHub Integration:** Connect the repository to Vercel.
*   **Secret Keys Configuration:** Copy all keys into Vercel settings:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `GROQ_API_KEY`
    *   `RESEND_API_KEY` (if live mailers are desired)
    *   `NEXT_PUBLIC_APP_URL`
*   **Supabase Schema Verification:** Verify that all SQL scripts have been run on the production database.
*   **Storage Buckets:** Verify that the three storage buckets are initialized as private buckets, and that storage RLS rules are applied.
