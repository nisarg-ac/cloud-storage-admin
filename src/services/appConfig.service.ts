import { apiClient } from "./api";

export interface AppConfig {
    isWebsurfer: boolean;
    websurferUrl: string | null;
}

export interface AppConfigUpdateResponse {
    updatedKeys: string[];
}

export interface AdConfigRow {
    vendor: string;
    format: string;
    enabled: boolean;
    metadata: Record<string, unknown> | null;
    updated_by: string | null;
    updated_at: string;
}

export interface AdConfigUpsertPayload {
    enabled: boolean;
    metadata?: Record<string, unknown>;
}

export const appConfigService = {
    getAppConfig: async (): Promise<AppConfig> => {
        const response = await apiClient.get<{ data: AppConfig }>("/web/admin/config");
        return response.data.data;
    },

    updateAppConfig: async (config: Partial<AppConfig>): Promise<AppConfigUpdateResponse> => {
        const response = await apiClient.patch<{ data: AppConfigUpdateResponse }>("/web/admin/config", config);
        return response.data.data;
    },

    getAdConfig: async (): Promise<AdConfigRow[]> => {
        const response = await apiClient.get<{ data: { rows: AdConfigRow[] } }>("/web/admin/ad-config");
        return response.data.data.rows;
    },

    upsertAdConfig: async (vendor: string, format: string, payload: AdConfigUpsertPayload): Promise<AdConfigRow> => {
        const response = await apiClient.put<{ data: AdConfigRow }>(
            `/web/admin/ad-config/${encodeURIComponent(vendor)}/${encodeURIComponent(format)}`,
            payload
        );
        return response.data.data;
    },

    deleteAdConfig: async (vendor: string, format: string): Promise<void> => {
        await apiClient.delete(`/web/admin/ad-config/${encodeURIComponent(vendor)}/${encodeURIComponent(format)}`);
    },
};
