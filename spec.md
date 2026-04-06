# Internship Tracker — Phase 1: Core Foundation

## Current State
Fresh scaffold: empty Motoko actor, no frontend pages, no auth wired.

## Requested Changes (Diff)

### Add
- Role-based authorization: Admin and Intern roles
- User profile management: name, skills, bio, contact info
- Admin dashboard: overview stats (total interns, active projects, pending approvals)
- Intern dashboard: personal overview, status, assigned project summary
- Intern management page (Admin only): list all interns, view profiles, approve/reject registrations
- Project management (Admin): create and list internship projects with title, description, start/end date, status
- Project view (Intern): see assigned project details
- Registration flow: new users register as Interns, Admins approve them
- Navigation sidebar with role-aware links
- Profile settings page for both roles

### Modify
- Empty Motoko actor -> full backend with user/auth/project logic

### Remove
- Nothing (fresh project)

## Implementation Plan
1. Select `authorization` component for role-based access
2. Generate Motoko backend with:
   - User profiles (name, role, bio, skills, contact, status: pending/active/rejected)
   - Project records (title, description, dates, status, assigned interns)
   - Admin-only functions: approve/reject users, manage projects, assign interns
   - Intern functions: view own profile, view assigned project
3. Build frontend:
   - Login/landing page (Internet Identity)
   - Role-detection redirect after login
   - Admin dashboard with stats + sidebar nav
   - Intern dashboard with personal status + project summary
   - Intern management table (Admin)
   - Project list + create form (Admin)
   - Profile settings form (both roles)
   - Responsive layout with sidebar navigation
