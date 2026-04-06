# Internship Tracker -- Phase 2

## Current State
- Phase 1 is live with Internet Identity login, Admin/User roles, registration workflow, admin dashboard (stats, interns, projects), intern portal (dashboard, my projects, profile)
- Intern approval/reject actions exist in the UI but are stubs -- they show a toast saying "coming in a future phase"
- Projects exist with assignedInterns field, but the admin UI has no assign/unassign UI
- No activity/commit tracking exists
- No messaging feature exists
- Backend has: user profiles, projects, RBAC, registration approval/rejection by principal

## Requested Changes (Diff)

### Add
- **Intern approval with principal lookup**: Fix InternsPage so approve/reject/promote buttons actually work. The backend already supports `approveInternRegistration(principal)` and `rejectInternRegistration(principal)`. We need to store principal alongside user profiles so the admin can act on them. Currently `View__1` has no principal field -- backend needs a `principal` field added to the view.
- **Project-to-intern assignment UI**: In ProjectsPage, add an "Assign Interns" button/dialog for each project that lists active interns (with checkboxes) and calls `assignInternToProject`/`unassignInternFromProject`.
- **Commit/activity tracking**: Interns can log work entries (title, description, date, hours) against their assigned projects. Admins can view all activity. Backend needs new `ActivityLog` type and CRUD.
- **Messaging/chat**: Simple thread-based messaging between admin and interns. Messages have sender, recipient, content, timestamp. Backend needs `Message` type and send/receive functions.

### Modify
- `main.mo`: Add `principal` field to `UserProfile.View`, add `ActivityLog` type + CRUD, add `Message` type + send/read functions
- `InternsPage.tsx`: Wire up approve/reject/promote with actual principal from the intern record
- `ProjectsPage.tsx`: Add intern assignment dialog
- `AdminShell.tsx`: Add Messages nav item
- `InternShell.tsx`: Add Activity Log and Messages nav items

### Remove
- Stub toast messages in InternsPage for approve/reject/promote

## Implementation Plan
1. Update backend `main.mo`:
   - Add `principal` field to `UserProfile.View` so frontend can pass it to approve/reject/promote
   - Add `ActivityLog` type: `{id, internPrincipal, projectId, title, description, date, hours, createdAt}`
   - Add `logActivity`, `getActivitiesForIntern`, `getActivitiesForProject`, `getAllActivities` functions
   - Add `Message` type: `{id, sender, recipient, content, timestamp, read}`
   - Add `sendMessage`, `getMessagesForCaller`, `getConversation`, `markMessageRead` functions
2. Update frontend:
   - `InternsPage.tsx`: Replace stub handlers with real principal-based approve/reject/promote calls
   - `ProjectsPage.tsx`: Add assign intern dialog with active intern list + checkboxes
   - New `ActivityLogPage.tsx` (intern): Form to log work entries, list of own logs per project
   - New `AdminActivityPage.tsx` (admin): View all activity logs across all interns/projects
   - New `MessagesPage.tsx` (shared): Conversation list + message thread UI, works for both admin and intern
   - Update `AdminShell.tsx` and `InternShell.tsx` to include new pages
