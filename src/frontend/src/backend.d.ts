import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type SimpleResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export type AuthResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: string;
};
export interface UserProfile {
    financierName: string;
    role: UserRole;
    businessName: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    staff = "staff"
}
export interface backendInterface {
    changePin(phone: string, currentHashedPin: string, newHashedPin: string): Promise<SimpleResult>;
    getUserProfile(phone: string): Promise<UserProfile | null>;
    login(phone: string, hashedPin: string): Promise<AuthResult>;
    phoneExists(phone: string): Promise<boolean>;
    register(phone: string, hashedPin: string, financierName: string, businessName: string, role: UserRole): Promise<SimpleResult>;
    resetPin(phone: string, newHashedPin: string): Promise<SimpleResult>;
}
