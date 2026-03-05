import { apiClient } from "./api";
import type { UserRole } from "../store/auth.store";

const superAdminEmails = (import.meta.env.VITE_ADMIN_TOKEN ?? "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

export const login = async (email: string, otp: string): Promise<{ token: string; user: { email: string; role: UserRole } }> => {
    try {
        const response = await apiClient.post("/auth/verify-otp", { email, otp });
        const { token, user } = response.data?.data || {};
        const resolvedEmail = user?.email || email;
        const role = superAdminEmails.includes(resolvedEmail.toLowerCase()) ? "superadmin" : "admin";
        return {
            token: token || response.data?.token,
            user: { email: resolvedEmail, role }
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Invalid OTP");
    }
};

export const logout = async (): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), 300);
    });
};
