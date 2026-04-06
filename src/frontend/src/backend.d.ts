import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface View__1 {
    bio: string;
    name: string;
    email: string;
    registrationStatus: Type__1;
    skills: Array<string>;
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
export enum Type {
    active = "active",
    completed = "completed",
    planning = "planning"
}
export enum Type__1 {
    active = "active",
    pending = "pending",
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
    createProject(arg0: {
        title: string;
        endDate: string;
        description: string;
        startDate: string;
    }): Promise<View>;
    getAllInterns(): Promise<Array<View__1>>;
    getAllPendingInterns(): Promise<Array<View__1>>;
    getAllProjects(): Promise<Array<View>>;
    getAllRejectedInterns(): Promise<Array<View__1>>;
    getAllUsers(): Promise<Array<View__1>>;
    getCallerUserProfile(): Promise<View__1 | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProject(id: bigint): Promise<View | null>;
    getProjectsByStatus(status: Type): Promise<Array<View>>;
    getProjectsForIntern(intern: Principal): Promise<Array<View>>;
    getUserProfile(user: Principal): Promise<View__1 | null>;
    getUserRole(user: Principal): Promise<Type__2>;
    isCallerAdmin(): Promise<boolean>;
    promoteToAdmin(user: Principal): Promise<void>;
    registerIntern(arg0: {
        bio: string;
        name: string;
        email: string;
    }): Promise<void>;
    rejectInternRegistration(userPrincipal: Principal): Promise<void>;
    removeProject(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: View__1): Promise<void>;
    unassignInternFromProject(arg0: {
        internPrincipal: Principal;
        projectId: bigint;
    }): Promise<void>;
    updateProfile(arg0: {
        bio: string;
        name: string;
        email: string;
        skills: Array<string>;
    }): Promise<void>;
    updateProject(project: View): Promise<void>;
}
