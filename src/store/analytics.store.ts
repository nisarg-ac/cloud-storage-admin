import { create } from "zustand";
import * as analyticsService from "../services/analytics.service";

export interface DashboardStats {
    summary: {
        totalUsers: number;
        activeUsers: number;
        deletedUsers: number;
        totalStorageBytes: number;
        totalSharedLinkViews: number;
    };
    trends: {
        storageUsageTrend: { month: string; storageGB: number }[];
        fileViewsTrend: { month: string; viewCount: number }[];
        downloadsTrend: { month: string; downloadCount: number }[];
        newUsersTrend: { date: string; userCount: number }[];
        usersTrend: { date: string; activeCount: number; deletedCount: number }[];
    };
}

interface AnalyticsState {
    dashboardStats: DashboardStats | null;
    loading: boolean;
    error: string | null;
    fetchDashboardStats: (params?: analyticsService.DashboardStatsParams) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    dashboardStats: null,
    loading: false,
    error: null,
    fetchDashboardStats: async (params) => {
        set({ loading: true, error: null });
        try {
            const stats = await analyticsService.getDashboardStats(params);
            set({ dashboardStats: stats, loading: false });
        } catch (err: unknown) {
            const error = err as Error;
            set({ error: error.message, loading: false });
        }
    }
}));
