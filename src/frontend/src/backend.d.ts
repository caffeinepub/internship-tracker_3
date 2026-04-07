import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface View__2 {
    bio: string;
    principal: Principal;
    name: string;
    photoUrl?: string;
    email: string;
    links: Array<string>;
    registrationStatus: Type__4;
    skills: Array<string>;
}
export interface View__5 {
    id: bigint;
    notificationType: Type__11;
    isRead: boolean;
    message: string;
    timestamp: bigint;
    relatedId: bigint;
    recipientPrincipal: Principal;
}
export interface Type__7 {
    id: string;
    files: Array<Type__6>;
    authorId: Principal;
    parentCommitId?: string;
    message: string;
    timestamp: bigint;
    branchId: string;
}
export interface Type__15 {
    id: string;
    title: string;
    content: string;
    authorId: Principal;
    isActive: boolean;
    timestamp: bigint;
}
export interface Type__10 {
    id: string;
    completedAt?: bigint;
    title: string;
    isCompleted: boolean;
}
export interface Type__12 {
    content: string;
    fileName: string;
    timestamp: bigint;
    commitId: string;
}
export interface Type__6 {
    content: string;
    name: string;
    path: string;
}
export interface View {
    id: bigint;
    status: Type;
    title: string;
    assignedInterns: Array<Principal>;
    endDate: string;
    tags: Array<string>;
    description: string;
    isPinned: boolean;
    subtasks: Array<Type__1>;
    startDate: string;
}
export interface View__1 {
    id: bigint;
    content: string;
    recipient: Principal;
    fileName?: string;
    fileSize?: bigint;
    isRead: boolean;
    sender: Principal;
    messageType: Type__3;
    timestamp: bigint;
    fileUrl?: string;
}
export interface View__6 {
    id: bigint;
    internPrincipal: Principal;
    status: Type__2;
    title: string;
    createdAt: bigint;
    dueDate: string;
    description: string;
    projectId: bigint;
}
export interface View__4 {
    id: bigint;
    internPrincipal: Principal;
    title: string;
    hours: bigint;
    date: string;
    createdAt: bigint;
    description: string;
    projectId: bigint;
}
export interface Type__9 {
    internId: Principal;
    feedback: string;
    score: bigint;
    timestamp: bigint;
    category: string;
    adminId: Principal;
}
export interface Type__13 {
    id: string;
    ownerId: Principal;
    name: string;
    projectId: string;
    isLocked: boolean;
}
export interface Type__1 {
    id: string;
    title: string;
    isCompleted: boolean;
    dueDate?: bigint;
}
export interface Type__14 {
    totalActivities: bigint;
    totalHours: bigint;
    recentActivities: Array<View__4>;
    completedMilestones: bigint;
    hoursByProject: Array<[bigint, bigint]>;
    totalMilestones: bigint;
    projectCount: bigint;
    activeInternCount: bigint;
}
export interface View__3 {
    id: bigint;
    internPrincipal: Principal;
    status: Type__5;
    createdAt: bigint;
    adminNote?: string;
    projectId: bigint;
    requestedEndDate: string;
    reason: string;
}
export enum Type {
    active = "active",
    completed = "completed",
    planning = "planning"
}
export enum Type__11 {
    projectAssigned = "projectAssigned",
    messageReceived = "messageReceived",
    announcement = "announcement",
    newApprovalRequest = "newApprovalRequest",
    performanceScored = "performanceScored",
    milestoneUpdate = "milestoneUpdate",
    commitPushed = "commitPushed"
}
export enum Type__2 {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export enum Type__3 {
    file = "file",
    systemMsg = "systemMsg",
    text = "text",
    image = "image"
}
export enum Type__4 {
    active = "active",
    pending = "pending",
    rejected = "rejected"
}
export enum Type__5 {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_file_image {
    file = "file",
    image = "image"
}
export interface backendInterface {
    addPerformanceScore(internId: Principal, score: bigint, feedback: string, category: string): Promise<void>;
    addProjectTag(projectId: bigint, tag: string): Promise<void>;
    addSubtask(projectId: bigint, title: string, dueDate: bigint | null): Promise<void>;
    approveInternRegistration(userPrincipal: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignInternToProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    completeOnboardingItem(itemId: string): Promise<void>;
    createAnnouncement(title: string, content: string): Promise<Type__15>;
    createBranch(name: string, projectId: string, ownerId: Principal): Promise<Type__13>;
    createMilestone(arg0: {
        title: string;
        dueDate: string;
        description: string;
        projectId: bigint;
    }): Promise<View__6>;
    createProject(arg0: {
        title: string;
        endDate: string;
        description: string;
        startDate: string;
    }): Promise<View>;
    deactivateAnnouncement(id: string): Promise<void>;
    getActiveAnnouncements(): Promise<Array<Type__15>>;
    getActivitiesForIntern(intern: Principal): Promise<Array<View__4>>;
    getActivitiesForProject(projectId: bigint): Promise<Array<View__4>>;
    getAllActivities(): Promise<Array<View__4>>;
    getAllAnnouncements(): Promise<Array<Type__15>>;
    getAllBranches(): Promise<Array<Type__13>>;
    getAllCommits(): Promise<Array<Type__7>>;
    getAllExtensionRequests(): Promise<Array<View__3>>;
    getAllInterns(): Promise<Array<View__2>>;
    getAllMilestones(): Promise<Array<View__6>>;
    getAllPendingInterns(): Promise<Array<View__2>>;
    getAllProjects(): Promise<Array<View>>;
    getAllRejectedInterns(): Promise<Array<View__2>>;
    getAllUsers(): Promise<Array<View__2>>;
    getAnalyticsSummary(): Promise<Type__14>;
    getAverageScore(internId: Principal): Promise<number | null>;
    getBranchForIntern(internId: Principal): Promise<Type__13 | null>;
    getCallerUserProfile(): Promise<View__2 | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommitById(commitId: string): Promise<Type__7 | null>;
    getCommitsForBranch(branchId: string): Promise<Array<Type__7>>;
    getConversation(otherUser: Principal): Promise<Array<View__1>>;
    getConversationMessages(withUser: Principal, limit: bigint, before: bigint | null): Promise<Array<View__1>>;
    getExtensionRequestsForIntern(intern: Principal): Promise<Array<View__3>>;
    getFileHistory(branchId: string, fileName: string): Promise<Array<Type__12>>;
    getLatestFiles(branchId: string): Promise<Array<Type__6>>;
    getMessagesForCaller(): Promise<Array<View__1>>;
    getMilestonesForIntern(intern: Principal): Promise<Array<View__6>>;
    getMilestonesForProject(projectId: bigint): Promise<Array<View__6>>;
    getNotificationsForCaller(): Promise<Array<View__5>>;
    getOnboardingChecklist(internId: Principal): Promise<Array<Type__10>>;
    getPinnedProjects(): Promise<Array<View>>;
    getProject(id: bigint): Promise<View | null>;
    getProjectsByStatus(status: Type): Promise<Array<View>>;
    getProjectsForIntern(intern: Principal): Promise<Array<View>>;
    getScoresForIntern(internId: Principal): Promise<Array<Type__9>>;
    getUnreadCount(): Promise<bigint>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<View__2 | null>;
    getUserRole(user: Principal): Promise<Type__8>;
    initializeOnboarding(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    logActivity(projectId: bigint, title: string, description: string, date: string, hours: bigint): Promise<View__4>;
    markAllNotificationsRead(): Promise<void>;
    markMessageRead(messageId: bigint): Promise<void>;
    markNotificationRead(notificationId: bigint): Promise<void>;
    promoteToAdmin(user: Principal): Promise<void>;
    pushCommit(branchId: string, message: string, files: Array<Type__6>): Promise<Type__7>;
    registerIntern(arg0: {
        bio: string;
        name: string;
        email: string;
    }): Promise<void>;
    rejectInternRegistration(userPrincipal: Principal): Promise<void>;
    removeProject(id: bigint): Promise<void>;
    requestProjectExtension(projectId: bigint, reason: string, requestedEndDate: string): Promise<View__3>;
    respondToExtensionRequest(requestId: bigint, approved: boolean, adminNote: string | null): Promise<void>;
    saveCallerUserProfile(profile: View__2): Promise<void>;
    searchInterns(searchTerm: string): Promise<Array<View__2>>;
    searchProjects(searchTerm: string): Promise<Array<View>>;
    sendFileMessage(recipient: Principal, fileUrl: string, fileName: string, fileSize: bigint, messageType: Variant_file_image): Promise<View__1>;
    sendMessage(recipient: Principal, content: string): Promise<View__1>;
    toggleBranchLock(branchId: string): Promise<void>;
    toggleProjectPin(projectId: bigint): Promise<void>;
    toggleSubtask(projectId: bigint, subtaskId: string): Promise<void>;
    unassignInternFromProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    updateMilestoneStatus(milestoneId: bigint, status: Type__2): Promise<void>;
    updateProfile(arg0: {
        bio: string;
        name: string;
        photoUrl?: string;
        email: string;
        links: Array<string>;
        skills: Array<string>;
    }): Promise<void>;
    updateProject(project: View): Promise<void>;
}
