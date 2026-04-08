import { apiClient } from "./api";

export interface DashboardStatsResponse {
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

export interface DashboardStatsParams {
    usersTrendStartDate?: string;
    usersTrendEndDate?: string;
    newUsersTrendStartDate?: string;
    newUsersTrendEndDate?: string;
}

export const getDashboardStats = async (params?: DashboardStatsParams): Promise<DashboardStatsResponse> => {
    const response = await apiClient.get('/web/analytics/dashboard-stats', { params });
    return response.data.data;
};

export const getGlobalAnalytics = async () => {
    return new Promise((resolve) => setTimeout(() => resolve({}), 300));
};

// Interfaces for Requests
export interface TrendRequestParams {
    startDate?: string;
    endDate?: string;
    groupBy?: 'DAY' | 'WEEK' | 'MONTH';
    fsObjectId?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// Interfaces for Responses
export interface TrendResponse {
    success: boolean;
    data: unknown;
    message: string;
}

export interface AnalyticsListResponse {
    success: boolean;
    data: unknown;
    message: string;
}

// REST API Service Methods
export const getDownloadsTrend = async (params?: TrendRequestParams): Promise<TrendResponse> => {
    const response = await apiClient.get('/web/analytics/get-downloads-trend', { params });
    return response.data;
};

export const getViewsTrend = async (params?: TrendRequestParams): Promise<TrendResponse> => {
    const response = await apiClient.get('/web/analytics/get-views-trend', { params });
    return response.data;
};

export const getNewUsersTrend = async (params?: TrendRequestParams): Promise<TrendResponse> => {
    const response = await apiClient.get('/web/analytics/new-users-trend', { params });
    return response.data;
};

export const getTopDownloaded = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/top-downloaded', { params });
    return response.data;
};

export const getTopViewed = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/top-viewed', { params });
    return response.data;
};

export const getReferenceUsers = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/get-reference-users', { params });
    return response.data;
};

export const getMyReferenceUsers = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/get-my-reference-users', { params });
    return response.data;
};

export const getUserSharedFilesOrFolders = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/user-shared-files-or-folders', { params });
    return response.data;
};

export const getTopUsers = async (params?: PaginationParams): Promise<AnalyticsListResponse> => {
    const response = await apiClient.get('/web/analytics/top-users', { params });
    return response.data;
};
