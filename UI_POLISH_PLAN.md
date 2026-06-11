# KaajerBazar UI Polish & Feature Enhancement Plan

This document outlines the detailed layout, data fetching, and component design specifications to polish the KaajerBazar platform across Student, Company, and Admin portals.

---

## 1. Database Schema Additions
To support detailed profile sections and a centralized certificate lookup system, we will perform the following database updates:
1. **Student Profiles**: Add `about_text TEXT` to `student_profiles` to support a rich "About Me" description.
2. **Certificates Logging**: Ensure that whenever a project transition to `completed` happens, a record is added to the `certificates` table:
   ```sql
   INSERT INTO certificates (id, project_id, student_id, issued_at)
   VALUES (gen_random_uuid(), :project_id, :student_id, NOW());
   ```

---

## 2. Student Portal Enhancements

### 2.1 Dashboard Stats & Quick Info
- **Stats Cards**:
  - **KaajerScore**: Extracted from `student_profiles.kaajerscore`.
  - **Total Income**: Calculated by fetching sum of payouts from all completed selected projects.
  - **Total Project Completed**: Count of projects assigned to this student with status `completed`.
  - **Total Feedback Get**: Count of reviews written by companies for this student in `project_reviews`.
- **Certificates list**: Render a list of all completed project certificates. Each certificate item displays the **Project Title**, **Completion Date**, and its **Unique Certificate ID** (which is clickable, opening a window/modal or `/verify-certificate?id=KB-XYZ`).

### 2.2 Profile Customization & Edit Form
- **My Profile Display**:
  - Renders: Profile Picture (Avatar), Name, Username, Bio, University, Skill Badges, and About section.
  - Lists completed project history, feedback comments, and issued certificates.
- **Edit Profile Page (`/student/profile/edit`)**:
  - Full-featured form to update:
    - Full Name (updates `users_profiles.full_name`)
    - Avatar URL / Image Upload (updates `users_profiles.avatar_url`)
    - University & Graduation Year (updates `student_profiles.university`, `graduation_year`)
    - Bio & Detailed About Text (updates `student_profiles.bio`, `about_text`)
    - Skills (updates `student_profiles.skills`)

### 2.3 Directory Search & Navigation
- **Public Profile View**:
  - Public route `/profile/student/[id]` allows other users (Companies, Students, Admins) to view a student's public stats, University, Skill Badges, KaajerScore, completed projects count, feedback list, and certificates list.
- **Directory Search Page (`/search`)**:
  - Fully filterable index accessible to both student and company portals.
  - Search other students by skills, name, or university. Sorted by `kaajerscore` descending.
  - Search companies by name or industry. Displays verified badge status and ratings.

---

## 3. Company Portal Enhancements

### 3.1 Dashboard Layout
- **Stats Cards**:
  - Company Legal Name & Logo/Picture
  - Username
  - Total Projects Completed (status `completed` projects)
  - Total Feedbacks Got (reviews written by students for this company)
  - Average Rating (calculated from student ratings of this company)
- **Trade License Verification Widget**: Displays the 3-step timeline (not_submitted, pending, verified, rejected) and re-upload option if rejected.

### 3.2 Manage Applicants
- **List of Projects**: Shows all open and active company projects.
- **Applicants Sorting**:
  - Clicking a project displays all applicant cards.
  - Sorts applicants automatically by their `kaajerscore` (descending).
  - Displays a visual preview of each applicant (University, badges, KaajerScore) and links to their public profile `/profile/student/[id]` in a new tab.

### 3.3 Workspace Setup
- Allows locking escrow, initiating active workspace, using the chat interface, and providing feedback upon completion.

---

## 4. Certificate Verification Module

### 4.1 Search Interface (`/verify-certificate`)
- A public, unauthenticated search page.
- Input box: Users can paste a Certificate ID (e.g. `KB-E32D4B` or the full UUID).
- On Query Submit:
  - Fetches and verifies the record against `certificates`, joining `projects`, `student_profiles`, and `company_profiles`.
  - Renders a visually premium **VERIFIED** badge or a **NOT FOUND** warning.
  - Displays:
    - **Holder Name** (linking to Student's public profile)
    - **Project Name & Budget**
    - **Company Name**
    - **Date of Issuance**

### 4.2 Sidebar Navigation
- Adds a **Verify Certificate** navigation item (with `ShieldCheck` icon) to the sidebar configuration for all logged-in roles (Student, Company, Admin).
