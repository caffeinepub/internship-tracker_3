import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface View__3 {
    id: bigint;
    internPrincipal: Principal;
    title: string;
    hours: bigint;
    date: string;
    createdAt: bigint;
    description: string;
    projectId: bigint;
}
export interface View__2 {
    bio: string;
    principal: Principal;
    name: string;
    email: string;
    registrationStatus: Type__2;
    skills: Array<string>;
}
export interface View__5 {
    id: bigint;
    internPrincipal: Principal;
    status: Type__1;
    title: string;
    createdAt: bigint;
    dueDate: string;
    description: string;
    projectId: bigint;
}
export interface View__4 {
    id: bigint;
    notificationType: Type__4;
    isRead: boolean;
    message: string;
    timestamp: bigint;
    relatedId: bigint;
    recipientPrincipal: Principal;
}
export interface View__6 {
    id: bigint;
    projectId: bigint;
    internPrincipal: Principal;
    reason: string;
    requestedEndDate: string;
    status: Type__6;
    adminNote: string | null;
    createdAt: bigint;
}
export interface Type__5 {
    totalActivities: bigint;
    totalHours: bigint;
    recentActivities: Array<View__3>;
    completedMilestones: bigint;
    hoursByProject: Array<[bigint, bigint]>;
    totalMilestones: bigint;
    projectCount: bigint;
    activeInternCount: bigint;
}
export interface View {
    id: bigint;
    status: Type;
    title: string;
    assignedInterns: Array<Principal>;
    endDate: string;
    description: string;
    startDate: string;
}
export interface View__1 {
    id: bigint;
    content: string;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    timestamp: bigint;
}
export enum Type {
    active = "active",
    completed = "completed",
    planning = "planning"
}
export enum Type__1 {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export enum Type__2 {
    active = "active",
    pending = "pending",
    rejected = "rejected"
}
export enum Type__4 {
    projectAssigned = "projectAssigned",
    messageReceived = "messageReceived",
    newApprovalRequest = "newApprovalRequest",
    milestoneUpdate = "milestoneUpdate"
}
export enum Type__6 {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveInternRegistration(userPrincipal: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignInternToProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    createMilestone(arg0: {
        title: string;
        dueDate: string;
        description: string;
        projectId: bigint;
    }): Promise<View__5>;
    createProject(arg0: {
        title: string;
        endDate: string;
        description: string;
        startDate: string;
    }): Promise<View>;
    getActivitiesForIntern(intern: Principal): Promise<Array<View__3>>;
    getActivitiesForProject(projectId: bigint): Promise<Array<View__3>>;
    getAllActivities(): Promise<Array<View__3>>;
    getAllExtensionRequests(): Promise<Array<View__6>>;
    getAllInterns(): Promise<Array<View__2>>;
    getAllMilestones(): Promise<Array<View__5>>;
    getAllPendingInterns(): Promise<Array<View__2>>;
    getAllProjects(): Promise<Array<View>>;
    getAllRejectedInterns(): Promise<Array<View__2>>;
    getAllUsers(): Promise<Array<View__2>>;
    getAnalyticsSummary(): Promise<Type__5>;
    getCallerUserProfile(): Promise<View__2 | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherUser: Principal): Promise<Array<View__1>>;
    getExtensionRequestsForIntern(intern: Principal): Promise<Array<View__6>>;
    getMessagesForCaller(): Promise<Array<View__1>>;
    getMilestonesForIntern(intern: Principal): Promise<Array<View__5>>;
    getMilestonesForProject(projectId: bigint): Promise<Array<View__5>>;
    getNotificationsForCaller(): Promise<Array<View__4>>;
    getProject(id: bigint): Promise<View | null>;
    getProjectsByStatus(status: Type): Promise<Array<View>>;
    getProjectsForIntern(intern: Principal): Promise<Array<View>>;
    getUnreadCount(): Promise<bigint>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<View__2 | null>;
    getUserRole(user: Principal): Promise<Type__3>;
    isCallerAdmin(): Promise<boolean>;
    logActivity(projectId: bigint, title: string, description: string, date: string, hours: bigint): Promise<View__3>;
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
    requestProjectExtension(projectId: bigint, reason: string, requestedEndDate: string): Promise<View__6>;
    respondToExtensionRequest(requestId: bigint, approved: boolean, adminNote: string | null): Promise<void>;
    saveCallerUserProfile(profile: View__2): Promise<void>;
    sendMessage(recipient: Principal, content: string): Promise<View__1>;
    unassignInternFromProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    updateMilestoneStatus(milestoneId: bigint, status: Type__1): Promise<void>;
    updateProfile(arg0: {
        bio: string;
        name: string;
        email: string;
        skills: Array<string>;
    }): Promise<void>;
    updateProject(project: View): Promise<void>;
}
