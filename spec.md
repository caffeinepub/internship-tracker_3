# Internship Tracker — Phase 5

## Current State

Phase 4 is live with:
- Admin Reports page: per-intern performance summary, printable via `window.print()`
- Calendar page: milestone due dates and activity entries on a monthly grid
- Timeline/Gantt page: color-coded project bars with milestone markers and today line
- All prior features (auth, dashboards, projects, intern management, activity log, messaging, analytics, milestones, notifications) are fully operational

Backend functions:
- Milestones: `createMilestone`, `updateMilestoneStatus`, `getMilestonesForIntern`, `getMilestonesForProject`, `getAllMilestones`
- Interns/Projects/Activities: existing full read/write coverage

Intern shell has 5 nav items: Dashboard, My Projects, Activity Log, Messages, Profile.
Admin shell has 11 nav items including Reports.

## Requested Changes (Diff)

### Add
1. **Intern self-service: milestone progress updates**
   - Already partially exists in `MyProjectPage.tsx` (`MilestoneSection` allows status updates)
   - Enhance: add a dedicated **My Milestones** page in the intern shell that lists ALL their milestones across all projects in one place, with inline status update (pending → inProgress → completed)
   - Add to intern nav as "Milestones" (CheckSquare icon)

2. **Intern self-service: request project extension**
   - New backend function: `requestProjectExtension(projectId: Nat, reason: Text, requestedEndDate: Text) → ExtensionRequest.View`
   - New backend function: `getExtensionRequestsForIntern(intern: Principal) → [ExtensionRequest.View]`
   - New backend function: `getAllExtensionRequests() → [ExtensionRequest.View]` (admin-only)
   - New backend function: `respondToExtensionRequest(requestId: Nat, approved: Bool, adminNote: ?Text) → ()` (admin-only; if approved, updates project endDate)
   - Intern UI: on "My Projects" page, add a "Request Extension" button on each project card; opens a dialog with reason text + requested end date
   - Admin UI: new **Extension Requests** page in admin shell (after Reports) listing all pending/approved/rejected requests with approve/reject actions
   - Notifications: send notification to intern when their extension request is responded to

3. **Bulk CSV export of all intern reports (admin)**
   - On the existing Admin Reports page, add a "Export All as CSV" button (in addition to the existing per-intern print)
   - Fetches all interns + their projects, milestones, and activities client-side
   - Generates a CSV file with one row per intern containing: Name, Email, Total Hours, Activity Count, Project Count, Milestone Completion Rate, Project Titles (comma-separated), Latest Activity Date
   - Triggers browser download of `intern-reports.csv`

### Modify
- `InternShell.tsx`: add "Milestones" nav item (CheckSquare icon, page key `milestones`)
- `AdminShell.tsx`: add "Extensions" nav item (CalendarClock icon) after Reports
- `App.tsx`: register new pages/routes for intern milestones page and admin extension requests page
- `MyProjectPage.tsx`: add "Request Extension" button + dialog on each project card
- `ReportsPage.tsx`: add "Export All as CSV" button and export logic

### Remove
- Nothing removed

## Implementation Plan

1. **Backend:**
   - Add `ExtensionRequest` type/module with fields: id, projectId, internPrincipal, reason, requestedEndDate, status (#pending/#approved/#rejected), adminNote, createdAt
   - Implement `requestProjectExtension`, `getExtensionRequestsForIntern`, `getAllExtensionRequests`, `respondToExtensionRequest`
   - On approval, update project's endDate with the requested date
   - Send notification to intern on admin response

2. **Frontend:**
   - New page: `src/frontend/src/pages/intern/InternMilestonesPage.tsx` — aggregated milestone view across all intern's projects with inline status updates
   - New page: `src/frontend/src/pages/admin/ExtensionRequestsPage.tsx` — table of all extension requests with approve/reject actions
   - Modify `MyProjectPage.tsx`: add "Request Extension" button + dialog per project card
   - Modify `ReportsPage.tsx`: add CSV export button + client-side CSV generation/download
   - Modify `InternShell.tsx`: add Milestones nav item
   - Modify `AdminShell.tsx`: add Extensions nav item
   - Modify `App.tsx`: register new routes
