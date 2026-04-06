import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MessageView {
    id: bigint;
    content: string;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    timestamp: bigint;
}
export interface UserProfileView {
    bio: string;
    principal: Principal;
    name: string;
    email: string;
    registrationStatus: RegistrationStatus;
    skills: Array<string>;
}
export interface ActivityLogView {
    id: bigint;
    internPrincipal: Principal;
    title: string;
    hours: bigint;
    date: string;
    createdAt: bigint;
    description: string;
    projectId: bigint;
}
export interface ProjectView {
    id: bigint;
    status: ProjectStatus;
    title: string;
    assignedInterns: Array<Principal>;
    endDate: string;
    description: string;
    startDate: string;
}
export interface MilestoneView {
    id: bigint;
    internPrincipal: Principal;
    projectId: bigint;
    title: string;
    description: string;
    status: MilestoneStatus;
    dueDate: string;
    createdAt: bigint;
}
export interface NotificationView {
    id: bigint;
    recipientPrincipal: Principal;
    notificationType: NotificationType;
    message: string;
    relatedId: bigint;
    isRead: boolean;
    timestamp: bigint;
}
export interface AnalyticsSummary {
    totalHours: bigint;
    totalActivities: bigint;
    totalMilestones: bigint;
    completedMilestones: bigint;
    activeInternCount: bigint;
    projectCount: bigint;
    hoursByProject: Array<[bigint, bigint]>;
    recentActivities: Array<ActivityLogView>;
}
export enum ProjectStatus {
    active = "active",
    completed = "completed",
    planning = "planning"
}
export enum RegistrationStatus {
    active = "active",
    pending = "pending",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum MilestoneStatus {
    pending = "pending",
    inProgress = "inProgress",
    completed = "completed"
}
export enum NotificationType {
    newApprovalRequest = "newApprovalRequest",
    projectAssigned = "projectAssigned",
    milestoneUpdate = "milestoneUpdate",
    messageReceived = "messageReceived"
}
// Legacy type aliases for backward compatibility
export type View__1 = MessageView;
export type View__2 = UserProfileView;
export type View__3 = ActivityLogView;
export type View = ProjectView;
export type Type = ProjectStatus;
export type Type__1 = RegistrationStatus;
export type Type__2 = UserRole;
export interface backendInterface {
    approveInternRegistration(userPrincipal: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignInternToProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    createProject(arg0: {
        title: string;
        endDate: string;
        description: string;
        startDate: string;
    }): Promise<ProjectView>;
    createMilestone(arg0: {
        projectId: bigint;
        title: string;
        description: string;
        dueDate: string;
    }): Promise<MilestoneView>;
    getActivitiesForIntern(intern: Principal): Promise<Array<ActivityLogView>>;
    getActivitiesForProject(projectId: bigint): Promise<Array<ActivityLogView>>;
    getAllActivities(): Promise<Array<ActivityLogView>>;
    getAllInterns(): Promise<Array<UserProfileView>>;
    getAllMilestones(): Promise<Array<MilestoneView>>;
    getAllPendingInterns(): Promise<Array<UserProfileView>>;
    getAllProjects(): Promise<Array<ProjectView>>;
    getAllRejectedInterns(): Promise<Array<UserProfileView>>;
    getAllUsers(): Promise<Array<UserProfileView>>;
    getAnalyticsSummary(): Promise<AnalyticsSummary>;
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherUser: Principal): Promise<Array<MessageView>>;
    getMessagesForCaller(): Promise<Array<MessageView>>;
    getMilestonesForIntern(intern: Principal): Promise<Array<MilestoneView>>;
    getMilestonesForProject(projectId: bigint): Promise<Array<MilestoneView>>;
    getNotificationsForCaller(): Promise<Array<NotificationView>>;
    getProject(id: bigint): Promise<ProjectView | null>;
    getProjectsByStatus(status: ProjectStatus): Promise<Array<ProjectView>>;
    getProjectsForIntern(intern: Principal): Promise<Array<ProjectView>>;
    getUnreadCount(): Promise<bigint>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    getUserRole(user: Principal): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    logActivity(projectId: bigint, title: string, description: string, date: string, hours: bigint): Promise<ActivityLogView>;
    markAllNotificationsRead(): Promise<void>;
    markMessageRead(messageId: bigint): Promise<void>;
    markNotificationRead(notificationId: bigint): Promise<void>;
    promoteToAdmin(user: Principal): Promise<void>;
    registerIntern(arg0: {
        bio: string;
        name: string;
        email: string;
    }): Promise<void>;
    rejectInternRegistration(userPrincipal: Principal): Promise<void>;
    removeProject(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfileView): Promise<void>;
    sendMessage(recipient: Principal, content: string): Promise<MessageView>;
    unassignInternFromProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    updateMilestoneStatus(milestoneId: bigint, status: MilestoneStatus): Promise<void>;
    updateProfile(arg0: {
        bio: string;
        name: string;
        email: string;
        skills: Array<string>;
    }): Promise<void>;
    updateProject(project: ProjectView): Promise<void>;
}
