import { apiClient } from "./api";
import type { UserRole } from "../store/auth.store";

const superAdminEmails = (import.meta.env.VITE_ADMIN_TOKEN ?? "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

export const login = async (email: string, otp: string): Promise<{ token: string; user: { email: string; role: UserRole } }> => {
    try {
        const response = await apiClient.post("/web/admin/auth/verify-otp", { email, otp });
        const { token, user } = response.data?.data || {};
        const resolvedEmail = user?.email || email;
        const role = superAdminEmails.includes(resolvedEmail.toLowerCase()) ? "superadmin" : "admin";
        return {
            token: token || response.data?.token,
            user: { email: resolvedEmail, role }
        };
    } catch (error: unknown) {
        const authError = error as import('axios').AxiosError<{ message?: string; error?: string }>;
        const errorMessage = authError.response?.data?.error || authError.response?.data?.message || "Invalid OTP";
        throw new Error(errorMessage);
    }
};

export const sendOtp = async (email: string): Promise<void> => {
    try {
        await apiClient.post("/web/admin/auth/send-otp", { email });
    } catch (error: unknown) {
        const authError = error as import('axios').AxiosError<{ message?: string; error?: string }>;
        const errorMessage = authError.response?.data?.message || authError.response?.data?.error || "Failed to send OTP";
        throw new Error(errorMessage);
    }
};

export const isSuperAdminEmail = (email: string): boolean => {
    return superAdminEmails.includes(email.toLowerCase());
};

export const logout = async (): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), 300);
    });
};
