import { apiClient } from "./api";

export type AppVersionPlatform = 'ANDROID' | 'IOS' | 'WEB' | 'OTHER';

export interface AppVersion {
    id: string;
    appVersion: string;
    title: string;
    description: string;
    updates: string[];
    platform: AppVersionPlatform;
    latestVersion: boolean;
    isHardUpdate: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AppVersionListParams {
    page?: number;
    limit?: number;
    platform?: AppVersionPlatform | '';
    search?: string;
    sortBy?: 'createdAt' | 'appVersion' | 'platform' | 'title';
    sortOrder?: 'asc' | 'desc';
}

export interface AppVersionListMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AppVersionListResponse {
    data: AppVersion[];
    meta: AppVersionListMeta;
}

export interface AddAppVersionPayload {
    appVersion: string;
    title: string;
    description: string;
    platform: AppVersionPlatform;
    isHardUpdate: boolean;
    updates?: string[];
}

export const appVersionsService = {
    list: async (params: AppVersionListParams = {}): Promise<AppVersionListResponse> => {
        const query: Record<string, string | number> = {};
        if (params.page) query.page = params.page;
        if (params.limit) query.limit = params.limit;
        if (params.platform) query.platform = params.platform;
        if (params.search) query.search = params.search;
        if (params.sortBy) query.sortBy = params.sortBy;
        if (params.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<{ success: boolean; data: AppVersion[]; meta: AppVersionListMeta }>(
            '/web/admin/app-versions',
            { params: query }
        );
        return { data: response.data.data, meta: response.data.meta };
    },

    add: async (payload: AddAppVersionPayload): Promise<AppVersion> => {
        const response = await apiClient.post<{ success: boolean; data: AppVersion }>(
            '/web/admin/app-versions',
            payload
        );
        return response.data.data;
    },

    remove: async (id: string): Promise<AppVersion> => {
        const response = await apiClient.delete<{ success: boolean; data: AppVersion }>(
            `/web/admin/app-versions/${id}`
        );
        return response.data.data;
    },
};
