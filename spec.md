# Internship Tracker - Phase 3

## Current State
- Backend: Motoko actor with users, projects, activity logs, messages, RBAC
- Frontend: Admin shell (dashboard, interns, projects, activity, messages, settings) and Intern shell (dashboard, projects, activity log, messages, profile)
- Phase 2 delivered: intern approval with principal lookup, project-to-intern assignment, activity logging, messaging
- Existing backend APIs: getAllActivities, getActivitiesForIntern, getActivitiesForProject, getAllProjects, getAllInterns, etc.

## Requested Changes (Diff)

### Add
1. **Analytics Page (Admin)** - A dedicated analytics page accessible from admin sidebar with:
   - Bar chart: intern activity hours by week (last 8 weeks)
   - Bar chart: activity entries per project
   - Line chart: cumulative hours over time
   - Project progress overview cards (completion %, active interns count)
2. **Milestones / Commit Tracking** - Interns can add milestone entries tied to a project:
   - Milestone has: title, description, status (pending/in_progress/completed), dueDate, projectId
   - Admin can view all milestones across all projects
   - Intern can manage their own milestones on the My Projects page
3. **Notification System** - In-app notifications for key events:
   - Notification type: new_approval_request, project_assigned, milestone_update, message_received
   - Backend stores notifications per user
   - Bell icon in sidebar header with unread count badge
   - Notifications dropdown/page to view and mark as read

### Modify
- Admin sidebar: add "Analytics" nav item (BarChart icon)
- Admin dashboard: update to show total milestones stat card
- Intern shell: sidebar bell icon with notification count
- Admin shell: sidebar bell icon with notification count
- Intern's My Projects page: add a milestones section per project
- Registration flow: auto-create notification for admins when new intern registers
- Project assignment: auto-create notification for intern when assigned to a project

### Remove
- Nothing removed

## Implementation Plan
1. Add Milestone type and storage to Motoko backend (id, internPrincipal, projectId, title, description, status, dueDate, createdAt)
2. Add Notification type and storage to Motoko backend (id, recipientPrincipal, notificationType, message, relatedId, isRead, timestamp)
3. Add backend functions: createMilestone, updateMilestoneStatus, getMilestonesForIntern, getMilestonesForProject, getAllMilestones
4. Add backend functions: createNotification (internal), getNotificationsForCaller, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount
5. Trigger notifications in: registerIntern (notify admins), assignInternToProject (notify intern), milestone status change (notify relevant parties)
6. Regenerate frontend bindings (backend.d.ts)
7. Build Admin Analytics page using recharts/shadcn chart component with real activity data
8. Build Admin Milestones view (filterable table across all projects)
9. Add Milestones section to intern My Projects page
10. Build Notifications dropdown in both admin and intern sidebars
11. Wire admin sidebar to include Analytics nav item
